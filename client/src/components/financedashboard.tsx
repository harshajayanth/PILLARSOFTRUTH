import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "@/components/ui/loading-spinner";

// ✅ Donation API type
interface Donation {
  UniqueId: string;
  Name: string;
  Amount: string;
  TimeStamp: string;
}

// ✅ Finance Sheet row type
interface FinanceRecord {
  id: string;
  meetingname: string;
  meetingdate: string; // YYYY-MM-DD
  totalamount: string;
  food: string;
  preacher: string;
  other: string;
  totalspendings: string;
  balance: string;
  donations: string;
  accountbalance: string;
  createdAt: string;
  modifiedAt: string;
  modifiedBy: string;
  iseditable: string;
}

interface User {
  id?: string;
  username: string;
  age?: string;
  phone?: string;
  email: string;
  role: string;
  access?: string;
}

export default function FinanceDashboard() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [financeRecords, setFinanceRecords] = useState<FinanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // ✅ Selected states
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>("");
  const [meetingName, setMeetingName] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // ✅ Spending fields
  const [food, setFood] = useState<string>("");
  const [preacher, setPreacher] = useState<string>("");
  const [other, setOther] = useState<string>("");

  const [isDisabled, setDisabled] = useState<boolean>(false);
  const [isAddModalOpen, setAddModalOpen] = useState<boolean>(false);

  // ✅ Modal fields for adding a new meeting
  const [newMeetingName, setNewMeetingName] = useState("");
  const [newMeetingDate, setNewMeetingDate] = useState("");
  const [newMeetingAmount, setNewMeetingAmount] = useState<number>(0);
  const [user, setUser] = useState<User | null>(null);

  // ✅ Account balance state for live UI update
  const [latestBankBalance, setLatestBankBalance] = useState<number>(0);

  // ✅ Loading states for buttons
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isAdding, setIsAdding] = useState<boolean>(false);

  const { toast } = useToast();
  const navigate = useNavigate();

  const getAmountColor = (amount: number, base: number) => {
    if (amount < base / 2) return "text-red-600";
    if (amount < base) return "text-orange-500";
    return "text-green-600"; // Healthy
  };

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();

      if (!data?.email || data.role !== "admin") {
        navigate("/"); // redirect if not admin
        return;
      }
      setUser(data);
    } catch (err) {
      console.error("Auth error:", err);
      navigate("/");
    }
  };

  useEffect(() => {
    fetchUser(); // check auth on mount
  }, []);

  // ✅ Fetch donations + finance records
  const fetchAllData = useCallback(async () => {
    setLoading(true);

    try {
      // ✅ Fetch donations + finance in parallel
      const [donRes, finRes] = await Promise.all([
        fetch("/api/donations"),
        fetch("/api/finance"),
      ]);

      if (!donRes.ok || !finRes.ok) {
        throw new Error("API fetch failed");
      }

      const donationData: Donation[] = await donRes.json();
      const financeData: FinanceRecord[] = await finRes.json();

      // ✅ Update state
      setDonations(donationData);
      setFinanceRecords(financeData);

      // ✅ Handle finance records
      if (financeData.length > 0) {
        const last = financeData.at(-1)!; // latest meeting
        const backendBalance = parseFloat(last.accountbalance || "0");

        // ✅ Always sync latest backend balance
        setLatestBankBalance(backendBalance);

        // ✅ If no meeting selected, default to latest one
        setSelectedMeetingId((prev) => prev || last.id);
      } else {
        setLatestBankBalance(0);
        setSelectedMeetingId("");
      }
    } catch (err) {
      console.error("❌ Failed to fetch all data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const totalDonations = donations.reduce(
    (sum, d) => sum + (parseFloat(d.Amount) || 0),
    0
  );

  // ✅ Meeting Dropdown Options
  const meetingOptions = financeRecords.map((m) => ({
    id: m.id,
    label: `${m.meetingname} (${m.meetingdate})`,
  }));

  // ✅ When a meeting is selected → load spendings
  useEffect(() => {
    if (!selectedMeetingId) return;

    const record = financeRecords.find((m) => m.id === selectedMeetingId);

    if (record) {
      setFood(record.food || "");
      setPreacher(record.preacher || "");
      setOther(record.other || "");

      setMeetingName(record.meetingname || "");
      setMeetingDate(record.meetingdate);
      setDisabled(record.iseditable === "TRUE" ? false : true);
    } else {
      setFood("");
      setPreacher("");
      setOther("");
      setMeetingName("");
      setMeetingDate("");
      setDisabled(false);
    }
  }, [selectedMeetingId, financeRecords]);

  // ✅ Sorted meetings + balanceMap
  const { balanceMap, sortedMeetings } = useMemo(() => {
    const sorted = [...financeRecords].sort(
      (a, b) =>
        new Date(a.meetingdate).getTime() - new Date(b.meetingdate).getTime()
    );

    let runningBalance = donations.reduce(
      (sum, d) => sum + (parseFloat(d.Amount) || 0),
      0
    );

    const map: Record<string, number> = {};
    sorted.forEach((m) => {
      const spendings =
        (Number(m.food) || 0) +
        (Number(m.preacher) || 0) +
        (Number(m.other) || 0);
      runningBalance -= spendings;
      map[m.id] = runningBalance;
    });

    return { balanceMap: map, sortedMeetings: sorted };
  }, [donations]);

  const selectedIndex = sortedMeetings.findIndex(
    (m) => m.id === selectedMeetingId
  );

  const currentMeeting =
    selectedIndex >= 0 ? sortedMeetings[selectedIndex] : null;

  const liveFood =
    parseFloat(food || (currentMeeting ? currentMeeting.food : "0")) || 0;
  const livePreacher =
    parseFloat(preacher || (currentMeeting ? currentMeeting.preacher : "0")) ||
    0;
  const liveOther =
    parseFloat(other || (currentMeeting ? currentMeeting.other : "0")) || 0;

  const meetingSpendings = liveFood + livePreacher + liveOther;

  const meetingAmount = currentMeeting
    ? parseFloat(currentMeeting.totalamount || "0")
    : 0;

  const meetingRemaining = meetingAmount - meetingSpendings;

  // ✅ Is latest meeting?
  const lastRecord = financeRecords.at(-1);
  const isLatestMeeting = lastRecord && selectedMeetingId === lastRecord.id;

  const atmDisplayBalance =
    isLatestMeeting && hasUnsavedChanges
      ? latestBankBalance - meetingSpendings // preview only before save
      : latestBankBalance; // always show backend value after save

  // ✅ Utility: Get latest account balance directly from last finance record
  const getLatestBackendBalance = async (): Promise<number> => {
    try {
      const res = await fetch("/api/finance");
      const data: FinanceRecord[] = await res.json();

      if (data.length === 0) return 0;

      const last = data.at(-1)!;
      return parseFloat(last.accountbalance || "0");
    } catch (err) {
      console.error("❌ Failed to fetch latest balance", err);
      return 0;
    }
  };

  // ✅ Save updated record to backend
  const updateRecord = async () => {
    if (!currentMeeting) {
      toast({ title: "No meeting selected", variant: "destructive" });
      return;
    }

    setIsSaving(true);

    try {
      // ✅ Always fetch the LATEST backend account balance
      const backendBalance = await getLatestBackendBalance();

      const now = new Date().toISOString();

      // ✅ Calculate spendings
      const totalSpendings =
        parseFloat(food || "0") +
        parseFloat(preacher || "0") +
        parseFloat(other || "0");

      // ✅ Safe parse of meeting total amount
      const meetingTotal = parseFloat(currentMeeting?.totalamount || "0");

      // ✅ New balance for this meeting
      const newMeetingBalance = meetingTotal - totalSpendings;

      // ✅ Start with backend balance
      let updatedAccountBalance = backendBalance;

      if (isLatestMeeting) {
        /**
         * If this is the LATEST meeting:
         * backendBalance - OLD meeting total + NEW recalculated balance
         */
        updatedAccountBalance =
          backendBalance - meetingTotal + newMeetingBalance;
      }

      // ✅ Build updated record
      const updatedMeeting: FinanceRecord = {
        ...currentMeeting,
        food: food.toString(),
        preacher: preacher.toString(),
        other: other.toString(),
        totalspendings: totalSpendings.toString(),
        balance: newMeetingBalance.toString(),
        accountbalance: updatedAccountBalance.toString(), // ✅ latest backend balance applied
        modifiedAt: now,
        modifiedBy: user?.email || "system",
        iseditable: "FALSE",
      };

      // ✅ Send update to backend
      const res = await fetch("/api/finance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedMeeting),
      });

      if (res.ok) {
        setHasUnsavedChanges(false);
        toast({ title: "✅ Meeting updated successfully!" });

        // ✅ Update live ATM balance immediately if it’s the latest meeting
        if (isLatestMeeting) {
          setLatestBankBalance(updatedAccountBalance);
        }

        setDisabled(true);

        // ✅ Always refresh everything after saving
        await fetchAllData();
      } else {
        const err = await res.json();
        toast({
          title: "❌ Update failed",
          description: err.message || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("❌ Update error:", error);
      toast({
        title: "Network Error",
        description: "Could not update meeting",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ Add new meeting
  const handleAddMeeting = async () => {
    if (!newMeetingName || !newMeetingDate || !newMeetingAmount) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }

    setIsAdding(true);

    try {
      // ✅ Always fetch backend's latest balance before adding
      const backendBalance = await getLatestBackendBalance();
      const updatedBankBalance = backendBalance + newMeetingAmount;

      const now = new Date().toISOString();

      const newMeeting: FinanceRecord = {
        id: uuidv4(),
        meetingname: newMeetingName,
        meetingdate: newMeetingDate,
        totalamount: newMeetingAmount.toString(),
        food: "0",
        preacher: "0",
        other: "0",
        totalspendings: "0",
        balance: newMeetingAmount.toString(),
        donations: "0",
        accountbalance: updatedBankBalance.toString(),
        createdAt: now,
        modifiedAt: now,
        modifiedBy: user?.email || "system",
        iseditable: "TRUE",
      };

      const res = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMeeting),
      });

      if (res.ok) {
        toast({ title: "✅ Meeting Added Successfully" });

        // ✅ Refresh from backend to keep balance accurate
        await fetchAllData();
        setAddModalOpen(false);
      } else {
        toast({ title: "❌ Failed to Add Meeting", variant: "destructive" });
      }
    } catch (err) {
      console.error("❌ Network Error:", err);
      toast({
        title: "Network Error",
        description: "Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  return loading ? (
    <div className="flex items-center flex-col justify-center h-screen">
      <LoadingSpinner />
      <p className="text-lg font-bold animate-pulse">Loading Finance...</p>
    </div>
  ) : (
    <div className="m-6">
      {/* ✅ Header */}
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2 mt-2">
        <button
          onClick={() => navigate("/")}
          className="text-gray-600 hover:text-black transition"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        POT Bank
      </h1>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* ✅ ATM STYLE CARD */}
          <div className="relative bg-black text-white rounded-2xl shadow-lg p-6 h-64 flex justify-between">
            <div>
              <h2 className="text-2xl font-bold">PILLARS OF TRUTH</h2>
              <p className="text-sm opacity-70 mt-1">Finance Account</p>

              <div className="mt-3">
                <p className="text-xs opacity-80">Card Number</p>
                <p className="text-lg font-mono">XXXX-XXXX-XXXX-2345</p>
              </div>

              <p className="text-sm opacity-70 mt-3">
                Updated:{" "}
                {financeRecords.length > 0
                  ? financeRecords.at(-1)?.meetingdate
                  : "No Meeting Data"}
              </p>

              <p className="text-sm opacity-70 mt-3">
                Last Modified:{" "}
                {financeRecords.length > 0
                  ? new Date(
                      financeRecords.at(-1)?.modifiedAt || ""
                    ).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "No Meeting Data"}
              </p>

              <p className="text-sm opacity-70 mt-3">
                Last Modified By:{" "}
                {financeRecords.length > 0
                  ? financeRecords.at(-1)?.modifiedBy
                  : "No Meeting Data"}
              </p>
            </div>

            {/* RIGHT: total balance */}
            <div className="flex flex-col items-end justify-between">
              <span className="material-icons text-[40px] text-green-400">
                account_balance
              </span>
              <p
                className={`text-4xl font-extrabold ${getAmountColor(
                  atmDisplayBalance,
                  totalDonations
                )}`}
              >
                ₹{atmDisplayBalance >= 0 ? atmDisplayBalance : 0}
              </p>
            </div>
          </div>

          {/* ✅ MEETING SELECTOR */}
          <div>
            <label className="block mb-2 font-semibold">Select Meeting</label>
            <select
              className="border rounded p-2 w-full"
              value={selectedMeetingId}
              onChange={(e) => setSelectedMeetingId(e.target.value)}
            >
              {meetingOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            <button
              className="mt-2 w-full bg-blue-500 text-white py-2 rounded disabled:opacity-50"
              disabled={isAdding}
              onClick={() => setAddModalOpen(true)}
            >
              + Add New Meeting
            </button>
          </div>

          {/* ✅ DONATIONS TABLE */}
          {/* ✅ FINANCE RECORDS TABLE */}
          <div className="bg-white shadow rounded-lg p-4">
            <h3 className="font-semibold mb-2">Finance Records</h3>

            {financeRecords.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No finance records available
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2">Meeting Name</th>
                      <th className="p-2">Meeting Date</th>
                      <th className="p-2 text-right">Total Amount</th>
                      <th className="p-2 text-right">Spendings</th>
                      <th className="p-2 text-right">Balance</th>
                      <th className="p-2 text-right">Account Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financeRecords
                      .sort(
                        (a, b) =>
                          new Date(b.meetingdate).getTime() -
                          new Date(a.meetingdate).getTime()
                      ) // ✅ Latest first
                      .map((rec) => {
                        const totalSpendings =
                          (parseFloat(rec.food || "0") || 0) +
                          (parseFloat(rec.preacher || "0") || 0) +
                          (parseFloat(rec.other || "0") || 0);

                        return (
                          <tr key={rec.id} className="border-t">
                            <td className="p-2">{rec.meetingname}</td>
                            <td className="p-2">
                              {new Date(rec.meetingdate).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                            </td>
                            <td className="p-2 text-right">
                              ₹
                              {parseFloat(
                                rec.totalamount || "0"
                              ).toLocaleString("en-IN")}
                            </td>
                            <td className="p-2 text-right">
                              ₹{totalSpendings.toLocaleString("en-IN")}
                            </td>
                            <td className="p-2 text-right">
                              ₹
                              {parseFloat(rec.balance || "0").toLocaleString(
                                "en-IN"
                              )}
                            </td>
                            <td className="p-2 text-right font-semibold">
                              ₹
                              {parseFloat(
                                rec.accountbalance || "0"
                              ).toLocaleString("en-IN")}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* ✅ TWO SUMMARY CARDS */}
          <div className="grid grid-cols-2 gap-4">
            {/* Total Donations */}
            <div className="bg-white p-4 rounded shadow flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">Total Donations</p>
                <p className="text-2xl font-bold text-blue-500">
                  ₹{totalDonations}
                </p>
              </div>
              <span className="material-icons text-blue-500 text-3xl">
                attach_money
              </span>
            </div>

            {/* Meeting Balance */}
            <div className="bg-white p-4 rounded shadow flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">Meeting Balance</p>
                <p
                  className={`text-2xl font-bold ${getAmountColor(
                    meetingRemaining,
                    meetingAmount
                  )}`}
                >
                  ₹{meetingRemaining}
                </p>
                <p className="text-xs text-gray-400">
                  (Original: ₹{meetingAmount})
                </p>
              </div>
              <span className="material-icons text-yellow-500 text-3xl">
                currency_rupee
              </span>
            </div>
          </div>

          {/* ✅ Spendings Inputs */}
          <div className="bg-gray-50 p-4 rounded shadow space-y-3">
            <h3 className="font-semibold text-lg">Spendings</h3>

            <div>
              <label className="flex gap-2 items-center font-bold">
                <span className="material-icons">dining</span> Food
              </label>
              <input
                type="number"
                className="border rounded w-full p-2"
                value={food}
                disabled={isDisabled}
                onChange={(e) => {
                  setFood(e.target.value);
                  setHasUnsavedChanges(true);
                }}
              />
            </div>

            <div>
              <label className="flex gap-2 items-center font-bold">
                <span className="material-icons">person</span> Preacher
              </label>
              <input
                type="number"
                className="border rounded w-full p-2"
                value={preacher}
                disabled={isDisabled}
                onChange={(e) => {
                  setPreacher(e.target.value);
                  setHasUnsavedChanges(true);
                }}
              />
            </div>

            <div>
              <label className="flex gap-2 items-center font-bold">
                <span className="material-icons">add_shopping_cart</span> Other
              </label>
              <input
                type="number"
                className="border rounded w-full p-2"
                value={other}
                disabled={isDisabled}
                onChange={(e) => {
                  setOther(e.target.value);
                  setHasUnsavedChanges(true);
                }}
              />
            </div>
          </div>

          {/* ✅ Summary */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
              Financial Summary
            </h3>

            {/* Record Sheet Style Table */}
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <span>Meeting Name :</span>
              <span>{meetingName}</span>
              <span>Meeting Date :</span>
              <span>{meetingDate}</span>
              <span className="text-gray-600">Meeting Amount:</span>
              <span className="font-medium text-gray-800">
                ₹{meetingAmount}
              </span>
              <span className="text-gray-600">Total Spendings:</span>
              <span className="font-medium text-gray-800">
                ₹{meetingSpendings}
              </span>

              <span className="text-gray-600">Meeting Balance:</span>
              <span
                className={`font-medium ${getAmountColor(
                  meetingRemaining,
                  meetingAmount
                )}`}
              >
                ₹{meetingRemaining}
              </span>
            </div>

            {/* ✅ Save Button */}
            {!isDisabled && (
              <button
                className={`mt-6 w-full ${
                  isDisabled
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                } text-white py-2 rounded-lg transition disabled:opacity-50`}
                disabled={isDisabled || isSaving}
                onClick={updateRecord}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            )}
          </div>
        </div>

        {/* ✅ New Meeting Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
            <div className="bg-white p-6 rounded shadow-lg w-96">
              <h2 className="text-lg font-bold mb-3">Add New Meeting</h2>

              {/* Meeting Name */}
              <input
                placeholder="Meeting Name"
                value={newMeetingName}
                onChange={(e) => setNewMeetingName(e.target.value)}
                className="border rounded w-full p-2 mb-3"
              />

              {/* Meeting Date */}
              <input
                type="date"
                value={newMeetingDate}
                onChange={(e) => setNewMeetingDate(e.target.value)}
                className="border rounded w-full p-2 mb-3"
              />

              {/* Total Amount */}
              <input
                placeholder="Meeting Total Amount"
                type="number"
                value={newMeetingAmount || ""}
                onChange={(e) => setNewMeetingAmount(Number(e.target.value))}
                className="border rounded w-full p-2 mb-3"
              />

              <div className="flex justify-end gap-2">
                <button
                  className="px-3 py-1 border rounded"
                  onClick={() => setAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMeeting}
                  disabled={isAdding}
                  className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
                >
                  {isAdding ? "Adding..." : "Add"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
