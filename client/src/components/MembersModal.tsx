import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  X,
} from "lucide-react";

import MemberCard from "./MemberCard";

import EditProfileModal from "./EditProfileModal";

import {
  useAuth,
} from "@/lib/auth";

interface Props {
  onClose: () => void;
}

export default function MembersModal({
  onClose,
}: Props) {
  const { user } =
    useAuth();

  const [members, setMembers] =
    useState<any[]>(
      []
    );

  const [loading, setLoading] =
    useState(
      true
    );

  const [
    showEditModal,
    setShowEditModal,
  ] = useState(
    false
  );

  // =====================================
  // FILTER STATES
  // =====================================
  const [
    searchQuery,
    setSearchQuery,
  ] = useState(
    ""
  );

  const [
    roleFilter,
    setRoleFilter,
  ] = useState(
    ""
  );

  const [
    positionFilter,
    setPositionFilter,
  ] = useState(
    ""
  );

  const [
    locationFilter,
    setLocationFilter,
  ] = useState(
    ""
  );

  const [
    youthLeaderOnly,
    setYouthLeaderOnly,
  ] = useState(
    false
  );

  // =====================================
  // FETCH MEMBERS
  // =====================================
  const fetchMembers =
    async () => {
      try {
        setLoading(
          true
        );

        const response =
          await fetch(
            "/api/users?active=active"
          );

        const data =
          await response.json();

        setMembers(
          data
        );
      } catch (error) {
        // console.error(
        //   "Failed to fetch members:",
        //   error
        // );
      } finally {
        setLoading(
          false
        );
      }
    };

  useEffect(() => {
    fetchMembers();
  }, []);

  // =====================================
  // CURRENT USER
  // =====================================
  const currentUser =
    members.find(
      (
        member
      ) =>
        member.email
          ?.toString()
          .trim()
          .toLowerCase() ===
        user?.email
          ?.toString()
          .trim()
          .toLowerCase()
    );

  const getMemberPriority =
    (
      member: any
    ) => {
      const memberEmail =
        member.email
          ?.toString()
          .trim()
          .toLowerCase();

      const currentUserEmail =
        user?.email
          ?.toString()
          .trim()
          .toLowerCase();

      if (
        memberEmail &&
        currentUserEmail &&
        memberEmail ===
          currentUserEmail
      ) {
        return 0;
      }

      const position =
        member.position
          ?.toString()
          .toLowerCase() ||
        "";

      const role =
        member.role
          ?.toString()
          .toLowerCase() ||
        "";

      if (
        position.includes(
          "president"
        )
      ) {
        return 1;
      }

      if (
        position.includes(
          "youth minister"
        ) ||
        position.includes(
          "youthminister"
        )
      ) {
        return 2;
      }

      if (
        position.includes(
          "preacher"
        )
      ) {
        return 3;
      }

      if (
        role ===
        "admin"
      ) {
        return 4;
      }

      return 5;
    };

  // =====================================
  // FILTER MEMBERS
  // =====================================
  const filteredMembers =
  useMemo(() => {
    const filtered =
      members.filter(
        (
          member
        ) => {
          // SEARCH
          if (
            searchQuery &&
            !member.username
              ?.toLowerCase()
              .includes(
                searchQuery.toLowerCase()
              )
          ) {
            return false;
          }

          // ROLE
          if (
            roleFilter &&
            member.role !==
              roleFilter
          ) {
            return false;
          }

          // POSITION
          if (
            positionFilter
          ) {
            const positions =
              member.position
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
                ) ||
              [];

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
            member.location !==
              locationFilter
          ) {
            return false;
          }

          // YOUTH LEADER
          if (
            youthLeaderOnly &&
            member.youth_leader
              ?.toLowerCase() !==
              "true"
          ) {
            return false;
          }

          return true;
        }
      );

    return filtered.sort(
      (
        a,
        b
      ) => {
        const priorityA =
          getMemberPriority(
            a
          );

        const priorityB =
          getMemberPriority(
            b
          );

        if (
          priorityA !==
          priorityB
        ) {
          return (
            priorityA -
            priorityB
          );
        }

        return (
          a.username || ""
        ).localeCompare(
          b.username || ""
        );
      }
    );
  }, [
    members,
    searchQuery,
    roleFilter,
    positionFilter,
    locationFilter,
    youthLeaderOnly,
    user,
  ]);

  const priorityMembers =
    filteredMembers.filter(
      (
        member
      ) =>
        getMemberPriority(
          member
        ) < 5
    );

  const remainingMembers =
    filteredMembers.filter(
      (
        member
      ) =>
        getMemberPriority(
          member
        ) === 5
    );

  const youthLeadersCount =
    filteredMembers.filter(
      (
        member
      ) =>
        member.youth_leader
          ?.toString()
          .toLowerCase() ===
        "true"
    ).length;

  const preachersCount =
    filteredMembers.filter(
      (
        member
      ) => {
        const position =
          member.position
            ?.toString()
            .toLowerCase() ||
          "";

        const role =
          member.role
            ?.toString()
            .toLowerCase() ||
          "";

        return (
          position.includes(
            "preacher"
          ) ||
          position.includes(
            "preachers"
          ) ||
          role.includes(
            "preacher"
          ) ||
          role.includes(
            "preachers"
          )
        );
      }
    ).length;

  const adminsCount =
    filteredMembers.filter(
      (
        member
      ) =>
        member.role
          ?.toString()
          .toLowerCase() ===
        "admin"
    ).length;

  const preacherBadgeLabel =
    preachersCount === 1
      ? "Preacher"
      : "Preachers";

  const youthLeaderBadgeLabel =
    youthLeadersCount === 1
      ? "Youth Leader"
      : "Youth Leaders";

  const adminBadgeLabel =
    adminsCount === 1
      ? "Admin"
      : "Admins";

  const memberBadgeLabel =
    filteredMembers.length === 1
      ? "Member"
      : "Members";

  // =====================================
  // FILTER OPTIONS
  // =====================================
  const uniqueRoles = [
    "admin",
    "user",
  ];

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
      "President",
      "Sponser",
    ];

  const uniqueLocations =
    Array.from(
      new Set(
        members
          .map(
            (
              m
            ) =>
              m.location
          )
          .filter(
            Boolean
          )
      )
    );

  return (
    <div className="fixed inset-0 z-[110] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-gray-50 w-full max-w-7xl h-[95vh] rounded-3xl overflow-hidden relative flex flex-col shadow-2xl">
        {/* CLOSE */}
        <button
          onClick={
            onClose
          }
          className="absolute top-5 right-5 z-50 bg-white p-2 rounded-full shadow hover:scale-105 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* HEADER */}
        <div className="bg-white border-b px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Community
            Members
          </h1>

          <p className="text-gray-500 mt-1">
            Explore and
            connect with
            all members
          </p>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10">
          {/* FILTERS */}
          <div className="bg-white rounded-2xl border shadow-sm p-5 flex flex-wrap gap-4 items-center">
            {/* SEARCH */}
            <input
              type="text"
              placeholder="Search by name..."
              value={
                searchQuery
              }
              onChange={(
                e
              ) =>
                setSearchQuery(
                  e
                    .target
                    .value
                )
              }
              className="border rounded-xl px-4 py-2 bg-white min-w-[220px]"
            />

            {/* ROLE */}
            <select
              value={
                roleFilter
              }
              onChange={(
                e
              ) =>
                setRoleFilter(
                  e
                    .target
                    .value
                )
              }
              className="border rounded-xl px-4 py-2 bg-white"
            >
              <option value="">
                All
                Roles
              </option>

              {uniqueRoles.map(
                (
                  role
                ) => (
                  <option
                    key={
                      role
                    }
                    value={
                      role
                    }
                  >
                    {role}
                  </option>
                )
              )}
            </select>

            {/* POSITION */}
            <select
              value={
                positionFilter
              }
              onChange={(
                e
              ) =>
                setPositionFilter(
                  e
                    .target
                    .value
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
                  e
                    .target
                    .value
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
                    e
                      .target
                      .checked
                  )
                }
              />

              Youth
              Leaders
              Only
            </label>
          </div>

          {/* MEMBERS */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h2 className="text-2xl font-bold">
                All
                Members
              </h2>

              <div className="flex flex-wrap items-center gap-2">
                <p className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-base font-semibold text-blue-700">
                  {
                    filteredMembers.length
                  }{" "}
                  {
                    memberBadgeLabel
                  }
                </p>

                <p className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-base font-semibold text-emerald-700">
                  {
                    youthLeadersCount
                  }{" "}
                  {
                    youthLeaderBadgeLabel
                  }
                </p>

                <p className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-base font-semibold text-amber-700">
                  {
                    preachersCount
                  }{" "}
                  {
                    preacherBadgeLabel
                  }
                </p>

                <p className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-base font-semibold text-violet-700">
                  {
                    adminsCount
                  }{" "}
                  {
                    adminBadgeLabel
                  }
                </p>
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center text-gray-500">
                Loading
                members...
              </div>
            ) : filteredMembers.length ===
              0 ? (
              <div className="py-20 text-center text-gray-500">
                No
                members
                found
              </div>
            ) : (
              <div className="space-y-8">
                {priorityMembers.length >
                  0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {priorityMembers.map(
                      (
                        member
                      ) => (
                        <MemberCard
                          key={
                            member.id
                          }
                          member={
                            member
                          }
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
                            setShowEditModal(
                              true
                            )
                          }
                        />
                      )
                    )}
                  </div>
                )}

                {priorityMembers.length >
                  0 &&
                  remainingMembers.length >
                    0 && (
                    <hr className="border-gray-200" />
                  )}

                {remainingMembers.length >
                  0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {remainingMembers.map(
                      (
                        member
                      ) => (
                        <MemberCard
                          key={
                            member.id
                          }
                          member={
                            member
                          }
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
                            setShowEditModal(
                              true
                            )
                          }
                        />
                      )
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {showEditModal &&
        currentUser && (
          <EditProfileModal
            user={
              currentUser
            }
            onClose={() =>
              setShowEditModal(
                false
              )
            }
          />
        )}
    </div>
  );
}
