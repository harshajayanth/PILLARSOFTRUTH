import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import MemberCard from "./MemberCard";
import EditProfileModal from "./EditProfileModal";
import { useAuth } from "@/lib/auth";

interface Props {
  onClose: () => void;
}

export default function MembersModal({ onClose }: Props) {
  const { user } = useAuth();

  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showEditModal, setShowEditModal] = useState(false);

  const [roleFilter, setRoleFilter] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [youthLeaderOnly, setYouthLeaderOnly] = useState(false);

  const fetchMembers = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/users?active=true");
      const data = await response.json();

      setMembers(data);
    } catch (error) {
      console.error("Failed to fetch members:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const currentUser = members.find(
    (member) => member.email === user?.email
  );

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      if (roleFilter && member.role !== roleFilter) {
        return false;
      }

      if (
        positionFilter &&
        member.position !== positionFilter
      ) {
        return false;
      }

      if (
        locationFilter &&
        member.location !== locationFilter
      ) {
        return false;
      }

      if (
        youthLeaderOnly &&
        member.youth_leader?.toLowerCase() !== "true"
      ) {
        return false;
      }

      return true;
    });
  }, [
    members,
    roleFilter,
    positionFilter,
    locationFilter,
    youthLeaderOnly,
  ]);

    const uniqueRoles = [
        "admin",
        "user",
    ];

    const uniquePositions = [
        "Organisation",
        "Communication",
    ];

    const uniqueLocations = Array.from(
    new Set(
        members
        .map((m) => m.location)
        .filter(Boolean)
    )
    );
  return (
    <div className="fixed inset-0 z-[110] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-gray-50 w-full max-w-7xl h-[95vh] rounded-3xl overflow-hidden relative flex flex-col shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-50 bg-white p-2 rounded-full shadow hover:scale-105 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* HEADER */}
        <div className="bg-white border-b px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Community Members
          </h1>

          <p className="text-gray-500 mt-1">
            Explore and connect with all members
          </p>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10">
          {/* FILTERS */}
          <div className="bg-white rounded-2xl border shadow-sm p-5 flex flex-wrap gap-4 items-center">
            <select
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(e.target.value)
              }
              className="border rounded-xl px-4 py-2 bg-white"
            >
              <option value="">
                All Roles
              </option>

              {uniqueRoles.map((role) => (
                <option
                  key={role}
                  value={role}
                >
                  {role}
                </option>
              ))}
            </select>

            <select
              value={positionFilter}
              onChange={(e) =>
                setPositionFilter(
                  e.target.value
                )
              }
              className="border rounded-xl px-4 py-2 bg-white"
            >
              <option value="">
                All Positions
              </option>

              {uniquePositions.map(
                (position) => (
                  <option
                    key={position}
                    value={position.toUpperCase()}
                  >
                    {position}
                  </option>
                )
              )}
            </select>

            <select
              value={locationFilter}
              onChange={(e) =>
                setLocationFilter(
                  e.target.value
                )
              }
              className="border rounded-xl px-4 py-2 bg-white"
            >
              <option value="">
                All Locations
              </option>

              {uniqueLocations.map(
                (location) => (
                  <option
                    key={location}
                    value={location}
                  >
                    {location}
                  </option>
                )
              )}
            </select>

            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={youthLeaderOnly}
                onChange={(e) =>
                  setYouthLeaderOnly(
                    e.target.checked
                  )
                }
              />

              Youth Leaders Only
            </label>
          </div>

          {/* MEMBERS */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                All Members
              </h2>

              <p className="text-sm text-gray-500">
                {filteredMembers.length} members
              </p>
            </div>

            {loading ? (
              <div className="py-20 text-center text-gray-500">
                Loading members...
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="py-20 text-center text-gray-500">
                No members found
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMembers.map((member) => (
                  <MemberCard
                        key={member.id}
                        member={member}
                        isYou={
                            member.email
                            ?.toString()
                            .trim()
                            .toLowerCase() ===
                            user?.email
                            ?.toString()
                            .trim()
                            .toLowerCase()
                        }
                        onEdit={() =>
                            setShowEditModal(true)
                        }
                    />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showEditModal && currentUser && (
        <EditProfileModal
          member={currentUser}
          onClose={() =>
            setShowEditModal(false)
          }
          onUpdated={fetchMembers}
        />
      )}
    </div>
  );
}