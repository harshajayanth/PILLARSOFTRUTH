import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Cross } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";

export default function HeroSection({
  onOpenCommunityForm,
}: {
  onOpenCommunityForm: () => void;
}) {
  const { user } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTitle, setShowTitle] = useState(false);

  const scrollToSections = () => {
    const element = document.getElementById("sessions");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToContact = () => {
    const element = document.getElementById("announcements");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (user?.isAuthenticated) {
      setTimeout(() => setShowWelcome(true), 200); // Delay welcome
      setTimeout(() => setShowTitle(true), 800); // Delay title
    } else {
      setShowTitle(true); // Always show title if unauthenticated
    }
  }, [user]);

  return (
    <section
      id="home"
      className="pt-16 gradient-bg text-white relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <div className="animate-float mb-8">
            <Cross className="h-16 w-16 text-accent mx-auto" />
          </div>

          {/* Welcome User */}
          {showWelcome && user?.name && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-xl font-medium text-blue-100 mb-2"
            >
              Welcome, {user.name}
            </motion.p>
          )}

          {/* Title */}
          {showTitle && (
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-6xl font-bold mb-6"
            >
              Pillars of Truth
            </motion.h1>
          )}

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-xl md:text-2xl mb-4 text-blue-100"
          >
            Youth Community for Learning, Teaching & Preaching God's Word
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="text-lg text-blue-200 mb-8 italic max-w-4xl mx-auto"
          >
            "If I am delayed, you will know how people ought to conduct themselves in God’s household, which is the church of the living God, the pillar and foundation of the truth." – 1 Timothy 3:15
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <Button
              onClick={scrollToSections}
              className="bg-accent text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-yellow-500 transition-colors"
              size="lg"
            >
              Explore Sessions
            </Button>

            {user?.isAuthenticated ? (
              <Button
                onClick={scrollToContact}
                variant="outline"
                className="border-2 border-white text-black px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary transition-colors"
                size="lg"
              >
                Announcements
              </Button>
            ) : (
              <Button
                onClick={onOpenCommunityForm}
                variant="outline"
                className="border-2 border-white text-black px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary transition-colors"
                size="lg"
              >
                Join Community
              </Button>
            )}
          </motion.div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-50 to-transparent"></div>
    </section>
  );
}
