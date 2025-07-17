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

export default function EditUserModal({
  user,
  onClose,
}: {
  user: any;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState(user);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("PUT", `/api/users?id=${user.id}`, data),
    onSuccess: async() => {
      await queryClient.invalidateQueries({ queryKey: ["users"],exact:false });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <Card className="max-w-md w-full">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-bold mb-4">Edit User</h2>

          {/* ✅ Name (disabled) */}
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input value={formData.username} disabled className="mt-1" />
          </div>

          {/* ✅ Gmail (disabled) */}
          <div>
            <label className="text-sm font-medium">Gmail</label>
            <Input value={formData.email} disabled className="mt-1" />
          </div>

          {/* ✅ Role (editable dropdown with previous value as placeholder) */}
          <div>
            <label className="text-sm font-medium">Role</label>
            <Select
              defaultValue={formData.role} // previous role as default
              onValueChange={(val) => setFormData({ ...formData, role: val })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={formData.role || "Select Role"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ✅ Access (editable dropdown with previous value as placeholder) */}
          <div>
            <label className="text-sm font-medium">Access</label>
            <Select
              defaultValue={formData.access} // previous access as default
              onValueChange={(val) => setFormData({ ...formData, access: val })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={formData.access || "Select Access"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ✅ Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => updateMutation.mutate(formData)}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
