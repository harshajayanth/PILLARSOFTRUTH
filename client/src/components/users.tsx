import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { MoreVertical } from "lucide-react";
import EditUserModal from "@/components/EditUserModal";
import DeleteUserModal from "@/components/DeleteUserModal";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import LoadingSpinner from "@/components/ui/loading-spinner";

interface User {
  id?: string;
  username: string;
  age?: string;
  phone?: string;
  email: string;
  role: string;
  access?: string;
}

// ✅ Status Badge
function StatusBadge({ status }: { status: any }) {
  const normalized = (status || "").toString().trim().toLowerCase();
  const isActive = normalized === "active";

  return (
    <div
      className={`w-32 h-10 flex items-center justify-center gap-2 rounded-full border text-sm font-bold transition
        ${
          isActive
            ? "border-green-900 bg-green-900 text-white"
            : "border-red-900 bg-red-900 text-white"
        }
      `}
    >
      <span
        className={`w-3 h-3 rounded-full animate-pulse
          ${
            isActive
              ? "bg-green-200 shadow-green-400 shadow-sm"
              : "bg-red-200 shadow-red-400 shadow-sm"
          }
        `}
      ></span>
      <span>{isActive ? "Active" : "Inactive"}</span>
    </div>
  );
}

// ✅ API fetcher for all users
const fetchAllUsers = async (): Promise<User[]> => {
  const res = await fetch("/api/users");
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
};

export default function UsersPage() {
  const navigate = useNavigate();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [user, setUser] = useState<User | null>(null);

  // ✅ Auth check (must be admin)
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

  // ✅ React Query fetch for users
  const {
    data: users = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["users"], // cache key
    queryFn: fetchAllUsers,
  });


  if (isLoading) return <div className="h-screen flex flex-col items-center justify-center gap-4">
          <LoadingSpinner />
          <p className="text-lg font-medium text-gray-700">
            Loading Users...
          </p>
        </div>;
  if (isError) return <p className="text-center mt-10 text-red-500">Failed to load users</p>;

  // ✅ Search filter
  const filteredUsers = users.filter((u) => {
    const query = searchTerm.toLowerCase();
    if (query === "active" || query === "inactive") {
      return u.access === query;
    }
    return (
      u.username?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      u.role?.toLowerCase().includes(query) ||
      u.access?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="m-6">
      {/* ✅ Header */}
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2 mt-2">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-600 hover:text-black transition"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        All Users
      </h1>

      {/* ✅ Search Box */}
      <div className="mb-4 flex justify-end">
        <Input
          type="text"
          placeholder="Search by name, email, role, access"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-72 border border-gray-300 rounded-md"
        />
      </div>

      {/* ✅ Table */}
      <div>
        {filteredUsers.length === 0 ? (
          <p className="text-center text-gray-500">No matching users found.</p>
        ) : (
          <table className="w-full text-left border-collapse text-center">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 border">S.NO</th>
                <th className="p-3 border">Name</th>
                <th className="p-3 border">Age</th>
                <th className="p-3 border">Phone</th>
                <th className="p-3 border">Gmail</th>
                <th className="p-3 border">Role</th>
                <th className="p-3 border">Access</th>
                <th className="p-3 border w-12"></th>
              </tr>
            </thead>

            <tbody className="text-center justify-center">
              {filteredUsers.map((user, index) => (
                <tr key={user.id || user.email} className="hover:bg-gray-50">
                  <td className="p-3 border">{index + 1}</td>
                  <td className="p-3 border">{user.username || "-"}</td>
                  <td className="p-3 border">{user.age || "-"}</td>
                  <td className="p-3 border">{user.phone || "-"}</td>
                  <td className="p-3 border">{user.email}</td>
                  <td className="p-3 border font-semibold">
                    {user.role === "admin" ? "Admin" : "User"}
                  </td>
                  <td className="p-3 border flex flex-wrap justify-center">
                    <StatusBadge status={user.access} />
                  </td>
                  <td className="p-3 border text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user);
                            setEditOpen(true);
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            setSelectedUser(user);
                            setDeleteOpen(true);
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ✅ Edit Modal */}
      {editOpen && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => setEditOpen(false)}
        />
      )}

      {/* ✅ Delete Modal */}
      {deleteOpen && selectedUser && (
        <DeleteUserModal
          user={selectedUser}
          onClose={() => setDeleteOpen(false)}
        />
      )}
    </div>
  );
}
