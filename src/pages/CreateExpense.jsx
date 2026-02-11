import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { groupAPI, expenseAPI } from "../utils/api";
import Loader from "../components/Loader";
import {
  FiArrowLeft,
  FiDollarSign,
  FiSave,
  FiHome,
  FiShoppingCart,
  FiZap,
  FiCoffee,
  FiTruck,
  FiFilm,
  FiMoreHorizontal,
} from "react-icons/fi";
import toast from "react-hot-toast";

const CATEGORIES = [
  { value: "food", label: "Food", icon: FiCoffee, color: "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400" },
  { value: "groceries", label: "Groceries", icon: FiShoppingCart, color: "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400" },
  { value: "transport", label: "Transport", icon: FiTruck, color: "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" },
  { value: "rent", label: "Rent", icon: FiHome, color: "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400" },
  { value: "utility", label: "Utility", icon: FiZap, color: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400" },
  { value: "entertainment", label: "Entertainment", icon: FiFilm, color: "bg-pink-100 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400" },
  { value: "other", label: "Other", icon: FiMoreHorizontal, color: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400" },
];

const CreateExpense = () => {
  const { id: groupId } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "other",
    splitType: "equal",
  });

  const [splits, setSplits] = useState([]);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const res = await groupAPI.getById(groupId);
        const grp = res.data.group;
        setGroup(grp);
        const memberSplits = grp.members.map((m) => ({
          userId: m.user?._id || m._id,
          username: m.user?.username || m.username,
          amount: "",
          percentage: "",
          included: true,
        }));
        setSplits(memberSplits);
      } catch (error) {
        toast.error("Failed to load group");
        navigate(`/groups/${groupId}`);
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [groupId, navigate]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSplitChange = (index, field, value) => {
    setSplits((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const getEqualSplitAmount = () => {
    if (!formData.amount) return 0;
    const includedCount = splits.filter((s) => s.included).length;
    if (includedCount === 0) return 0;
    return (Number(formData.amount) / includedCount).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      toast.error("Description is required");
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        description: formData.description.trim(),
        amount: Number(formData.amount),
        groupId: groupId,
        category: formData.category,
        splitType: formData.splitType,
      };

      if (formData.splitType === "exact") {
        const exactSplits = splits
          .filter((s) => s.amount && Number(s.amount) > 0)
          .map((s) => ({ user: s.userId, amount: Number(s.amount) }));

        if (exactSplits.length === 0) {
          toast.error("Please enter split amounts");
          setSubmitting(false);
          return;
        }

        const splitTotal = exactSplits.reduce((sum, s) => sum + s.amount, 0);
        if (Math.abs(splitTotal - Number(formData.amount)) > 0.01) {
          toast.error(`Split total (₹${splitTotal}) doesn't match expense amount (₹${formData.amount})`);
          setSubmitting(false);
          return;
        }
        payload.splits = exactSplits;
      }

      if (formData.splitType === "percentage") {
        const percentSplits = splits
          .filter((s) => s.percentage && Number(s.percentage) > 0)
          .map((s) => ({
            user: s.userId,
            amount: (Number(formData.amount) * Number(s.percentage)) / 100,
          }));

        if (percentSplits.length === 0) {
          toast.error("Please enter percentages");
          setSubmitting(false);
          return;
        }

        const totalPercentage = splits.reduce(
          (sum, s) => sum + (Number(s.percentage) || 0), 0
        );
        if (Math.abs(totalPercentage - 100) > 0.01) {
          toast.error(`Percentages must add up to 100% (currently ${totalPercentage}%)`);
          setSubmitting(false);
          return;
        }
        payload.splits = percentSplits;
      }

      await expenseAPI.create(payload);
      toast.success("Expense added! 🎉");
      navigate(`/groups/${groupId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create expense");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader text="Loading..." />;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate(`/groups/${groupId}`)}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <FiArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Add Expense
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {group?.name}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Description & Amount */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Description *
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="e.g., Dinner at restaurant"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Amount ({group?.currency || "INR"}) *
            </label>
            <div className="relative">
              <FiDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
                className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-lg font-semibold"
                placeholder="0.00"
                min="0.01"
                step="0.01"
                required
              />
            </div>
          </div>
        </div>

        {/* Category */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Category
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = formData.category === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => handleChange("category", cat.value)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                      : "border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${cat.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span
                    className={`font-medium ${
                      isSelected
                        ? "text-indigo-700 dark:text-indigo-300"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Split Type */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Split Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {["equal", "exact", "percentage"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleChange("splitType", type)}
                className={`py-3 rounded-xl text-sm font-semibold transition-all capitalize ${
                  formData.splitType === type
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Equal Split Preview */}
          {formData.splitType === "equal" && formData.amount && (
            <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
              <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">
                Each person pays:{" "}
                <span className="font-bold text-lg">₹{getEqualSplitAmount()}</span>
              </p>
              <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-1">
                Split between {splits.filter((s) => s.included).length} members
              </p>
            </div>
          )}

          {/* Exact Split */}
          {formData.splitType === "exact" && (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enter exact amount for each person
              </p>
              {splits.map((split, i) => (
                <div key={split.userId} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">
                      {split.username?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-28 truncate">
                    {split.username}
                  </span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <input
                      type="number"
                      value={split.amount}
                      onChange={(e) => handleSplitChange(i, "amount", e.target.value)}
                      className="w-full px-4 py-2 pl-7 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              ))}
              {formData.amount && (
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Split total:</span>
                    <span
                      className={`font-semibold ${
                        Math.abs(
                          splits.reduce((sum, s) => sum + (Number(s.amount) || 0), 0) -
                            Number(formData.amount)
                        ) < 0.01
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      ₹{splits.reduce((sum, s) => sum + (Number(s.amount) || 0), 0).toFixed(2)} / ₹
                      {Number(formData.amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Percentage Split */}
          {formData.splitType === "percentage" && (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enter percentage for each person
              </p>
              {splits.map((split, i) => (
                <div key={split.userId} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">
                      {split.username?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-28 truncate">
                    {split.username}
                  </span>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      value={split.percentage}
                      onChange={(e) => handleSplitChange(i, "percentage", e.target.value)}
                      className="w-full px-4 py-2 pr-8 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                      placeholder="0"
                      min="0"
                      max="100"
                      step="0.01"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                  </div>
                  {formData.amount && split.percentage && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 w-20 text-right">
                      ₹{((Number(formData.amount) * Number(split.percentage)) / 100).toFixed(2)}
                    </span>
                  )}
                </div>
              ))}
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Total percentage:</span>
                  <span
                    className={`font-semibold ${
                      Math.abs(
                        splits.reduce((sum, s) => sum + (Number(s.percentage) || 0), 0) - 100
                      ) < 0.01
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {splits.reduce((sum, s) => sum + (Number(s.percentage) || 0), 0).toFixed(1)}% / 100%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(`/groups/${groupId}`)}
            className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <FiSave className="h-5 w-5" />
                Add Expense
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateExpense;