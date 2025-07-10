import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useAuth } from "@/lib/auth";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login } = useAuth();

  const handleGoogleLogin = () => {
    login();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-md w-full mx-4 relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </Button>

        <CardContent className="p-8">
          <div className="text-center">
            <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              {/* Google Icon */}
              <svg
                    className="w-10 h-5"
                    viewBox="0 0 48 48"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fill="#fff"
                      d="M44.5 20H24v8.5h11.9C34.3 32.9 29.7 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l6.4-6.4C34.6 5.5 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20.3-7.7 20.3-21 0-1.4-.1-2.3-.3-4z"
                    />
                  </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Welcome Back</h3>
            <p className="text-gray-600 mb-6">
              Sign in with your Gmail account to access community resources
            </p>
            <Button
              onClick={handleGoogleLogin}
              className="w-full bg-primary text-white py-3 hover:bg-blue-700 transition-colors font-semibold mb-4"
            >
              {/* Google Icon */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="..." />
              </svg>
              Continue with Gmail
            </Button>
            <p className="text-sm text-gray-500">
              Only authenticated community members can access recordings and study materials
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
