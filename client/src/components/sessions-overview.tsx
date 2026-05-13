import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import LoadingSpinner from "@/components/ui/loading-spinner";

import {
  Sprout,
  Flame,
  Crown,
  Mic,
  BookOpen,
  Play,
  Download,
  Eye,
  Search,
} from "lucide-react";

import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

import AuthModal from "@/components/auth-modal";

/* -------------------------------------------------------------------------- */
/* TYPES */
/* -------------------------------------------------------------------------- */

type SessionItem = {
  id: string;
  title: string;
  type: "recording" | "chapter";
  fileUrl: string;
  createdAt: string;
};

type SessionGroup = {
  title: string;
  chapters: number;
  recordings: number;
  items: SessionItem[];
};

/* -------------------------------------------------------------------------- */
/* SESSION ICONS */
/* -------------------------------------------------------------------------- */

const sessionIcons: Record<string, any> = {
  Foundation: Sprout,
  Growth: Flame,
  Ministry: Crown,
};

const sessionStyles: Record<string, any> = {
  Foundation: {
    bgGradient: "from-blue-50 to-blue-100",
    borderColor: "border-blue-200",
    iconBg: "bg-primary",
    buttonColor: "bg-primary hover:bg-blue-700",
  },

  Growth: {
    bgGradient: "from-purple-50 to-purple-100",
    borderColor: "border-purple-200",
    iconBg: "bg-secondary",
    buttonColor: "bg-secondary hover:bg-purple-700",
  },

  Ministry: {
    bgGradient: "from-amber-50 to-amber-100",
    borderColor: "border-amber-200",
    iconBg: "bg-accent",
    buttonColor:
      "bg-accent hover:bg-yellow-500 text-gray-900",
  },
};

/* -------------------------------------------------------------------------- */

export default function SessionsOverview() {
  const { user } = useAuth();

  const { toast } = useToast();

  const [showAuthModal, setShowAuthModal] =
    useState(false);

  const [selectedSession, setSelectedSession] =
    useState<SessionGroup | null>(null);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [filterType, setFilterType] =
    useState<
      "all" | "recordings" | "chapters"
    >("all");

  /* ---------------------------------------------------------------------- */
  /* FETCH CONTENT */
  /* ---------------------------------------------------------------------- */

  const {
    data: sessions = [],
    isLoading,
    error,
  } = useQuery<SessionGroup[]>({
    queryKey: ["/api/content"],

    queryFn: async () => {
      const res = await fetch("/api/content", {
        credentials: "include",
      });

      const json = await res.json();

      return Array.isArray(json) ? json : [];
    },
  });

  /* ---------------------------------------------------------------------- */
  /* RESET FILTERS WHEN MODAL CHANGES */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    setSearchTerm("");
    setFilterType("all");
  }, [selectedSession]);

  /* ---------------------------------------------------------------------- */
  /* FILTER ITEMS */
  /* ---------------------------------------------------------------------- */

  const filteredItems = useMemo(() => {
    if (!selectedSession) return [];

    return selectedSession.items.filter(
      (item) => {
        const matchesSearch =
          item.title
            .toLowerCase()
            .includes(
              searchTerm.toLowerCase()
            );

        const matchesFilter =
          filterType === "all"
            ? true
            : filterType === "recordings"
            ? item.type === "recording"
            : item.type === "chapter";

        return (
          matchesSearch && matchesFilter
        );
      }
    );
  }, [
    selectedSession,
    searchTerm,
    filterType,
  ]);

  /* ---------------------------------------------------------------------- */
  /* DIVIDE CONTENT */
  /* ---------------------------------------------------------------------- */

  const recordings = filteredItems.filter(
    (item) => item.type === "recording"
  );

  const chapters = filteredItems.filter(
    (item) => item.type === "chapter"
  );

  /* ---------------------------------------------------------------------- */
  /* OPEN FILE */
  /* ---------------------------------------------------------------------- */

  const handleOpenFile = (
    fileUrl: string
  ) => {
    if (!user?.isAuthenticated) {
      toast({
        title: "Authentication Required",
        description:
          "Please sign in to access content",
        variant: "destructive",
      });

      setShowAuthModal(true);

      return;
    }

    window.open(fileUrl, "_blank");
  };

  /* ---------------------------------------------------------------------- */

  return (
    <section
      id="sessions"
      className="py-20 bg-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* HEADER */}

        <div className="text-center mb-16">

          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Annual Sessions
          </h2>

          <p className="text-xl text-gray-600">
            Three powerful sessions filled
            with teachings and study materials
          </p>
        </div>

        {/* LOADING */}

        {isLoading ? (
          <div className="flex justify-center">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-center text-red-600">
            Failed to load sessions.
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">

            {sessions.map((session) => {
              const IconComponent =
                sessionIcons[
                  session.title
                ] || Sprout;

              const style =
                sessionStyles[
                  session.title
                ] ||
                sessionStyles.Foundation;

              return (
                <Card
                  key={session.title}
                  className={`card-hover bg-gradient-to-br ${style.bgGradient} ${style.borderColor} border`}
                >
                  <CardContent className="p-8">

                    <div className="text-center">

                      {/* ICON */}

                      <div
                        className={`${style.iconBg} text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6`}
                      >
                        <IconComponent className="h-8 w-8" />
                      </div>

                      {/* TITLE */}

                      <h3 className="text-2xl font-bold text-gray-900 mb-4">
                        {session.title}
                      </h3>

                      {/* COUNTS */}

                      <div className="space-y-2 text-sm text-gray-600 mb-6">

                        <div className="flex items-center justify-between">
                          <span>
                            Chapter Notes
                          </span>

                          <span className="bg-primary text-white px-2 py-1 rounded">
                            {
                              session.chapters
                            }
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span>
                            Recordings
                          </span>

                          <span className="bg-secondary text-white px-2 py-1 rounded">
                            {
                              session.recordings
                            }
                          </span>
                        </div>
                      </div>

                      {/* BUTTON */}

                      <Button
                        onClick={() =>
                          setSelectedSession(
                            session
                          )
                        }
                        className={`w-full ${style.buttonColor}`}
                      >
                        View Content
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* SESSION MODAL */}
        {/* ---------------------------------------------------------------- */}

        <Dialog
          open={!!selectedSession}
          onOpenChange={() =>
            setSelectedSession(null)
          }
        >
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">

            <DialogHeader>

              <DialogTitle className="text-2xl font-bold">
                {
                  selectedSession?.title
                }{" "}
                Session Content
              </DialogTitle>
            </DialogHeader>

            {/* SEARCH + FILTER */}

            <div className="flex flex-col md:flex-row gap-4 mb-6">

              {/* SEARCH */}

              <div className="relative flex-1">

                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />

                <Input
                  placeholder="Search content..."
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(
                      e.target.value
                    )
                  }
                  className="pl-10"
                />
              </div>

              {/* FILTER */}

              <Select
                value={filterType}
                onValueChange={(value) =>
                  setFilterType(
                    value as
                      | "all"
                      | "recordings"
                      | "chapters"
                  )
                }
              >
                <SelectTrigger className="w-full md:w-[220px]">
                  <SelectValue placeholder="Filter content" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">
                    All Content
                  </SelectItem>

                  <SelectItem value="recordings">
                    Recordings
                  </SelectItem>

                  <SelectItem value="chapters">
                    Chapter Notes
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* RECORDINGS */}

            {(filterType === "all" ||
              filterType ===
                "recordings") && (
              <div className="mb-8">

                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Mic className="w-5 h-5 mr-2 text-red-600" />
                  Recordings
                </h3>

                <div className="grid md:grid-cols-2 gap-4">

                  {recordings.map((item) => (
                    <Card
                      key={item.id}
                      className="shadow-md"
                    >
                      <CardContent className="p-5">

                        <div className="flex items-center mb-4">

                          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mr-4">
                            <Mic className="w-6 h-6" />
                          </div>

                          <div>

                            <h4 className="font-semibold text-gray-900">
                              {item.title}
                            </h4>

                            <p className="text-sm text-gray-500">
                              {new Date(
                                item.createdAt
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">

                          <Button
                            onClick={() =>
                              handleOpenFile(
                                item.fileUrl
                              )
                            }
                            className="flex-1 bg-primary hover:bg-blue-700"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Play
                          </Button>

                          <Button
                            variant="outline"
                            onClick={() =>
                              handleOpenFile(
                                item.fileUrl
                              )
                            }
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {recordings.length ===
                  0 && (
                  <p className="text-gray-500">
                    No recordings found.
                  </p>
                )}
              </div>
            )}

            {/* CHAPTER NOTES */}

            {(filterType === "all" ||
              filterType ===
                "chapters") && (
              <div>

                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-green-600" />
                  Chapter Notes
                </h3>

                <div className="grid md:grid-cols-2 gap-4">

                  {chapters.map((item) => (
                    <Card
                      key={item.id}
                      className="shadow-md"
                    >
                      <CardContent className="p-5">

                        <div className="flex items-center mb-4">

                          <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-4">
                            <BookOpen className="w-6 h-6" />
                          </div>

                          <div>

                            <h4 className="font-semibold text-gray-900">
                              {item.title}
                            </h4>

                            <p className="text-sm text-gray-500">
                              {new Date(
                                item.createdAt
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">

                          <Button
                            onClick={() =>
                              handleOpenFile(
                                item.fileUrl
                              )
                            }
                            className="flex-1 bg-secondary hover:bg-purple-700"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>

                          <Button
                            variant="outline"
                            onClick={() =>
                              handleOpenFile(
                                item.fileUrl
                              )
                            }
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {chapters.length ===
                  0 && (
                  <p className="text-gray-500">
                    No chapter notes found.
                  </p>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* AUTH MODAL */}

        <AuthModal
          isOpen={showAuthModal}
          onClose={() =>
            setShowAuthModal(false)
          }
        />
      </div>
    </section>
  );
}