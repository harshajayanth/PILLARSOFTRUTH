import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";

interface Props {
  onClose: () => void;
}

export default function SignOutModal({ onClose }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleAdminNav = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl p-6 w-80 relative text-center">
        <img
          src={user.picture}
          alt="Person"
          onError={(e) => {
            e.currentTarget.src = "/images/person.png";
          }}
          className="w-20 h-20 rounded-full mx-auto mb-4 border-1 border-primary object-cover"
        />
        <h2 className="font-bold text-lg">{user.name}</h2>
        <p className="text-gray-500 text-sm mb-4">{user.email}</p>

        {/* Admin Options */}
        {user.role === "admin" && (
          <div className="space-y-2 mb-4">
            <Button
              onClick={() => handleAdminNav("/admin/users")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Manage Users
            </Button>
            <Button
              onClick={() => handleAdminNav("/admin/finance")}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              Manage Finance
            </Button>
            <Button
              onClick={() => handleAdminNav("/admin/donations")}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              Donations
            </Button>
          </div>
        )}

        <Button
          onClick={() => {
            logout();
            onClose();
          }}
          className="bg-red-500 text-white w-full hover:bg-red-600"
        >
          Sign Out
        </Button>

        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-black"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
