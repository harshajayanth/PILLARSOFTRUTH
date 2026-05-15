import { useState } from "react";

import { useMutation } from "@tanstack/react-query";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";

import { useToast } from "@/hooks/use-toast";

import {
  MessageCircle,
  X,
  Send,
  ArrowLeft,
  Bus,
  Users,
  Mail,
} from "lucide-react";

import {
  ChatMessage,
  chatMessageSchema,
} from "@shared/schema";

import { apiRequest } from "@/lib/queryClient";

import { useAuth } from "@/lib/auth";

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] =
    useState(false);

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

  const [message, setMessage] =
    useState("");

  const { toast } = useToast();

  const { user } = useAuth();

  const [subject, setSubject] =
    useState("");

  const MAX_MESSAGE_LENGTH = 1000;

  const MAX_SUBJECT_LENGTH = 100;

  // =====================================
  // SEND MESSAGE
  // =====================================
  const chatMutation = useMutation({
    mutationFn: (
      data: ChatMessage
    ) =>
      apiRequest(
        "POST",
        "/api/chat",
        data
      ),

    onSuccess: () => {
      toast({
        title: "Message Sent!",

        description:
          "Your message has been delivered successfully.",
      });

      setMessage("");
      setSubject("");

      setSelectedRoute(null);

      setIsOpen(false);
    },

    onError: (error: any) => {
      toast({
        title: "Failed to Send",

        description:
          error.message ||
          "Please try again later.",

        variant: "destructive",
      });
    },
  });

  // =====================================
  // SELECT ROUTE
  // =====================================
  const handleRouteSelect = (
    route:
      | "admin"
      | "members"
      | "youth_leaders"
      | "organisation"
      | "communication"
  ) => {
    setSelectedRoute(route);
  };

  // =====================================
  // SEND MESSAGE
  // =====================================
  const handleSendMessage =
    () => {
      if (
        !message.trim() ||
        !subject.trim() ||
        !selectedRoute
      )
        return;

      if (
        message.length >
        MAX_MESSAGE_LENGTH
      ) {
        toast({
          title:
            "Message Too Long",

          description: `Maximum ${MAX_MESSAGE_LENGTH} characters allowed.`,

          variant:
            "destructive",
        });

        return;
      }

      const chatData: ChatMessage =
        {
          message:
            message.trim(),

          subject:
            subject.trim(),

          route:
            selectedRoute,

          senderEmail:
            user?.email || "",
        };

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
  // RESET
  // =====================================
  const resetChat = () => {
    setSelectedRoute(null);

    setMessage("");
    setSubject("");
  };

  // =====================================
  // ROUTE LABEL
  // =====================================
  const getRouteLabel = () => {
    switch (selectedRoute) {
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
  if (!user?.isAuthenticated)
    return null;

  return (
    <>
      {/* OPEN BUTTON */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() =>
              setIsOpen(true)
            }
            className="bg-primary text-white w-14 h-14 rounded-full shadow-xl hover:bg-blue-700 transition-all duration-300"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <Card className="w-[95vw] sm:w-[720px] h-[90vh] sm:h-[700px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* HEADER */}
            <div className="border-b bg-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Community Mail
                  </h2>

                  <p className="text-sm text-gray-500">
                    Send messages to
                    community teams
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsOpen(false);

                  resetChat();
                }}
                className="rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* ROUTE SELECTION */}
            {!selectedRoute ? (
              <CardContent className="p-6 bg-gray-50 flex-1 overflow-y-auto">
                <div className="mb-6">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                    Choose Recipient
                  </h3>

                  <p className="text-sm text-gray-600">
                    Select the team you
                    want to contact.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* ADMIN */}
                  <button
                    onClick={() =>
                      handleRouteSelect(
                        "admin"
                      )
                    }
                    className="group bg-white border rounded-2xl p-5 text-left hover:border-primary hover:shadow-lg transition-all duration-300"
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                      <Bus className="h-6 w-6 text-blue-700" />
                    </div>

                    <h4 className="font-semibold text-gray-900 mb-1">
                      Community Admin
                    </h4>

                    <p className="text-sm text-gray-500">
                      Send queries
                      directly to
                      administrators.
                    </p>
                  </button>

                  {/* MEMBERS */}
                  <button
                    onClick={() =>
                      handleRouteSelect(
                        "members"
                      )
                    }
                    className="group bg-white border rounded-2xl p-5 text-left hover:border-purple-500 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
                      <Users className="h-6 w-6 text-purple-700" />
                    </div>

                    <h4 className="font-semibold text-gray-900 mb-1">
                      Community Members
                    </h4>

                    <p className="text-sm text-gray-500">
                      Reach out to all
                      community members.
                    </p>
                  </button>

                  {/* YOUTH LEADERS */}
                  <button
                    onClick={() =>
                      handleRouteSelect(
                        "youth_leaders"
                      )
                    }
                    className="group bg-white border rounded-2xl p-5 text-left hover:border-green-500 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-4">
                      <Users className="h-6 w-6 text-green-700" />
                    </div>

                    <h4 className="font-semibold text-gray-900 mb-1">
                      Youth Leaders
                    </h4>

                    <p className="text-sm text-gray-500">
                      Connect with youth
                      leadership teams.
                    </p>
                  </button>

                  {/* ORGANISATION */}
                  <button
                    onClick={() =>
                      handleRouteSelect(
                        "organisation"
                      )
                    }
                    className="group bg-white border rounded-2xl p-5 text-left hover:border-gray-700 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center mb-4">
                      <Users className="h-6 w-6 text-gray-800" />
                    </div>

                    <h4 className="font-semibold text-gray-900 mb-1">
                      Organisation Team
                    </h4>

                    <p className="text-sm text-gray-500">
                      Contact
                      organisational
                      management.
                    </p>
                  </button>

                  {/* COMMUNICATION */}
                  <button
                    onClick={() =>
                      handleRouteSelect(
                        "communication"
                      )
                    }
                    className="group bg-white border rounded-2xl p-5 text-left hover:border-yellow-500 hover:shadow-lg transition-all duration-300 sm:col-span-2"
                  >
                    <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center mb-4">
                      <Users className="h-6 w-6 text-yellow-700" />
                    </div>

                    <h4 className="font-semibold text-gray-900 mb-1">
                      Communication Team
                    </h4>

                    <p className="text-sm text-gray-500">
                      Discuss
                      announcements and
                      communications.
                    </p>
                  </button>
                </div>
              </CardContent>
            ) : (
              /* COMPOSE SCREEN */
              <div className="flex flex-col flex-1 min-h-0 bg-white">
                {/* COMPOSE HEADER */}
                <div className="border-b px-6 py-4 bg-gray-50 flex items-center justify-between shrink-0">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      New Message
                    </h3>

                    <p className="text-sm text-gray-500">
                      Compose your
                      message
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    onClick={resetChat}
                    className="rounded-full hover:bg-primary/10 text-primary"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Change Recipient
                  </Button>
                </div>

                {/* EMAIL DETAILS */}
                <div className="px-6 py-5 border-b bg-white space-y-5 shrink-0">
                  {/* SUBJECT */}
                  <div className="flex items-start gap-4">
                    <span className="text-sm font-medium text-gray-500 min-w-[55px] pt-3">
                      Subject
                    </span>

                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => {
                        if (
                          e.target.value.length <=
                          MAX_SUBJECT_LENGTH
                        ) {
                          setSubject(
                            e.target.value
                          );
                        }
                      }}
                      placeholder="Enter email subject..."
                      disabled={
                        chatMutation.isPending
                      }
                      className="
                        flex-1
                        border
                        rounded-xl
                        px-4
                        py-3
                        text-sm
                        outline-none
                        focus:ring-2
                        focus:ring-primary/20
                        focus:border-primary
                        bg-white
                      "
                    />
                  </div>
                  {/* TO */}
                  <div className="flex items-start gap-4">
                    <span className="text-sm font-medium text-gray-500 min-w-[55px] pt-1">
                      To
                    </span>

                    <div className="flex flex-wrap gap-2">
                      <Badge className="rounded-full px-4 py-1.5 bg-primary text-white text-sm font-medium hover:bg-primary">
                        {getRouteLabel()}
                      </Badge>
                    </div>
                  </div>

                  {/* FROM */}
                  <div className="flex items-start gap-4">
                    <span className="text-sm font-medium text-gray-500 min-w-[55px] pt-1">
                      From
                    </span>

                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="secondary"
                        className="rounded-full px-4 py-1.5 text-sm font-medium"
                      >
                        {user?.email}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* BODY */}
                <div className="flex-1 flex flex-col min-h-0 bg-white">
                  <div className="flex-1 overflow-auto px-6 py-5">
                    <textarea
                      value={message}
                      onChange={(
                        e
                      ) => {
                        const value =
                          e.target
                            .value;

                        if (
                          value.length <=
                          MAX_MESSAGE_LENGTH
                        ) {
                          setMessage(
                            value
                          );
                        }
                      }}
                      placeholder="Write your message..."
                      disabled={
                        chatMutation.isPending
                      }
                      className="
                        w-full
                        h-full
                        min-h-[300px]
                        resize-none
                        border-0
                        outline-none
                        bg-transparent
                        text-[15px]
                        leading-7
                        focus:outline-none
                      "
                    />
                  </div>

          
                </div>

                {/* FOOTER */}
                <div className="border-t bg-gray-50 px-6 py-4 flex items-center justify-between shrink-0">
                  
                    <p
                      className={`text-sm font-medium ${
                        message.length >=
                        MAX_MESSAGE_LENGTH
                          ? "text-red-500"
                          : "text-gray-400"
                      }`}
                    >
                      {message.length}/
                      {
                        MAX_MESSAGE_LENGTH
                      }
                    </p>
         

                  <Button
                    onClick={
                      handleSendMessage
                    }
                    disabled={
                      !message.trim() ||
                      !subject.trim() ||
                      chatMutation.isPending
                    }
                    className="rounded-full px-6"
                  >
                    {chatMutation.isPending ? (
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}

                    Send Message
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
}