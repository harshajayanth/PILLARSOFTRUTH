import {
  Pencil,
  Crown,
  BookOpen,
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
  // =====================================
  // ROLE CHECKS
  // =====================================
  const positions =
    member.position
      ?.toLowerCase() || "";

  const isPresident =
    positions.includes(
      "president"
    );

  const isYouthMinister =
    positions.includes(
      "youth minister"
    );

  const isPreacher =
    positions.includes(
      "preacher"
    );

  const isAdmin =
    member.role
      ?.toLowerCase() ===
    "admin";

  const idLeader =
    isAdmin ||
    isPresident ||
    isYouthMinister ||
    isPreacher;

  return (
    <div
      className={`relative rounded-2xl pt-10 p-5 hover:shadow-xl transition-all duration-300
        ${
          idLeader
            ? "bg-gradient-to-br from-yellow-50 to-white border-2 shadow-lg"
            : "bg-white border shadow-md"
        }

        ${
          isPresident
            ? "border-yellow-400 shadow-yellow-100"
            : isYouthMinister
            ? "border-purple-400 shadow-purple-100"
            : isPreacher
            ? "border-emerald-500 shadow-emerald-100"
            : isAdmin
            ? "border-red-400 shadow-red-100"
            : "border-gray-200"
        }
      `}
    >
      {/* TOP ICON */}
      {idLeader && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-50">
          <div
            className={`w-14 h-14 rounded-full border-4 border-white shadow-2xl flex items-center justify-center
              ${
                isPresident
                  ? "bg-yellow-400"
                  : isYouthMinister
                  ? "bg-purple-500"
                  : isPreacher
                  ? "bg-emerald-600"
                  : isAdmin
                  ? "bg-red-500"
                  : "bg-gray-400"
              }
            `}
          >
            {isPreacher ? (
              <BookOpen className="w-7 h-7 text-white" />
            ) : (
              <Crown
                className={`w-7 h-7
                  ${
                    isPresident
                      ? "text-white fill-yellow-100"
                      : isYouthMinister
                      ? "text-white fill-purple-200"
                      : isAdmin
                      ? "text-white fill-red-200"
                      : "text-white"
                  }
                `}
              />
            )}
          </div>
        </div>
      )}

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
            className={`w-16 h-16 rounded-full object-cover border-2
              ${
                isPresident
                  ? "border-yellow-400"
                  : isYouthMinister
                  ? "border-purple-400"
                  : isPreacher
                  ? "border-emerald-500"
                  : isAdmin
                  ? "border-red-400"
                  : "border-gray-200"
              }
            `}
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

        {/* USER INFO */}
        <div className="flex-1">
          {/* NAME */}
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900">
              {
                member.username
              }
            </h2>

            {/* YOU */}
            {isYou && (
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                You
              </span>
            )}

            {/* YOUTH LEADER */}
            {member.youth_leader
              ?.toString()
              .trim()
              .toLowerCase() ===
              "true" && (
              <span className="bg-black text-white text-xs px-2 py-1 rounded-full font-medium">
                Youth
                Leader
              </span>
            )}

            {/* PRESIDENT */}
            {isPresident && (
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-semibold border border-yellow-300">
                President
              </span>
            )}

            {/* YOUTH MINISTER */}
            {isYouthMinister && (
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-semibold border border-purple-300">
                Youth
                Minister
              </span>
            )}

            {/* PREACHER */}
            {isPreacher && (
              <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full font-semibold border border-emerald-300">
                Preacher
              </span>
            )}

            {/* ADMIN */}
            {isAdmin &&
              !isPresident &&
              !isYouthMinister &&
              !isPreacher && (
                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-semibold border border-red-300">
                  Admin
                </span>
              )}
          </div>

          {/* EMAIL */}
          {/* <p className="text-sm text-gray-500 mt-1 break-all">
            {member.email}
          </p> */}
        </div>
      </div>

      {/* DETAILS */}
      <div className="mt-5 space-y-3 text-sm">
        {/* AGE */}
        {member.age && (
          <p>
            <span className="font-semibold text-gray-700">
              Age:
            </span>{" "}
            {member.age}
          </p>
        )}

        {/* LOCATION */}
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

        {/* ROLE */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-700 uppercase">
            Role:
          </span>

          {isAdmin ? (
            <span className="bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full font-medium border border-red-200">
              Admin
            </span>
          ) : (
            <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full font-medium border border-gray-200">
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
                    className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium border border-green-200"
                  >
                    {position.trim()}
                  </span>
                )
              )}
          </div>
        )}

        {/* BIO */}
        <div
          className={`mt-3 rounded-xl p-3 border
            ${
              isPresident
                ? "bg-yellow-50 border-yellow-200"
                : isYouthMinister
                ? "bg-purple-50 border-purple-200"
                : isPreacher
                ? "bg-emerald-50 border-emerald-200"
                : isAdmin
                ? "bg-red-50 border-red-200"
                : "bg-gray-50 border-gray-200"
            }
          `}
        >
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