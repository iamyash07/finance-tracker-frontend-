import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import {
  FiUser,
  FiMail,
  FiCamera,
  FiSave,
  FiCalendar,
  FiCopy,
  FiCheck,
} from "react-icons/fi";
import toast from "react-hot-toast";

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [username, setUsername] = useState(user?.username || "");
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(user?.avatar || "");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      setAvatar(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleCopyId = () => {
    const userId = user?.id || user?._id;
    navigator.clipboard.writeText(userId);
    setCopied(true);
    toast.success("User ID copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Username is required");
      return;
    }
    setSaving(true);
    try {
      let res;
      if (avatar) {
        const formData = new FormData();
        formData.append("username", username.trim());
        formData.append("avatar", avatar);
        res = await api.patch("/users/me", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await api.patch("/users/me", { username: username.trim() });
      }
      updateUser(res.data.user);
      toast.success("Profile updated! ✨");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Profile
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage your account settings
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              {preview ? (
                <img
                  src={preview}
                  alt="Avatar"
                  className="h-28 w-28 rounded-full object-cover ring-4 ring-indigo-100 dark:ring-indigo-900"
                />
              ) : (
                <div className="h-28 w-28 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center ring-4 ring-indigo-100 dark:ring-indigo-900">
                  <FiUser className="h-12 w-12 text-white" />
                </div>
              )}
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <FiCamera className="h-6 w-6 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Click avatar to change photo
            </p>
          </div>
        </div>

        {/* User Info */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 space-y-5">
          {/* User ID */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Your User ID
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-mono truncate">
                {user?.id || user?._id}
              </div>
              <button
                type="button"
                onClick={handleCopyId}
                className={`p-3 rounded-xl border transition-all flex items-center gap-2 text-sm font-medium ${
                  copied
                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400"
                    : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                }`}
              >
                {copied ? (
                  <>
                    <FiCheck className="h-4 w-4" />
                    <span className="hidden sm:inline">Copied!</span>
                  </>
                ) : (
                  <>
                    <FiCopy className="h-4 w-4" />
                    <span className="hidden sm:inline">Copy</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
              Share this ID with friends so they can add you to groups
            </p>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Username
            </label>
            <div className="relative">
              <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="Your username"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Email
            </label>
            <div className="relative">
              <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="email"
                value={user?.email || ""}
                className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                disabled
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Email cannot be changed
            </p>
          </div>

          {/* Joined Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Member Since
            </label>
            <div className="relative">
              <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={formatDate(user?.createdAt)}
                className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                disabled
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-5 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <FiSave className="h-5 w-5" />
              Save Changes
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default Profile;