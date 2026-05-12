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
  z,
} from "zod";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  apiRequest,
} from "@/lib/queryClient";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Input,
} from "@/components/ui/input";

import {
  Checkbox,
} from "@/components/ui/checkbox";

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

// =====================================
// POSITIONS
// =====================================
const POSITIONS = [
  "Organisation",
  "Communication",
  "Volunteer",
  "Coordinator",
  "Member",
  "ADMIN",
  "Administration",
  "Preacher",
  "Youth Minister",
  "President"
];

// =====================================
// SCHEMA
// =====================================
const editUserSchema =
  z.object({
    role:
      z.string().min(
        1,
        "Role is required"
      ),

    access:
      z.string().min(
        1,
        "Access is required"
      ),

    position:
      z.array(
        z.string()
      ),

    youth_leader:
      z.boolean(),
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
            role:
              "user",

            access:
              "active",

            position:
              [],

            youth_leader:
              false,
          },
      }
    );

  // =====================================
  // LOAD USER
  // =====================================
  useEffect(() => {
    if (user) {
      form.reset({
        role:
          user?.role ||
          "user",

        access:
          user?.access ||
          "active",

        position:
          Array.isArray(
            user?.position
          )
            ? user.position
            : user?.position
            ? user.position
                .split(",")
                .map(
                  (
                    p: string
                  ) =>
                    p.trim()
                )
            : [],

        youth_leader:
          user?.youth_leader ===
            true ||
          user?.youth_leader ===
            "true",
      });
    }
  }, [user, form]);

  // =====================================
  // UPDATE USER
  // =====================================
  const updateMutation =
    useMutation({
      mutationFn: async (
        data: EditUserForm
      ) => {
        return apiRequest(
          "PUT",
          `/api/users?id=${user.id}`,
          {
            ...data,

            position:
              data.position.join(
                ", "
              ),
          }
        );
      },

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
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
      <Card className="max-w-md w-full rounded-3xl shadow-2xl border-0">
        <CardContent className="p-6 space-y-5">
          {/* HEADER */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Edit User
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Update member role
              and permissions
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(
                onSubmit
              )}
              className="space-y-5"
            >
              {/* NAME */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Name
                </label>

                <Input
                  value={
                    user?.username ||
                    ""
                  }
                  disabled
                  className="mt-2 bg-gray-100"
                />
              </div>

              {/* EMAIL */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Gmail
                </label>

                <Input
                  value={
                    user?.email ||
                    ""
                  }
                  disabled
                  className="mt-2 bg-gray-100"
                />
              </div>

              {/* ROLE */}
              <FormField
                control={
                  form.control
                }
                name="role"
                render={({
                  field,
                }) => (
                  <FormItem>
                    <FormLabel>
                      Role
                    </FormLabel>

                    <Select
                      value={
                        field.value
                      }
                      onValueChange={
                        field.onChange
                      }
                    >
                      <FormControl>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select Role" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        <SelectItem value="admin">
                          Admin
                        </SelectItem>

                        <SelectItem value="user">
                          User
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ACCESS */}
              <FormField
                control={
                  form.control
                }
                name="access"
                render={({
                  field,
                }) => (
                  <FormItem>
                    <FormLabel>
                      Access
                    </FormLabel>

                    <Select
                      value={
                        field.value
                      }
                      onValueChange={
                        field.onChange
                      }
                    >
                      <FormControl>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select Access" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        <SelectItem value="active">
                          Active
                        </SelectItem>

                        <SelectItem value="inactive">
                          Inactive
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* POSITION */}
              <FormField
                control={
                  form.control
                }
                name="position"
                render={({
                  field,
                }) => (
                  <FormItem>
                    <FormLabel>
                      Position
                    </FormLabel>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {POSITIONS.map(
                        (
                          position
                        ) => {
                          const active =
                            field.value.includes(
                              position
                            );

                          return (
                            <button
                              key={
                                position
                              }
                              type="button"
                              onClick={() => {
                                if (
                                  active
                                ) {
                                  field.onChange(
                                    field.value.filter(
                                      (
                                        p
                                      ) =>
                                        p !==
                                        position
                                    )
                                  );
                                } else {
                                  field.onChange(
                                    [
                                      ...field.value,
                                      position,
                                    ]
                                  );
                                }
                              }}
                              className={`px-4 py-2 rounded-full border text-sm transition ${
                                active
                                  ? "bg-black text-white border-black"
                                  : "bg-white text-black border-gray-300"
                              }`}
                            >
                              {
                                position
                              }
                            </button>
                          );
                        }
                      )}
                    </div>

                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* YOUTH LEADER */}
              <FormField
                control={
                  form.control
                }
                name="youth_leader"
                render={({
                  field,
                }) => (
                  <FormItem className="flex items-center gap-3 pt-2">
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

                    <FormLabel className="!mt-0">
                      Youth Leader
                    </FormLabel>

                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* BUTTONS */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={
                    onClose
                  }
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={
                    updateMutation.isPending
                  }
                  className="bg-black text-white hover:bg-gray-800"
                >
                  {updateMutation.isPending
                    ? "Saving..."
                    : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}