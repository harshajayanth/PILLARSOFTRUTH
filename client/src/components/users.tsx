import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  MoreVertical,
  Crown,
  User,
} from "lucide-react";
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

  position?: string;
  location?: string;
  youth_leader?: string;
}

// =====================================
// STATUS BADGE
// =====================================
function StatusBadge({
  status,
}: {
  status: any;
}) {
  const normalized = (
    status || ""
  )
    .toString()
    .trim()
    .toLowerCase();

  const isActive =
    normalized ===
    "active";

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

      <span>
        {isActive
          ? "Active"
          : "Inactive"}
      </span>
    </div>
  );
}

// =====================================
// FETCH USERS
// =====================================
const fetchAllUsers =
  async (): Promise<
    User[]
  > => {
    const res =
      await fetch(
        "/api/users"
      );

    if (!res.ok)
      throw new Error(
        "Failed to fetch users"
      );

    return res.json();
  };

export default function UsersPage() {
  const navigate =
    useNavigate();

  // =====================================
  // STATES
  // =====================================
  const [
    selectedUser,
    setSelectedUser,
  ] =
    useState<User | null>(
      null
    );

  const [
    editOpen,
    setEditOpen,
  ] =
    useState(false);

  const [
    deleteOpen,
    setDeleteOpen,
  ] =
    useState(false);

  const [
    searchTerm,
    setSearchTerm,
  ] =
    useState("");

  const [
    positionFilter,
    setPositionFilter,
  ] =
    useState("");

  const [
    locationFilter,
    setLocationFilter,
  ] =
    useState("");

  const [
    youthLeaderOnly,
    setYouthLeaderOnly,
  ] =
    useState(false);

  const [user, setUser] =
    useState<User | null>(
      null
    );

  // =====================================
  // AUTH CHECK
  // =====================================
  const fetchUser =
    async () => {
      try {
        const res =
          await fetch(
            "/api/auth/me"
          );

        const data =
          await res.json();

        if (
          !data?.email ||
          data.role !==
            "admin"
        ) {
          navigate("/");
          return;
        }

        setUser(data);
      } catch (err) {
        // console.error(
        //   "Auth error:",
        //   err
        // );

        navigate("/");
      }
    };

  useEffect(() => {
    fetchUser();
  }, []);

  // =====================================
  // USERS QUERY
  // =====================================
  const {
    data: users = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["users"],
    queryFn:
      fetchAllUsers,
  });

  // =====================================
  // FILTER OPTIONS
  // =====================================
  const uniquePositions =
    [
      "Organisation",
      "Communication",
      "Member",
      "Volunteer",
      "Coordinator",
      "ADMIN",
      "Administration",
      "Preacher",
      "Youth Minister",
      "President"
    ];

  const uniqueLocations =
    Array.from(
      new Set(
        users
          .map(
            (
              u: any
            ) =>
              u.location
          )
          .filter(
            Boolean
          )
      )
    );

  // =====================================
  // FILTER USERS
  // =====================================
  const filteredUsers =
    users.filter(
      (
        u: any
      ) => {
        const query =
          searchTerm.toLowerCase();

        // SEARCH
        const matchesSearch =
          u.username
            ?.toLowerCase()
            .includes(
              query
            ) ||
          u.email
            ?.toLowerCase()
            .includes(
              query
            ) ||
          u.role
            ?.toLowerCase()
            .includes(
              query
            ) ||
          u.access
            ?.toLowerCase()
            .includes(
              query
            );

        if (
          !matchesSearch
        )
          return false;

        // POSITION
        if (
          positionFilter
        ) {
          const positions =
            u.position
              ?.split(
                ","
              )
              .map(
                (
                  p: string
                ) =>
                  p
                    .trim()
                    .toLowerCase()
              ) || [];

          if (
            !positions.includes(
              positionFilter.toLowerCase()
            )
          ) {
            return false;
          }
        }

        // LOCATION
        if (
          locationFilter &&
          u.location !==
            locationFilter
        ) {
          return false;
        }

        // YOUTH LEADER
        if (
          youthLeaderOnly &&
          u.youth_leader
            ?.toLowerCase() !==
            "true"
        ) {
          return false;
        }

        return true;
      }
    );

  // =====================================
  // LOADING
  // =====================================
  if (isLoading)
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <LoadingSpinner />

        <p className="text-lg font-medium text-gray-700">
          Loading
          Users...
        </p>
      </div>
    );

  // =====================================
  // ERROR
  // =====================================
  if (isError)
    return (
      <p className="text-center mt-10 text-red-500">
        Failed to load
        users
      </p>
    );

  return (
    <div className="m-6">
      {/* HEADER */}
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2 mt-2">
        <button
          onClick={() =>
            navigate(-1)
          }
          className="text-gray-600 hover:text-black transition"
        >
          <span className="material-symbols-outlined">
            arrow_back
          </span>
        </button>

        All Users
      </h1>

      {/* FILTERS */}
      <div className="mb-6 flex flex-wrap gap-4 items-center bg-white p-4 rounded-2xl border shadow-sm">
        {/* SEARCH */}
        <Input
          type="text"
          placeholder="Search by name, email, role, access"
          value={
            searchTerm
          }
          onChange={(
            e
          ) =>
            setSearchTerm(
              e.target.value
            )
          }
          className="w-72 border border-gray-300 rounded-md"
        />

        {/* POSITION */}
        <select
          value={
            positionFilter
          }
          onChange={(
            e
          ) =>
            setPositionFilter(
              e.target.value
            )
          }
          className="border rounded-xl px-4 py-2 bg-white"
        >
          <option value="">
            All
            Positions
          </option>

          {uniquePositions.map(
            (
              position
            ) => (
              <option
                key={
                  position
                }
                value={
                  position
                }
              >
                {
                  position
                }
              </option>
            )
          )}
        </select>

        {/* LOCATION */}
        <select
          value={
            locationFilter
          }
          onChange={(
            e
          ) =>
            setLocationFilter(
              e.target.value
            )
          }
          className="border rounded-xl px-4 py-2 bg-white"
        >
          <option value="">
            All
            Locations
          </option>

          {uniqueLocations.map(
            (
              location
            ) => (
              <option
                key={
                  location
                }
                value={
                  location
                }
              >
                {
                  location
                }
              </option>
            )
          )}
        </select>

        {/* YOUTH LEADER */}
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={
              youthLeaderOnly
            }
            onChange={(
              e
            ) =>
              setYouthLeaderOnly(
                e.target
                  .checked
              )
            }
          />

          Youth Leaders
          Only
        </label>
      </div>

      {/* TABLE */}
      <div>
        {filteredUsers.length ===
        0 ? (
          <p className="text-center text-gray-500">
            No matching
            users found.
          </p>
        ) : (
          <table className="w-full text-left border-collapse text-center">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 border">
                  S.NO
                </th>

                <th className="p-3 border">
                  Name
                </th>

                <th className="p-3 border">
                  Age
                </th>

                <th className="p-3 border">
                  Phone
                </th>

                <th className="p-3 border">
                  Gmail
                </th>

                <th className="p-3 border">
                  Role
                </th>

                <th className="p-3 border">
                  Position
                </th>

                <th className="p-3 border">
                  Location
                </th>

                <th className="p-3 border">
                  Youth
                  Leader
                </th>

                <th className="p-3 border">
                  Access
                </th>

                <th className="p-3 border w-12"></th>
              </tr>
            </thead>

            <tbody className="text-center justify-center">
              {filteredUsers.map(
                (
                  user,
                  index
                ) => (
                  <tr
                    key={
                      user.id ||
                      user.email
                    }
                    className="hover:bg-gray-50"
                  >
                    <td className="p-3 border">
                      {index + 1}
                    </td>

                    <td className="p-3 border">
                      {user.username ||
                        "-"}
                    </td>

                    <td className="p-3 border">
                      {user.age ||
                        "-"}
                    </td>

                    <td className="p-3 border">
                      {user.phone ||
                        "-"}
                    </td>

                    <td className="p-3 border">
                      {
                        user.email
                      }
                    </td>

                    <td className="p-3 border font-semibold">
                      {user.role ===
                      "admin"
                        ? "Admin"
                        : "User"}
                    </td>

                   <td className="p-3 border">
                    {user.position ? (
                      <div className="flex flex-wrap gap-2 justify-center">
                        {user.position
                          .split(",")
                          .map((pos, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold border border-blue-200"
                            >
                              {pos.trim()}
                            </span>
                          ))}
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>

                    <td className="p-3 border">
                      {user.location ||
                        "-"}
                    </td>

                    <td className="p-3 border">
                      <div className="flex justify-center items-center">
                        {user.youth_leader?.toLowerCase() ===
                        "true" ? (
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 border border-yellow-300">
                            <Crown className="w-5 h-5 text-yellow-500 fill-yellow-400" />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 border border-gray-300">
                            <User className="w-5 h-5 text-gray-500" />
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="p-3 border flex flex-wrap justify-center">
                      <StatusBadge
                        status={
                          user.access
                        }
                      />
                    </td>

                    <td className="p-3 border text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(
                                user
                              );

                              setEditOpen(
                                true
                              );
                            }}
                          >
                            Edit
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setSelectedUser(
                                user
                              );

                              setDeleteOpen(
                                true
                              );
                            }}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* EDIT MODAL */}
      {editOpen &&
        selectedUser && (
          <EditUserModal
            user={
              selectedUser
            }
            onClose={() =>
              setEditOpen(
                false
              )
            }
          />
        )}

      {/* DELETE MODAL */}
      {deleteOpen &&
        selectedUser && (
          <DeleteUserModal
            user={
              selectedUser
            }
            onClose={() =>
              setDeleteOpen(
                false
              )
            }
          />
        )}
    </div>
  );
}