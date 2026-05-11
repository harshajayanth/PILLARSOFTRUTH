import {
  useState,
} from "react";

import {
  useMutation,
} from "@tanstack/react-query";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import {
  Button,
} from "@/components/ui/button";

import {
  Input,
} from "@/components/ui/input";

import {
  useToast,
} from "@/hooks/use-toast";

import {
  MessageCircle,
  X,
  Send,
  Bus,
  Users,
} from "lucide-react";

import {
  ChatMessage,
  chatMessageSchema,
} from "@shared/schema";

import {
  apiRequest,
} from "@/lib/queryClient";

import {
  useAuth,
} from "@/lib/auth";

export default function ChatbotWidget() {
  const [
    isOpen,
    setIsOpen,
  ] = useState(
    false
  );

  const [
    selectedRoute,
    setSelectedRoute,
  ] = useState<
    | "admin"
    | "members"
    | "youth_leaders"
    | "organisation"
    | "communication"
    | null
  >(null);

  const [
    message,
    setMessage,
  ] = useState(
    ""
  );

  const { toast } =
    useToast();

  const { user } =
    useAuth();

  // =====================================
  // SEND MESSAGE
  // =====================================
  const chatMutation =
    useMutation({
      mutationFn: (
        data: ChatMessage
      ) =>
        apiRequest(
          "POST",
          "/api/chat",
          data
        ),

      onSuccess:
        () => {
          toast({
            title:
              "Message Sent!",

            description:
              "Your message has been delivered successfully.",
          });

          setMessage(
            ""
          );

          setSelectedRoute(
            null
          );

          setIsOpen(
            false
          );
        },

      onError: (
        error: any
      ) => {
        toast({
          title:
            "Failed to Send",

          description:
            error.message ||
            "Please try again later.",

          variant:
            "destructive",
        });
      },
    });

  // =====================================
  // SELECT ROUTE
  // =====================================
  const handleRouteSelect =
    (
      route:
        | "admin"
        | "members"
        | "youth_leaders"
        | "organisation"
        | "communication"
    ) => {
      setSelectedRoute(
        route
      );
    };

  // =====================================
  // SEND MESSAGE
  // =====================================
  const handleSendMessage =
    () => {
      if (
        !message.trim() ||
        !selectedRoute
      )
        return;

      const chatData: ChatMessage =
        {
          message:
            message.trim(),

          route:
            selectedRoute,

          senderEmail:
            user?.email ||
            "",
        };

      // VALIDATE
      const validation =
        chatMessageSchema.safeParse(
          chatData
        );

      if (
        !validation.success
      ) {
        toast({
          title:
            "Invalid Message",

          description:
            validation
              .error
              .errors[0]
              ?.message ||
            "Please check your message and try again.",

          variant:
            "destructive",
        });

        return;
      }

      chatMutation.mutate(
        validation.data
      );
    };

  // =====================================
  // ENTER KEY
  // =====================================
  const handleKeyPress =
    (
      e: React.KeyboardEvent
    ) => {
      if (
        e.key ===
          "Enter" &&
        !e.shiftKey
      ) {
        e.preventDefault();

        handleSendMessage();
      }
    };

  // =====================================
  // RESET
  // =====================================
  const resetChat =
    () => {
      setSelectedRoute(
        null
      );

      setMessage(
        ""
      );
    };

  // =====================================
  // ROUTE LABEL
  // =====================================
  const getRouteLabel =
    () => {
      switch (
        selectedRoute
      ) {
        case "admin":
          return "Community Admin";

        case "members":
          return "Community Members";

        case "youth_leaders":
          return "Youth Leaders";

        case "organisation":
          return "Organisation Team";

        case "communication":
          return "Communication Team";

        default:
          return "";
      }
    };

  // =====================================
  // AUTH CHECK
  // =====================================
  if (
    !user?.isAuthenticated
  )
    return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* CHAT WINDOW */}
      {isOpen && (
        <Card className="mb-4 w-80 h-[500px] shadow-2xl border border-gray-200 overflow-hidden">
          {/* HEADER */}
          <div className="bg-primary text-white p-4 flex items-center justify-between">
            <div className="flex items-center">
              <MessageCircle className="h-5 w-5 mr-2" />

              <span className="font-semibold">
                Community
                Chat
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsOpen(
                  false
                );

                resetChat();
              }}
              className="text-white hover:text-gray-200 hover:bg-blue-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* CONTENT */}
          <CardContent className="p-4 h-[340px] overflow-y-auto bg-gray-50">
            {!selectedRoute ? (
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  Who would
                  you like
                  to connect
                  with?
                </p>

                <div className="space-y-2">
                  {/* ADMIN */}
                  <Button
                    onClick={() =>
                      handleRouteSelect(
                        "admin"
                      )
                    }
                    className="w-full bg-primary text-white hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Bus className="h-4 w-4 mr-2" />

                    Community
                    Admin
                  </Button>

                  {/* MEMBERS */}
                  <Button
                    onClick={() =>
                      handleRouteSelect(
                        "members"
                      )
                    }
                    className="w-full bg-secondary text-white hover:bg-purple-700 transition-colors text-sm"
                  >
                    <Users className="h-4 w-4 mr-2" />

                    Community
                    Members
                  </Button>

                  {/* YOUTH LEADERS */}
                  <Button
                    onClick={() =>
                      handleRouteSelect(
                        "youth_leaders"
                      )
                    }
                    className="w-full bg-green-600 text-white hover:bg-green-700 transition-colors text-sm"
                  >
                    <Users className="h-4 w-4 mr-2" />

                    Youth
                    Leaders
                  </Button>

                  {/* ORGANISATION */}
                  <Button
                    onClick={() =>
                      handleRouteSelect(
                        "organisation"
                      )
                    }
                    className="w-full bg-black text-white hover:bg-gray-800 transition-colors text-sm"
                  >
                    <Users className="h-4 w-4 mr-2" />

                    Organisation
                    Team
                  </Button>

                  {/* COMMUNICATION */}
                  <Button
                    onClick={() =>
                      handleRouteSelect(
                        "communication"
                      )
                    }
                    className="w-full bg-yellow-600 text-white hover:bg-yellow-700 transition-colors text-sm"
                  >
                    <Users className="h-4 w-4 mr-2" />

                    Communication
                    Team
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                {/* SELECTED ROUTE */}
                <div className="mb-4 p-3 bg-white rounded-lg border">
                  <p className="text-sm text-gray-600">
                    Sending
                    message
                    to:{" "}
                    <span className="font-semibold">
                      {getRouteLabel()}
                    </span>
                  </p>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={
                      resetChat
                    }
                    className="text-primary hover:text-blue-700 p-0 h-auto"
                  >
                    Change
                    recipient
                  </Button>
                </div>

                <div className="text-sm text-gray-600">
                  <p>
                    Type your
                    message
                    below and
                    we'll
                    route it
                    appropriately.
                  </p>
                </div>
              </div>
            )}
          </CardContent>

          {/* MESSAGE INPUT */}
          {selectedRoute && (
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex space-x-2">
                <Input
                  value={
                    message
                  }
                  onChange={(
                    e
                  ) =>
                    setMessage(
                      e
                        .target
                        .value
                    )
                  }
                  onKeyDown={
                    handleKeyPress
                  }
                  placeholder="Type your message..."
                  className="flex-1 text-sm"
                  disabled={
                    chatMutation.isPending
                  }
                />

                <Button
                  onClick={
                    handleSendMessage
                  }
                  disabled={
                    !message.trim() ||
                    chatMutation.isPending
                  }
                  className="bg-primary text-white hover:bg-blue-700 transition-colors"
                  size="sm"
                >
                  {chatMutation.isPending ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* TOGGLE BUTTON */}
      <Button
        onClick={() =>
          setIsOpen(
            !isOpen
          )
        }
        className="bg-primary text-white w-14 h-14 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 flex items-center justify-center"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}