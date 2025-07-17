import { useState, useEffect } from "react";
import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import SessionsOverview from "@/components/sessions-overview";
import ContentLibrary from "@/components/content-library";
import GallerySection from "@/components/gallery-section";
import Footer from "@/components/footer";
import ChatbotWidget from "@/components/chatbot-widget";
import CommunityFormModal from "@/components/community-form-modal";
import DonateModal from "@/components/DonateModal";
import Announcements from "@/components/announcements-section";
import Parent from "@/components/parent";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import SignOutModal from "@/components/signoutModal";
import About from "@/components/about";
import LoadingSpinner from "@/components/ui/loading-spinner";

export default function Home() {
  const [showForm, setShowForm] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const { toast } = useToast();
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const auth = params.get("auth");
    const reason = params.get("reason") || "";

    if (auth === "denied") {
      toast({
        title: "Access Denied",
        description:
          reason || "You are not registered. Please Join our community first",
        variant: "destructive",
      });
    } else if (auth === "pending") {
      toast({
        title: "Access Pending",
        description:
          reason ||
          "Your access is not approved yet.Please Contact Your Administrator.",
        variant: "destructive",
      });
    } else if (auth === "error") {
      toast({
        title: "Authentication Error",
        description: reason || "Something went wrong.",
        variant: "destructive",
      });
    }
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <LoadingSpinner />
        <p className="text-lg font-medium text-gray-700">
          Checking authentication...
        </p>
      </div>
    );
  }

  // ✅ Show public Home, but add logged-in-only features if user exists
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        onOpenCommunityForm={() => setShowForm(true)}
        onOpenProfileModal={() => setShowProfileModal(true)}
        onOpenDonateModal={() => setShowDonateModal(true)}
        onshowAboutModal={() => setShowAboutModal(true)}
      />

      <HeroSection onOpenCommunityForm={() => setShowForm(true)} />
      <SessionsOverview />
      <ContentLibrary />
      <Announcements />
      <GallerySection />
      <Parent />
      <Footer />
      <ChatbotWidget />

      <CommunityFormModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        presetEmail={user?.email || ""}
      />

      {showAboutModal && (<About onClose={()=>setShowAboutModal(false)}/>)}

      {/* ✅ Only show profile/donate modals if logged in */}
      {user && showProfileModal && (
        <SignOutModal onClose={() => setShowProfileModal(false)} />
      )}
      {user && showDonateModal && (
        <DonateModal onClose={() => setShowDonateModal(false)} />
      )}
    </div>
  );
}
