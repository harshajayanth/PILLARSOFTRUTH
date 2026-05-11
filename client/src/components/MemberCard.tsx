import {
  Pencil,
} from "lucide-react";

interface Member {
  id: string;
  username: string;
  email: string;
  role: string;
  phone: string;
  age: string;
  position: string;
  location: string;
  youth_leader: string;
  bio: string;
}

interface Props {
  member: Member;
  isYou?: boolean;
  onEdit?: () => void;
}

export default function MemberCard({
  member,
  isYou,
  onEdit,
}: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-md border p-5 hover:shadow-xl transition-all duration-300">
      {/* HEADER */}
      <div className="flex items-start gap-4">
        {/* PROFILE IMAGE */}
        <div className="relative group">
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
              member.username
            )}&background=random`}
            alt={
              member.username
            }
            className="w-16 h-16 rounded-full object-cover border"
          />

          {/* EDIT OVERLAY */}
          {isYou && (
            <button
              onClick={
                onEdit
              }
              className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
            >
              <Pencil className="w-5 h-5 text-white" />
            </button>
          )}
        </div>

        <div className="flex-1">
          {/* NAME */}
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900">
              {
                member.username
              }
            </h2>

            {isYou && (
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                You
              </span>
            )}

            {member.youth_leader
              ?.toString()
              .trim()
              .toLowerCase() ===
              "true" && (
              <span className="bg-black text-white text-xs px-2 py-1 rounded-full font-medium">
                Youth Leader
              </span>
            )}
          </div>
        </div>
      </div>

      {/* DETAILS */}
      <div className="mt-5 space-y-2 text-sm">
        {member.age && (
          <p>
            <span className="font-semibold text-gray-700">
              Age:
            </span>{" "}
            {member.age}
          </p>
        )}

        {member.location && (
          <p>
            <span className="font-semibold text-gray-700">
              Location:
            </span>{" "}
            {
              member.location
            }
          </p>
        )}

        {/* BADGES */}
        <div className="mt-3 space-y-2">
          {/* ROLE */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-700 uppercase">
              Role:
            </span>

            {member.role
              ?.toString()
              .trim()
              .toLowerCase() ===
              "admin" && (
              <span className="bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full font-medium">
                Admin
              </span>
            )}

            {member.role
              ?.toString()
              .trim()
              .toLowerCase() ===
              "user" && (
              <span className="bg-yellow-100 text-yellow-700 text-xs px-3 py-1 rounded-full font-medium">
                User
              </span>
            )}
          </div>

          {/* POSITIONS */}
          {member.position && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-700 uppercase">
                Position:
              </span>

              {member.position
                .split(",")
                .map(
                  (
                    position: string
                  ) => (
                    <span
                      key={
                        position
                      }
                      className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium"
                    >
                      {position.trim()}
                    </span>
                  )
                )}
            </div>
          )}
        </div>

        {/* BIO */}
        <div className="mt-3 bg-gray-50 border rounded-xl p-3">
          <p className="text-gray-600 italic text-sm leading-relaxed">
            {member.bio?.trim()
              ? member.bio
              : "No Bio"}
          </p>
        </div>
      </div>
    </div>
  );
}