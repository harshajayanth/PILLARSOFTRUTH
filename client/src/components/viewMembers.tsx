import { useState } from "react";
import { Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import MembersModal from "@/components/MembersModal";

export default function ViewMembersWidget() {
  const [isOpen, setIsOpen] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  const handleOpenMembers = () => {
    if (user?.isAuthenticated) {
      setIsOpen(true)
      return;
    }
  };

  return (
    <>
      {/* MEMBERS MODAL */}
      {isOpen && (
        <MembersModal
          onClose={() =>
            setIsOpen(false)
          }
        />
      )}

    {/* FLOATING BUTTON */}
    {user?.isAuthenticated && (
      <div className="fixed bottom-6 left-6 z-50">
        <Button
          onClick={handleOpenMembers}
          className="bg-violet-600 text-white px-5 h-14 rounded-full shadow-lg hover:bg-violet-700 transition-all duration-300 flex items-center gap-2"
        >
          {isOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Users className="h-5 w-5" />
          )}

          <span className="font-medium">
            View Members
          </span>
        </Button>
      </div>
    )}
    </>
  );
}