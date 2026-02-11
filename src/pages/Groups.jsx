import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { groupAPI } from "../utils/api";
import Loader from "../components/Loader";
import {
  FiPlus,
  FiUsers,
  FiSearch,
  FiX,
  FiCalendar,
} from "react-icons/fi";
import toast from "react-hot-toast";

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [creating, setCreating] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    currency: "INR",
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await groupAPI.getMyGroups();
      setGroups(res.data.groups || []);
    } catch (error) {
      toast.error("Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Group name is required");
      return;
    }
    setCreating(true);
    try {
      await groupAPI.create(formData);
      toast.success("Group created! 🎉");
      setShowCreateModal(false);
      setFormData({ name: "", description: "", currency: "INR" });
      fetchGroups();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create group");
    } finally {
      setCreating(false);
    }
  };

  const filteredGroups = groups.filter((g) =>
    g.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) return <Loader text="Loading groups..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Groups
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your expense groups ({groups.length})
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 w-fit"
        >
          <FiPlus className="h-4 w-4" />
          Create Group
        </button>
      </div>

      {/* Search */}
      {groups.length > 0 && (
        <div className="relative max-w-md">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search groups..."
            className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>
      )}

      {/* Groups Grid */}
      {filteredGroups.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <Link
              key={group._id}
              to={`/groups/${group._id}`}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition-all group cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="bg-gradient-to-br from-indigo-400 to-indigo-600 h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all">
                  <span className="text-white font-bold text-xl">
                    {group.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg truncate">
                    {group.name}
                  </h3>
                  {group.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {group.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                    <FiUsers className="h-4 w-4" />
                    {group.members?.length || 0} members
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500">
                    <FiCalendar className="h-3.5 w-3.5" />
                    {formatDate(group.createdAt)}
                  </div>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                  {group.currency || "INR"}
                </span>
              </div>

              {group.members && group.members.length > 0 && (
                <div className="flex items-center mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex -space-x-2">
                    {group.members.slice(0, 5).map((member, i) => {
                      const m = member.user || member;
                      return (
                        <div
                          key={m._id || i}
                          className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-500 dark:to-gray-600 flex items-center justify-center ring-2 ring-white dark:ring-gray-800 text-xs font-bold text-white"
                          title={m.username}
                        >
                          {m.username?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                      );
                    })}
                    {group.members.length > 5 && (
                      <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center ring-2 ring-white dark:ring-gray-800 text-xs font-medium text-gray-600 dark:text-gray-300">
                        +{group.members.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm text-center py-16">
          <div className="bg-gray-100 dark:bg-gray-700 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiUsers className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {searchTerm ? "No groups found" : "No groups yet"}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
            {searchTerm
              ? "Try a different search term"
              : "Create your first group to start splitting expenses"}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-all inline-flex items-center gap-2 shadow-lg shadow-indigo-500/25"
            >
              <FiPlus className="h-4 w-4" /> Create Group
            </button>
          )}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md animate-scaleIn">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Create Group
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ name: "", description: "", currency: "INR" });
                }}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <FiX className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="e.g., Trip to Goa"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                  rows={3}
                  placeholder="What's this group for?"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData({ ...formData, currency: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="INR">🇮🇳 INR - Indian Rupee</option>
                  <option value="USD">🇺🇸 USD - US Dollar</option>
                  <option value="EUR">🇪🇺 EUR - Euro</option>
                  <option value="GBP">🇬🇧 GBP - British Pound</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ name: "", description: "", currency: "INR" });
                  }}
                  className="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-2.5 px-5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Group"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;