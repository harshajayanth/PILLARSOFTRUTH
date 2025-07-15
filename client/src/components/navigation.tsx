import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { Church, Menu, X } from "lucide-react";

export default function Navigation({
  onOpenCommunityForm,
  onOpenProfileModal,
  onOpenDonateModal,
}: {
  onOpenCommunityForm: () => void;
  onOpenProfileModal: () => void;
  onOpenDonateModal: () => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, login } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 w-full z-50 blur-backdrop border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Church className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-gray-900">
              Pillars of Truth
            </span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-8">
            {[
              "home",
              "sessions",
              "recordings",
              "gallery",
              ...(user?.isAuthenticated ? ["announcements"] : []),
            ].map((id) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className="text-gray-600 hover:text-primary transition-colors"
              >
                {id.charAt(0).toUpperCase() + id.slice(1)}
              </button>
            ))}

            {!user?.isAuthenticated && (
              <button
                onClick={onOpenCommunityForm}
                className="text-gray-600 hover:text-primary transition-colors"
              >
                Contact
              </button>
            )}
          </div>

          {/* Right Side: Auth & Menu */}
          <div className="flex items-center space-x-4">
            {user?.isAuthenticated ? (
              <>
                <Button
                  onClick={onOpenDonateModal}
                  className="bg-green-800 text-white rounded-full px-6 py-2 
             hover:bg-green-700 transition 
             ring-2 ring-green-600 ring-offset-2"
                >
                  Donate
                </Button>

                <button
                  onClick={onOpenProfileModal}
                  className="focus:outline-none"
                >
                  <img
                    src={user.picture}
                    onError={(e) => {
                      e.currentTarget.src = "/images/person.png";
                    }}
                    alt="Person"
                    className="w-12 h-12 rounded-full shadow-lg border-2 border-primary object-cover transition-all"
                  />
                </button>
              </>
            ) : (
              <div className="flex justify-center gap-4">
                <Button
                  onClick={login}
                  className="bg-primary text-white hover:bg-blue-700"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    viewBox="0 0 48 48"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fill="#fff"
                      d="M44.5 20H24v8.5h11.9C34.3 32.9 29.7 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l6.4-6.4C34.6 5.5 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20.3-7.7 20.3-21 0-1.4-.1-2.3-.3-4z"
                    />
                  </svg>
                  Sign In
                </Button>
                <Button
                  onClick={onOpenCommunityForm}
                  variant="outline"
                  className="text-primary border-primary hover:bg-primary/10"
                >
                  Join Community
                </Button>
              </div>
            )}

            <button
              className="md:hidden text-gray-600"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-2">
              {[
                "home",
                "sessions",
                "recordings",
                "gallery",
                ...(user?.isAuthenticated ? ["announcements"] : []),
              ].map((id) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className="text-left px-4 py-2 text-gray-600 hover:text-primary transition-colors"
                >
                  {id.charAt(0).toUpperCase() + id.slice(1)}
                </button>
              ))}
              {!user?.isAuthenticated && (
                <button
                  onClick={() => {
                    setShowForm(true);
                    setIsMenuOpen(false);
                  }}
                  className="text-left px-4 py-2 text-gray-600 hover:text-primary transition-colors"
                >
                  Contact
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
