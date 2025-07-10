// components/community-form-modal.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import ContactForm from "@/components/contact-section";

export default function CommunityFormModal({
  isOpen,
  onClose,
  presetEmail,
}: {
  isOpen: boolean;
  onClose: () => void;
  presetEmail: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex items-center justify-center min-h-screen w-full">
        <Card className="max-w-lg w-full mx-4 relative">
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </Button>
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-6 text-center">
              Join the Pillars of Truth Community
            </h2>
            <ContactForm presetEmail={presetEmail} onClose={onClose} isOpen />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
