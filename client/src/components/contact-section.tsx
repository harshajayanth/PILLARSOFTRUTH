import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { useMutation } from "@tanstack/react-query";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Checkbox } from "@/components/ui/checkbox";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { useToast } from "@/hooks/use-toast";

import {
  contactFormSchema,
  ContactForm,
} from "@shared/schema";

import { apiRequest } from "@/lib/queryClient";

export default function ContactFormModal({
  isOpen,
  onClose,
  presetEmail,
}: {
  isOpen: boolean;
  onClose: () => void;
  presetEmail?: string;
}) {
  const { toast } =
    useToast();

  const form =
    useForm<ContactForm>({
      resolver:
        zodResolver(
          contactFormSchema
        ),

      defaultValues: {
        firstName: "",
        lastName: "",
        email:
          presetEmail ||
          "",
        phone: "",
        location: "",
        hearAbout: "",
        message: "",
        agreeCommunications:
          false,
      },
    });

  const contactMutation =
    useMutation({
      mutationFn: (
        data: ContactForm
      ) =>
        apiRequest(
          "POST",
          "/api/contact",
          data
        ),

      onSuccess: () => {
        toast({
          title:
            "Application Submitted!",
          description:
            "Thank you for your interest. We'll get back to you soon.",
        });

        form.reset();

        onClose();
      },

      onError: (
        error: Error
      ) => {
        toast({
          title:
            "Submission Failed",
          description:
            error.message ||
            "Please try again later.",

          variant:
            "destructive",
        });
      },
    });

  const onSubmit = (
    data: ContactForm
  ) => {
    contactMutation.mutate(
      data
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="max-w-3xl w-full overflow-y-auto max-h-[90vh] rounded-3xl">
        <CardContent className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Join Our
              Community
            </h2>

            <Button
              variant="ghost"
              size="sm"
              onClick={
                onClose
              }
            >
              Close
            </Button>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(
                onSubmit
              )}
              className="space-y-6"
            >
              {/* NAMES */}
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={
                    form.control
                  }
                  name="firstName"
                  render={({
                    field,
                  }) => (
                    <FormItem>
                      <FormLabel>
                        First
                        Name
                      </FormLabel>

                      <FormControl>
                        <Input
                          {...field}
                        />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={
                    form.control
                  }
                  name="lastName"
                  render={({
                    field,
                  }) => (
                    <FormItem>
                      <FormLabel>
                        Last
                        Name
                      </FormLabel>

                      <FormControl>
                        <Input
                          {...field}
                        />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* EMAIL */}
              <FormField
                control={
                  form.control
                }
                name="email"
                render={({
                  field,
                }) => (
                  <FormItem>
                    <FormLabel>
                      Email
                      Address
                    </FormLabel>

                    <FormControl>
                      <Input
                        type="email"
                        {...field}
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* PHONE */}
              <FormField
                control={
                  form.control
                }
                name="phone"
                render={({
                  field,
                }) => (
                  <FormItem>
                    <FormLabel>
                      Phone
                      Number
                    </FormLabel>

                    <FormControl>
                      <Input
                        type="tel"
                        {...field}
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* AGE + LOCATION */}
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Age
                        </FormLabel>

                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={120}
                            placeholder="Enter your age"
                            value={
                              field.value ?? ""
                            }
                            onChange={(e) => {
                              const value =
                                e.target.value;

                              field.onChange(
                                value === ""
                                  ? undefined
                                  : Number(value)
                              );
                            }}
                          />
                        </FormControl>

                        <FormMessage />
                      </FormItem>
                    )}
                  />

                <FormField
                  control={
                    form.control
                  }
                  name="location"
                  render={({
                    field,
                  }) => (
                    <FormItem>
                      <FormLabel>
                        Location
                      </FormLabel>

                      <FormControl>
                        <Input
                          {...field}
                        />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* HEAR ABOUT */}
              <FormField
                control={
                  form.control
                }
                name="hearAbout"
                render={({
                  field,
                }) => (
                  <FormItem>
                    <FormLabel>
                      How
                      did
                      you
                      hear
                      about
                      us?
                    </FormLabel>

                    <Select
                      onValueChange={
                        field.onChange
                      }
                      defaultValue={
                        field.value
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        <SelectItem value="friend">
                          Friend/Family
                        </SelectItem>

                        <SelectItem value="church">
                          Church
                        </SelectItem>

                        <SelectItem value="social">
                          Social
                          Media
                        </SelectItem>

                        <SelectItem value="other">
                          Other
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* MESSAGE */}
              <FormField
                control={
                  form.control
                }
                name="message"
                render={({
                  field,
                }) => (
                  <FormItem>
                    <FormLabel>
                      Bio
                    </FormLabel>

                    <FormControl>
                      <Textarea
                        {...field}
                        rows={4}
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* CHECKBOX */}
              <FormField
                control={
                  form.control
                }
                name="agreeCommunications"
                render={({
                  field,
                }) => (
                  <FormItem className="flex items-start space-x-3">
                    <FormControl>
                      <Checkbox
                        checked={
                          field.value
                        }
                        onCheckedChange={
                          field.onChange
                        }
                      />
                    </FormControl>

                    <FormLabel className="text-sm text-gray-600">
                      I
                      agree
                      to
                      receive
                      communications
                    </FormLabel>

                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* SUBMIT */}
              {form.watch(
                "agreeCommunications"
              ) && (
                <Button
                  type="submit"
                  disabled={
                    contactMutation.isPending
                  }
                  className="w-full bg-black text-white py-3 hover:bg-gray-800 transition-colors font-semibold"
                >
                  {contactMutation.isPending
                    ? "Submitting..."
                    : "Submit Application"}
                </Button>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}