import { useState, useEffect } from "react";
import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import SessionsOverview from "@/components/sessions-overview";
import ContentLibrary from "@/components/content-library";
import GallerySection from "@/components/gallery-section";
import Footer from "@/components/footer";
import ChatbotWidget from "@/components/chatbot-widget";
import CommunityFormModal from "@/components/community-form-modal";
import DonateModal from "@/components/DonateModal"
import Announcements from "@/components/announcements-section";
import Parent from "@/components/parent";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import SignOutModal from "@/components/signoutModal";


export default function Home() {
  const [showForm, setShowForm] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    purpose: "",
    amount: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || !formData.purpose) return;
    navigate("/payment", { state: formData });
  };

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
        onOpenDonateModal={() => setShowDonateModal(true)}
      />

      <HeroSection onOpenCommunityForm={() => setShowForm(true)} />
      <SessionsOverview />
      <ContentLibrary />
      <Announcements />
      <GallerySection />
      <Parent />
      <Footer />
      <ChatbotWidget />

      {/* ✅ Join Community Modal */}
      <CommunityFormModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        presetEmail=""
      />

      {/* ✅ Sign Out Modal */}
      {showProfileModal && <SignOutModal onClose={() => setShowProfileModal(false)} />}


      {/* Donate Modal */}
      {showDonateModal && <DonateModal onClose={() => setShowDonateModal(false)} />}
    </div>
  );
}
