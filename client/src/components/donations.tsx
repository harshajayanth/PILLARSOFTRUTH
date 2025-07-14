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
  Confirmed: string; // "true" or "false"
}

interface User {
  email: string;
  name: string;
  role: string; // expected to be "admin" for admins
}

export default function DonationsPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
      <table className="min-w-full table-auto border">
        <thead className="bg-gray-100">
          <tr>
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
          {donations.map((d) => (
            <tr key={d.UniqueId}>
              <td className="border p-2">{d.Name}</td>
              <td className="border p-2">{d.Email}</td>
              <td className="border p-2">{d.Phone}</td>
              <td className="border p-2">₹{d.Amount}</td>
              <td className="border p-2">{d.Purpose}</td>
              <td className="border p-2">{d.TimeStamp}</td>
              <td className="border p-2 text-center">
                {d.Confirmed === "TRUE" ? (
                  <span className="material-symbols text-green bg-green">check_circle</span>
                ) : updatingId === d.UniqueId ? (
                  <span className="text-grey">Updating...</span>
                ) : (
                  <div className="space-x-2">
                    <button
                      className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
                      onClick={() => markAsReceived(d.UniqueId)}
                    >
                      Received
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
