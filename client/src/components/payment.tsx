import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "@/lib/auth";

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [uniqueId] = useState(uuidv4());
  const data = location.state;

  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, confirmed: false, uniqueId }),
      });
      navigate("/");
    } catch (err) {
      console.error("Failed to submit donation:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!data && !user?.isAuthenticated) {
      navigate("/");
    }
  }, [data, navigate]);

  if (!data) return null;

  const upiLink = `upi://pay?pa=9491364620@slc&pn=${encodeURIComponent(
    data.name
  )}&am=${data.amount}&cu=INR&tn=${encodeURIComponent(data.purpose)}`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-gray-50 text-center">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold text-green-700 mb-2">Scan & Pay</h1>
        <p className="text-sm text-gray-600 mb-4">
          Thank you for your support!
        </p>

        <div className="text-center">
          {/* Receiver Details */}
          <p className="text-lg font-semibold">Mr Harsha Mulaparthi</p>
          <p className="text-sm text-gray-600">****620@slc</p>

          <p className="text-xs text-gray-500 mt-2">
            Please verify the receiver details before making payment.
          </p>
          <br></br>
        </div>
        <QRCodeSVG
          value={upiLink}
          size={180}
          className="mb-4 mx-auto border p-2"
        />

        {/* UPI Icons */}
        <div className="flex justify-center space-x-6 mb-4">
          <img src="images/paymentoptions.png" alt="GPay" className="h-8" />
        </div>

        <div className="text-left text-sm text-gray-700 space-y-2 mb-4">
          <p>
            <span className="font-semibold">Name:</span> {data.name}
          </p>
          <p>
            <span className="font-semibold">Email:</span> {data.email}
          </p>
          <p>
            <span className="font-semibold">Amount:</span> ₹{data.amount}
          </p>
          <p>
            <span className="font-semibold">Purpose:</span> {data.purpose}
          </p>
        </div>

        <label className="flex items-start space-x-2 mb-4 text-left">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={() => setConfirmed(!confirmed)}
            className="mt-1"
          />
          <span className="text-sm text-gray-600">
            I confirm that the above details are correct and I’ve completed the
            payment.
          </span>
        </label>

        {confirmed && (
          <div className="space-y-2">
            <button
              onClick={handleConfirm}
              disabled={loading}
              className={`w-full text-white py-2 rounded transition ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-700 hover:bg-green-800"
              }`}
            >
              {loading ? "Confirming..." : "Confirm"}
            </button>
          </div>
        )}

        <button
          onClick={() => navigate("/")}
          className="w-full border border-gray-400 text-gray-700 py-2 rounded hover:bg-gray-100 transition mt-2"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
}
