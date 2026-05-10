import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function EditUserModal({
  user,
  onClose,
}: {
  user: any;
  onClose: () => void;
}) {
  const { toast } = useToast();

  const queryClient =
    useQueryClient();

  const [formData, setFormData] =
    useState({
      ...user,
    });

  // =====================================
  // UPDATE USER
  // =====================================
  const updateMutation =
    useMutation({
      mutationFn: (
        data: any
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
              Update member
              role and
              access
              permissions
            </p>
          </div>

          {/* NAME */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Name
            </label>

            <Input
              value={
                formData.username
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
                formData.email
              }
              disabled
              className="mt-2 bg-gray-100"
            />
          </div>

          {/* ROLE */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Role
            </label>

            <Select
              value={
                formData.role
              }
              onValueChange={(
                val
              ) =>
                setFormData(
                  {
                    ...formData,
                    role:
                      val,
                  }
                )
              }
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="admin">
                  Admin
                </SelectItem>

                <SelectItem value="user">
                  User
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ACCESS */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Access
            </label>

            <Select
              value={
                formData.access
              }
              onValueChange={(
                val
              ) =>
                setFormData(
                  {
                    ...formData,
                    access:
                      val,
                  }
                )
              }
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select Access" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="active">
                  Active
                </SelectItem>

                <SelectItem value="inactive">
                  Inactive
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* BUTTONS */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={
                onClose
              }
            >
              Cancel
            </Button>

            <Button
              onClick={() =>
                updateMutation.mutate(
                  formData
                )
              }
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
        </CardContent>
      </Card>
    </div>
  );
}