import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Donation {
  UniqueId: string;
  Name: string;
  Email: string;
  Phone: string;
  Amount: string;
  Purpose: string;
  TimeStamp: string;
  Confirmed: string; // "TRUE" or "FALSE"
}

interface User {
  email: string;
  name: string;
  role: string; // expected "admin"
}

export default function DonationsPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState(""); // ✅ SEARCH TERM

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (!data?.email || data.role !== "admin") {
        navigate("/"); // not admin
      } else {
        setUser(data);
      }
    } catch (err) {
      console.error("Auth error:", err);
      navigate("/");
    }
  };

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/donations/list");
      const data = await res.json();
      setDonations(data);
    } catch (err) {
      console.error("Failed to fetch donations:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsReceived = async (uniqueId: string) => {
    try {
      setUpdatingId(uniqueId);
      await fetch("/api/donations/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uniqueId }),
      });
      await fetchDonations();
    } catch (err) {
      console.error("Failed to update donation:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    fetchUser().then(fetchDonations);
  }, []);

  // ✅ Filter donations based on search term
  const filteredDonations = donations.filter((d) => {
  const query = searchTerm.trim().toLowerCase();

  if (!query) return true; // show all if empty

  const name = (d.Name ?? "").toString().toLowerCase();
  const email = (d.Email ?? "").toString().toLowerCase();
  const amount = (d.Amount ?? "").toString().toLowerCase();
  const purpose = (d.Purpose ?? "").toString().toLowerCase();
  const time = (d.TimeStamp ?? "").toString().toLowerCase();

  const confirmedStatus =
    d.Confirmed?.toString().toUpperCase() === "TRUE" ? "received" : "pending";

  // If query is a number, allow exact match on amount
  if (!isNaN(Number(query))) {
    return amount === query;
  }

  // Otherwise match any field
  return (
    name.includes(query) ||
    email.includes(query) ||
    amount.includes(query) ||
    purpose.includes(query) ||
    time.includes(query) ||
    confirmedStatus.includes(query)
  );
});


  if (loading || !user) {
    return (
      <div className="p-6 text-center text-lg text-gray-600">
        Loading donations...
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-600 hover:text-black transition"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        Donations
      </h1>

      {/* ✅ Search Box */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, email, amount, status(Received or Pending), or time..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border px-3 py-2 rounded w-full"
        />
      </div>

      <table className="min-w-full table-auto border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">S.No</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Phone</th>
            <th className="border p-2">Amount</th>
            <th className="border p-2">Purpose</th>
            <th className="border p-2">Time</th>
            <th className="border p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredDonations.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center p-4 text-gray-500">
                No donations found.
              </td>
            </tr>
          ) : (
            filteredDonations.map((d, index) => (
              <tr key={d.UniqueId}>
                <td className="border p-2">{index + 1}</td>
                <td className="border p-2">{d.Name}</td>
                <td className="border p-2">{d.Email}</td>
                <td className="border p-2">{d.Phone}</td>
                <td className="border p-2">₹{d.Amount}</td>
                <td className="border p-2">{d.Purpose}</td>
                <td className="border p-2">{d.TimeStamp}</td>
                <td className="border p-2 text-center">
                  {d.Confirmed === "TRUE" ? (
                    <span className="material-symbols text-green bg-green">
                      check_circle
                    </span>
                  ) : updatingId === d.UniqueId ? (
                    <span className="text-grey">Updating...</span>
                  ) : (
                    <button
                      className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
                      onClick={() => markAsReceived(d.UniqueId)}
                    >
                      Received
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
