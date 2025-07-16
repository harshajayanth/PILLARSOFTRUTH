import { useEffect, useState } from "react";
import { Announcement } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from "@/components/ui/loading-spinner";

export default function AnnouncementSection() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [sentAnnouncements, setSentAnnouncements] = useState<string[]>([]);
  const { user } = useAuth();
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/announcements")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAnnouncements(data);
        } else {
          console.error("Invalid announcements response:", data);
          setAnnouncements([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load announcements", err);
        setAnnouncements([]);
        setLoading(false);
      });
  }, []);

  const sendAnnouncement = async (a: Announcement) => {
    try {
      setSendingId(a.id); // Start sending
      const res = await fetch("/api/send-announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(a),
      });

      if (res.ok) {
        setSentAnnouncements((prev) => [...prev, a.id]);
      } else {
        const error = await res.json();
        alert("Failed to send email: " + error.message);
      }
    } catch (err) {
      console.error("Send error:", err);
      alert("Error sending announcement");
    } finally {
      setSendingId(null); // Reset after sending
    }
  };

  if (!user?.isAuthenticated) return null;

  return (
    <section id="announcements" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">
            Community Announcements
          </h2>
          <p className="text-gray-600 mt-2">
            Stay informed about upcoming events and initiatives.
          </p>
        </div>

        {loading ? (
          <LoadingSpinner/>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {/* Create Announcement Card */}
            <a
              href="/api/create-announcement"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-none w-80 h-80 bg-white border border-dashed border-blue-400 rounded-xl shadow-sm hover:shadow-md transition flex flex-col justify-center items-center"
            >
              <span className="material-icons text-blue-500 text-4xl mb-2">
                add_circle_outline
              </span>
              <span className="font-medium text-blue-600 text-base">
                Create Announcement
              </span>
            </a>

            {/* Announcement Cards */}
            {announcements?.map((a) => (
              <article
                key={a.id}
                className="flex-none w-80 h-80 bg-white border border-gray-200 rounded-xl overflow-hidden shadow hover:shadow-md transition flex flex-col justify-between"
              >
                {/* ── Body ─────────────────── */}
                <div className="p-4 space-y-2">
                  <h3 className="text-[20px] font-bold text-primary mb-3 flex justify-between items-center gap-2">
                    {a.title}
                    {sentAnnouncements.includes(a.id) ? (
                      <div className="flex items-center text-green-600 bg-green-100 px-2 py-1 rounded text-sm gap-1">
                        <span className="material-icons">check</span>
                        Sent
                      </div>
                    ) : sendingId === a.id ? (
                      <div className="flex items-center text-gray-500 bg-gray-100 px-2 py-1 rounded text-sm gap-1">
                        Sending...
                      </div>
                    ) : (user.role==="admin"&&
                      <button
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm border border-blue-200 rounded px-2 py-1"
                        onClick={() => sendAnnouncement(a)}
                      >
                        <span className="material-icons" title="Send Gmail">mail</span>
                      </button>
                    )}
                  </h3>

                  <div className="text-[16px] text-gray-700 flex flex-col items-start font-medium gap-1">
                    <div className="flex items-center gap-2">
                      <span className="material-icons text-[20px]">
                        handshake
                      </span>
                      <span>{a.event}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-icons text-[20px]">event</span>
                      <span>{a.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-icons text-[20px]">
                        schedule
                      </span>
                      <span>
                        {a.fromtime} - {a.totime}
                      </span>
                    </div>
                  </div>

                  <div className="text-[16px] text-gray-700 flex items-center gap-2 font-medium">
                    <span className="material-icons text-[20px]">place</span>
                    <span>{a.venue}</span>
                  </div>

                  <div className="text-[16px] text-gray-700 flex items-center gap-2 font-medium">
                    <span className="material-icons text-[20px]">person</span>
                    <span>{a.organiser}</span>
                  </div>
                </div>

                {/* ── Footer: More details ───────────────────────────── */}
                <div className="border-t px-4 py-3 bg-gray-50 flex justify-center">
                  {a.file && (
                    <button
                      onClick={() => setSelectedFile(a.file)}
                      className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      View More Details
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Modal for file */}
        <AnimatePresence>
          {selectedFile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white max-w-3xl w-full rounded-xl p-6 relative shadow-2xl"
              >
                <button
                  className="absolute top-3 right-4 text-2xl text-gray-500 hover:text-gray-700"
                  onClick={() => setSelectedFile(null)}
                >
                  &times;
                </button>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">
                  Event Attachment
                </h3>
                {selectedFile && (
                  <iframe
                    src={selectedFile}
                    className="w-full h-[500px] rounded-md"
                  />
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
