import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";

export default function DonateModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    purpose: "",
    amount: "",
  });

  const [errors, setErrors] = useState({
    phone: "",
    amount: "",
  });

  // 🔒 Only render if authenticated
  if (!user?.isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 max-w-md w-full text-center relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-4 text-gray-500 hover:text-gray-700 text-2xl"
          >
            &times;
          </button>
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            You must be signed in to donate.
          </p>
        </div>
      </div>
    );
  }

  const validateForm = () => {
    let valid = true;
    const newErrors = { phone: "", amount: "" };

    const phoneRegex = /^\+[1-9]\d{7,14}$/;
    if (!phoneRegex.test(formData.phone)) {
      newErrors.phone =
        "Enter valid phone number with country code (e.g., +919876543210)";
      valid = false;
    }

    if (!formData.amount || Number(formData.amount) < 0) {
      newErrors.amount = "Amount must be at least ₹100";
      valid = false;
    }

    if (!formData.amount || Number(formData.amount) > 5000) {
      newErrors.amount = "Amount must be at less than ₹5000";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      navigate("/payment", { state: formData });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-500 hover:text-gray-700 text-2xl"
        >
          &times;
        </button>

        <h2 className="text-2xl font-bold mb-4 text-center text-green-700">
          Support Our Mission
        </h2>
        <p className="mb-4 text-sm text-gray-600 text-center">
          Your contribution helps us continue our youth ministry efforts.
        </p>
        <img
          src={user.picture}
          alt="Person"
          onError={(e) => {
            e.currentTarget.src = "/images/person.png";
          }}
          className="w-20 h-20 rounded-full mx-auto mb-4 border-1 border-primary object-cover"
        />

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={formData.name}
            disabled
            className="w-full border p-2 rounded mb-3 bg-gray-100 text-gray-700 cursor-not-allowed"
          />

          <input
            type="email"
            value={formData.email}
            disabled
            className="w-full border p-2 rounded mb-3 bg-gray-100 text-gray-700 cursor-not-allowed"
          />

          <input
            type="tel"
            placeholder="+919876543210"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            required
            className="w-full border p-2 rounded mb-1"
          />
          {errors.phone && (
            <p className="text-red-500 text-sm mb-2">{errors.phone}</p>
          )}

          <textarea
            placeholder="Purpose of Donation"
            value={formData.purpose}
            onChange={(e) =>
              setFormData({ ...formData, purpose: e.target.value })
            }
            className="w-full border p-2 rounded mb-3"
            required
            rows={3}
          />

          <input
            type="number"
            placeholder="Donation Amount (₹)"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            className="w-full border p-2 rounded mb-1"
            required
          />
          {errors.amount && (
            <p className="text-red-500 text-sm mb-3">{errors.amount}</p>
          )}

          <Button
            type="submit"
            className="w-full bg-green-700 text-white py-2 px-4 mt-2 rounded hover:bg-green-800 transition"
          >
            Donate Now
          </Button>
        </form>
      </div>
    </div>
  );
}
