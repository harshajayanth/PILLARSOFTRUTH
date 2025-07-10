import { useState, useEffect } from "react";
import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import SessionsOverview from "@/components/sessions-overview";
import ContentLibrary from "@/components/content-library";
import GallerySection from "@/components/gallery-section";
import Footer from "@/components/footer";
import ChatbotWidget from "@/components/chatbot-widget";
import CommunityFormModal from "@/components/community-form-modal";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [showForm, setShowForm] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { toast } = useToast();
  const { user, logout } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth") === "unauthorized") {
      toast({
        title: "Access Denied",
        description: "You are not registered. Please join the community first.",
        variant: "destructive",
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ✅ Navigation triggers modals */}
      <Navigation
        onOpenCommunityForm={() => setShowForm(true)}
        onOpenProfileModal={() => setShowProfileModal(true)}
      />

      <HeroSection onOpenCommunityForm={() => setShowForm(true)} />
      <SessionsOverview />
      <ContentLibrary />
      <GallerySection />
      <Footer />
      <ChatbotWidget />

      {/* ✅ Join Community Modal */}
      <CommunityFormModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        presetEmail=""
      />

      {/* ✅ Sign Out Modal */}
      {showProfileModal && user && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl p-6 w-80 relative text-center">
            <img
              src={user.picture ?? `https://ui-avatars.com/api/?name=${user.name}`}
              alt={user.name}
              className="w-20 h-20 rounded-full mx-auto mb-4 border-1 border-primary object-cover"
            />
            <h2 className="font-bold text-lg">{user.name}</h2>
            <p className="text-gray-500 text-sm mb-4">{user.email}</p>

            <Button
              onClick={() => {
                logout();
                setShowProfileModal(false);
              }}
              className="bg-red-500 text-white w-full hover:bg-red-600"
            >
              Sign Out
            </Button>

            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
