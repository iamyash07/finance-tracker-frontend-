import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { groupAPI, expenseAPI, settlementAPI } from "../utils/api";
import Loader from "../components/Loader";
import {
  FiArrowLeft,
  FiPlus,
  FiDollarSign,
  FiTrash2,
  FiSearch,
  FiUserPlus,
  FiUserMinus,
  FiLogOut,
  FiCheckCircle,
  FiX,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import toast from "react-hot-toast";

const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("expenses");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const [showAddMember, setShowAddMember] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [memberUserId, setMemberUserId] = useState("");
  const [settleData, setSettleData] = useState({
    toUserId: "",
    amount: "",
    description: "",
  });
  const [actionLoading, setActionLoading] = useState(false);

  const isCreator =
    group?.creator?._id === user?._id ||
    group?.creator?._id === user?.id ||
    group?.creator === user?._id ||
    group?.creator === user?.id;

  // ==================== FETCH FUNCTIONS ====================

  const fetchGroup = useCallback(async () => {
    try {
      const res = await groupAPI.getById(id);
      setGroup(res.data.group);
    } catch (error) {
      toast.error("Failed to load group");
      navigate("/groups");
    }
  }, [id, navigate]);

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await expenseAPI.getByGroup(id, {
        page,
        limit: 10,
        search,
      });
      setExpenses(res.data.expenses || []);
      setPagination(res.data.pagination || {});
    } catch (error) {
      console.error("Fetch expenses error:", error);
    }
  }, [id, page, search]);

  const fetchBalances = useCallback(async () => {
    try {
      const res = await expenseAPI.getBalances(id);
      setBalances(res.data.balances || []);
    } catch (error) {
      console.error("Fetch balances error:", error);
    }
  }, [id]);

  const fetchSettlements = useCallback(async () => {
    try {
      const res = await settlementAPI.getByGroup(id);
      setSettlements(res.data.settlements || []);
    } catch (error) {
      console.error("Fetch settlements error:", error);
    }
  }, [id]);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([
        fetchGroup(),
        fetchExpenses(),
        fetchBalances(),
        fetchSettlements(),
      ]);
      setLoading(false);
    };
    loadAll();
  }, [fetchGroup, fetchExpenses, fetchBalances, fetchSettlements]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Refetch expenses when page or search changes
  useEffect(() => {
    if (!loading) {
      fetchExpenses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  // ==================== ACTION HANDLERS ====================

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberUserId.trim()) {
      toast.error("Please enter a user ID");
      return;
    }
    setActionLoading(true);
    try {
      await groupAPI.addMember(id, memberUserId.trim());
      toast.success("Member added! 🎉");
      setShowAddMember(false);
      setMemberUserId("");
      fetchGroup();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add member");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (userId, username) => {
    if (!window.confirm(`Remove ${username} from this group?`)) return;
    try {
      await groupAPI.removeMember(id, userId);
      toast.success(`${username} removed`);
      fetchGroup();
      fetchBalances();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove member");
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm("Are you sure you want to leave this group?")) return;
    try {
      await groupAPI.leave(id);
      toast.success("You left the group");
      navigate("/groups");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to leave group");
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm("Delete this group permanently? This cannot be undone."))
      return;
    try {
      await groupAPI.delete(id);
      toast.success("Group deleted");
      navigate("/groups");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete group");
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm("Delete this expense?")) return;
    try {
      await expenseAPI.delete(expenseId);
      toast.success("Expense deleted");
      fetchExpenses();
      fetchBalances();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete expense");
    }
  };

  const handleSettle = async (e) => {
    e.preventDefault();
    if (!settleData.toUserId || !settleData.amount) {
      toast.error("Please fill in required fields");
      return;
    }
    setActionLoading(true);
    try {
      await settlementAPI.create({
        groupId: id,
        toUserId: settleData.toUserId,
        amount: Number(settleData.amount),
        description: settleData.description || undefined,
      });
      toast.success("Settlement recorded! ✅");
      setShowSettleModal(false);
      setSettleData({ toUserId: "", amount: "", description: "" });
      fetchBalances();
      fetchSettlements();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to settle");
    } finally {
      setActionLoading(false);
    }
  };

  // ==================== HELPERS ====================

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getUserName = (userId) => {
    const member = group?.members?.find(
      (m) => (m.user?._id || m._id) === userId
    );
    return member?.user?.username || "Unknown";
  };

  const otherMembers =
    group?.members?.filter(
      (m) =>
        (m.user?._id || m._id) !== user?._id &&
        (m.user?._id || m._id) !== user?.id
    ) || [];

  // ==================== RENDER ====================

  if (loading) return <Loader text="Loading group..." />;
  if (!group) return null;

  const tabs = [
    { key: "expenses", label: "Expenses", count: pagination.total || 0 },
    { key: "balances", label: "Balances", count: balances.length },
    { key: "settlements", label: "Settlements", count: settlements.length },
    { key: "members", label: "Members", count: group.members?.length || 0 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* ==================== HEADER ==================== */}
      <div className="flex items-start gap-4">
        <Link
          to="/groups"
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors mt-1"
        >
          <FiArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {group.name}
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
              {group.currency || "INR"}
            </span>
          </div>
          {group.description && (
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {group.description}
            </p>
          )}
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            Created by {group.creator?.username} • {formatDate(group.createdAt)}
          </p>
        </div>
      </div>

      {/* ==================== ACTION BUTTONS ==================== */}
      <div className="flex flex-wrap gap-2">
        <Link
          to={`/groups/${id}/add-expense`}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 text-sm"
        >
          <FiPlus className="h-4 w-4" /> Add Expense
        </Link>

        <button
          onClick={() => setShowAddMember(true)}
          className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-2 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2 text-sm"
        >
          <FiUserPlus className="h-4 w-4" /> Add Member
        </button>

        <button
          onClick={() => setShowSettleModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-xl transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2 text-sm"
        >
          <FiCheckCircle className="h-4 w-4" /> Settle Up
        </button>

        {!isCreator && (
          <button
            onClick={handleLeaveGroup}
            className="bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-400 font-semibold py-2 px-4 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all flex items-center gap-2 text-sm"
          >
            <FiLogOut className="h-4 w-4" /> Leave
          </button>
        )}

        {isCreator && (
          <button
            onClick={handleDeleteGroup}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-xl transition-all shadow-lg shadow-red-500/25 flex items-center gap-2 text-sm"
          >
            <FiTrash2 className="h-4 w-4" /> Delete Group
          </button>
        )}
      </div>

      {/* ==================== TABS ==================== */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-white dark:bg-gray-700 text-indigo-700 dark:text-indigo-300 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {tab.label}
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === tab.key
                  ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                  : "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ==================== TAB CONTENT ==================== */}

      {/* EXPENSES TAB */}
      {activeTab === "expenses" && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search expenses..."
              className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {expenses.length > 0 ? (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div
                  key={expense._id}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 flex items-center justify-between hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-xl">
                      <FiDollarSign className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {expense.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Paid by{" "}
                          <span className="font-medium">
                            {expense.paidBy?.username || "Unknown"}
                          </span>
                        </p>
                        {expense.category && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                            {expense.category}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {formatDate(expense.createdAt)} •{" "}
                        {formatTime(expense.createdAt)} • {expense.splitType}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-lg text-gray-900 dark:text-white">
                      ₹{expense.amount?.toLocaleString()}
                    </p>
                    <button
                      onClick={() => handleDeleteExpense(expense._id)}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <FiTrash2 className="h-4 w-4 text-red-400 hover:text-red-600" />
                    </button>
                  </div>
                </div>
              ))}

              {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-all"
                  >
                    <FiChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400 px-4">
                    Page {page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                    disabled={page === pagination.pages}
                    className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-all"
                  >
                    <FiChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm text-center py-12">
              <div className="bg-gray-100 dark:bg-gray-700 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiDollarSign className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                No expenses yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Add your first expense to start tracking
              </p>
              <Link
                to={`/groups/${id}/add-expense`}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-5 rounded-xl transition-all inline-flex items-center gap-2 shadow-lg shadow-indigo-500/25"
              >
                <FiPlus className="h-4 w-4" /> Add Expense
              </Link>
            </div>
          )}
        </div>
      )}

      {/* BALANCES TAB */}
      {activeTab === "balances" && (
        <div className="space-y-3">
          {balances.length > 0 ? (
            balances.map((balance, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-xl ${
                      balance.balance >= 0
                        ? "bg-emerald-50 dark:bg-emerald-900/20"
                        : "bg-red-50 dark:bg-red-900/20"
                    }`}
                  >
                    <FiDollarSign
                      className={`h-5 w-5 ${
                        balance.balance >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {getUserName(balance.userId)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {balance.status === "settled"
                        ? "All settled up ✅"
                        : balance.balance > 0
                        ? "Gets back money"
                        : "Owes money"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xl font-bold ${
                      balance.balance >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {balance.balance >= 0 ? "+" : ""}₹
                    {Math.abs(balance.balance).toLocaleString()}
                  </span>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {balance.status}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm text-center py-12">
              <FiCheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                All settled up! 🎉
              </p>
            </div>
          )}
        </div>
      )}

      {/* SETTLEMENTS TAB */}
      {activeTab === "settlements" && (
        <div className="space-y-3">
          {settlements.length > 0 ? (
            settlements.map((s) => (
              <div
                key={s._id}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl">
                    <FiCheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {s.paidBy?.username || "Someone"} paid{" "}
                      {s.paidTo?.username || "Someone"}
                    </p>
                    {s.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {s.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {formatDate(s.createdAt)} • {formatTime(s.createdAt)}
                    </p>
                  </div>
                </div>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{s.amount?.toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm text-center py-12">
              <div className="bg-gray-100 dark:bg-gray-700 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheckCircle className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                No settlements yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Settle up when someone owes money
              </p>
            </div>
          )}
        </div>
      )}

      {/* MEMBERS TAB */}
      {activeTab === "members" && (
        <div className="space-y-3">
          {group.members?.map((member) => {
            const m = member.user || member;
            const memberId = m._id;
            const isCurrentUser =
              memberId === user?._id || memberId === user?.id;
            const isMemberCreator = memberId === group.creator?._id;

            return (
              <div
                key={memberId}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {m.username?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {m.username}
                      </p>
                      {isCurrentUser && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                          You
                        </span>
                      )}
                      {isMemberCreator && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                          Creator
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {m.email}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Joined {formatDate(member.joinedAt)}
                    </p>
                  </div>
                </div>

                {isCreator && !isCurrentUser && (
                  <button
                    onClick={() => handleRemoveMember(memberId, m.username)}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Remove member"
                  >
                    <FiUserMinus className="h-5 w-5 text-red-400 hover:text-red-600" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ==================== ADD MEMBER MODAL ==================== */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md animate-scaleIn">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Add Member
              </h2>
              <button
                onClick={() => {
                  setShowAddMember(false);
                  setMemberUserId("");
                }}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <FiX className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleAddMember} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  User ID *
                </label>
                <input
                  type="text"
                  value={memberUserId}
                  onChange={(e) => setMemberUserId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Enter user ID to add"
                  required
                  autoFocus
                />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                  Ask your friend for their user ID from their Profile page
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMember(false);
                    setMemberUserId("");
                  }}
                  className="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-2.5 px-5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <FiUserPlus className="h-4 w-4" /> Add
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== SETTLE UP MODAL ==================== */}
      {showSettleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md animate-scaleIn">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Settle Up
              </h2>
              <button
                onClick={() => {
                  setShowSettleModal(false);
                  setSettleData({ toUserId: "", amount: "", description: "" });
                }}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <FiX className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSettle} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Pay To *
                </label>
                <select
                  value={settleData.toUserId}
                  onChange={(e) =>
                    setSettleData({ ...settleData, toUserId: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="">Select member</option>
                  {otherMembers.map((m) => {
                    const member = m.user || m;
                    return (
                      <option key={member._id} value={member._id}>
                        {member.username}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={settleData.amount}
                    onChange={(e) =>
                      setSettleData({ ...settleData, amount: e.target.value })
                    }
                    className="w-full px-4 py-3 pl-8 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  value={settleData.description}
                  onChange={(e) =>
                    setSettleData({
                      ...settleData,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="e.g., UPI payment, Cash"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowSettleModal(false);
                    setSettleData({ toUserId: "", amount: "", description: "" });
                  }}
                  className="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-2.5 px-5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-5 rounded-xl transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <FiCheckCircle className="h-4 w-4" /> Settle
                    </>
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

export default GroupDetail;