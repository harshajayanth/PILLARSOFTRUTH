import {
  useEffect,
} from "react";

import {
  useForm,
} from "react-hook-form";

import {
  zodResolver,
} from "@hookform/resolvers/zod";

import {
  useMutation,
  useQueryClient,
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
  Textarea,
} from "@/components/ui/textarea";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  useToast,
} from "@/hooks/use-toast";

import {
  apiRequest,
} from "@/lib/queryClient";

import {
  z,
} from "zod";

// =====================================
// SCHEMA
// =====================================
const editUserSchema =
  z.object({
    username:
      z
        .string()
        .min(
          1,
          "Username is required"
        ),

    phone:
      z
        .string()
        .min(
          10,
          "Phone number is required"
        ),

    age:
      z.coerce
        .number({
          required_error:
            "Age is required",
        })
        .min(
          1,
          "Minimum age is 1"
        )
        .max(
          120,
          "Maximum age is 120"
        ),

    position:
      z.string().optional(),

    location:
      z
        .string()
        .min(
          1,
          "Location is required"
        ),

    bio:
      z
        .string()
        .min(
          10,
          "Bio must be at least 10 characters"
        )
        .max(
          300,
          "Bio must be under 300 characters"
        ),
  });

type EditUserForm =
  z.infer<
    typeof editUserSchema
  >;

export default function EditUserModal({
  user,
  onClose,
}: {
  user: any;
  onClose: () => void;
}) {
  const { toast } =
    useToast();

  const queryClient =
    useQueryClient();

  // =====================================
  // FORM
  // =====================================
  const form =
    useForm<EditUserForm>(
      {
        resolver:
          zodResolver(
            editUserSchema
          ),

        defaultValues:
          {
            username:
              "",

            phone:
              "",

            age:
              undefined,

            location:
              "",

            bio:
              "",
          },
      }
    );

  // =====================================
  // LOAD EXISTING VALUES
  // =====================================
  useEffect(() => {
    if (user) {
      form.reset({
        username:
          user?.username ||
          "",

        phone:
          user?.phone ||
          "",

        age:
          user?.age
            ? Number(
                user.age
              )
            : undefined,

        location:
          user?.location ||
          "",

        bio:
          user?.bio ||
          "",
      });
    }
  }, [user, form]);

  // =====================================
  // UPDATE USER
  // =====================================
  const updateMutation =
    useMutation({
      mutationFn: (
        data: EditUserForm
      ) =>
        apiRequest(
          "PUT",
          `/api/users?id=${user.id}`,
          data
        ),

      onSuccess:
        async () => {
          await queryClient.invalidateQueries(
            {
              queryKey: [
                "users",
              ],

              exact:
                false,
            }
          );

          toast({
            title:
              "Success",

            description:
              "User updated successfully",
          });

          onClose();
        },

      onError: (
        error: any
      ) => {
        toast({
          title:
            "Error",

          description:
            error.message ||
            "Failed to update user",

          variant:
            "destructive",
        });
      },
    });

  // =====================================
  // SUBMIT
  // =====================================
  const onSubmit = (
    data: EditUserForm
  ) => {
    updateMutation.mutate(
      data
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="max-w-2xl w-full rounded-3xl shadow-2xl">
        <CardContent className="p-8">
          {/* HEADER */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              Edit User
            </h2>

            <Button
              variant="ghost"
              onClick={
                onClose
              }
            >
              Close
            </Button>
          </div>

          {/* FORM */}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(
                onSubmit
              )}
              className="space-y-5"
            >
              {/* USERNAME */}
              <FormField
                control={
                  form.control
                }
                name="username"
                render={({
                  field,
                }) => (
                  <FormItem>
                    <FormLabel>
                      Username
                    </FormLabel>

                    <FormControl>
                      <Input
                        placeholder="Enter username"
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
                    </FormLabel>

                    <FormControl>
                      <Input
                        type="tel"
                        maxLength={
                          10
                        }
                        placeholder="Enter phone number"
                        {...field}
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* AGE */}
              <FormField
                control={
                  form.control
                }
                name="age"
                render={({
                  field,
                }) => (
                  <FormItem>
                    <FormLabel>
                      Age
                    </FormLabel>

                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={120}
                        placeholder="Enter age"
                        value={
                          field.value ??
                          ""
                        }
                        onChange={(
                          e
                        ) => {
                          const value =
                            e
                              .target
                              .value;

                          field.onChange(
                            value ===
                              ""
                              ? undefined
                              : Number(
                                  value
                                )
                          );
                        }}
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* LOCATION */}
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
                        placeholder="Enter location"
                        {...field}
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* BIO */}
              <FormField
                control={
                  form.control
                }
                name="bio"
                render={({
                  field,
                }) => (
                  <FormItem>
                    <FormLabel>
                      Bio
                    </FormLabel>

                    <FormControl>
                      <Textarea
                        rows={4}
                        maxLength={
                          300
                        }
                        placeholder="Tell something about yourself"
                        {...field}
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* SUBMIT */}
              <Button
                type="submit"
                disabled={
                  updateMutation.isPending
                }
                className="w-full bg-black text-white py-3 hover:bg-gray-800"
              >
                {updateMutation.isPending
                  ? "Updating..."
                  : "Update User"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}