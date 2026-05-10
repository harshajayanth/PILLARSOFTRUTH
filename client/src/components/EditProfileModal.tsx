import { useState } from "react";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  member: any;
  onClose: () => void;
  onUpdated: () => void;
}

export default function EditProfileModal({
  member,
  onClose,
  onUpdated,
}: Props) {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    username: member.username || "",
    phone: member.phone || "",
    age: member.age || "",
    position: member.position || "",
    location: member.location || "",
    bio: member.bio || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/users?id=${member.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      onUpdated();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Edit Profile
          </h2>

          <p className="text-gray-500 mt-2">
            Update your community profile information
          </p>

          <div className="mt-8 space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Username
              </label>

              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                className="mt-2 w-full border rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                placeholder="Enter username"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Email
              </label>

              <input
                type="text"
                value={member.email}
                disabled
                className="mt-2 w-full border rounded-2xl px-4 py-3 bg-gray-100 text-gray-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Phone
              </label>

              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="mt-2 w-full border rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Age
              </label>

              <input
                type="number"
                name="age"
                value={form.age}
                onChange={handleChange}
                className="mt-2 w-full border rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                placeholder="Enter age"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Position
              </label>

              <input
                type="text"
                name="position"
                value={form.position}
                onChange={handleChange}
                className="mt-2 w-full border rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                placeholder="Enter position"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Location
              </label>

              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                className="mt-2 w-full border rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                placeholder="Enter location"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Bio
              </label>

              <textarea
                rows={4}
                name="bio"
                value={form.bio}
                onChange={handleChange}
                className="mt-2 w-full border rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-black resize-none"
                placeholder="Tell something about yourself"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-2xl font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Profile"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}