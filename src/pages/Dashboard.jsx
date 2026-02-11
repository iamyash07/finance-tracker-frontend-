import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { expenseAPI } from "../utils/api";
import Loader from "../components/Loader";
import {
  FiTrendingDown,
  FiTrendingUp,
  FiDollarSign,
  FiUsers,
  FiPlus,
  FiArrowRight,
} from "react-icons/fi";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import toast from "react-hot-toast";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const CHART_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6",
];

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await expenseAPI.getDashboard();
      setDashboard(res.data.dashboard);
    } catch (error) {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader text="Loading dashboard..." />;

  const { groups, overall } = dashboard || {};
  const groupsWithExpenses = (groups || []).filter((g) => g.totalExpenses > 0);

  const stats = [
    {
      label: "Total Group Expenses",
      value: `₹${(overall?.totalGroupExpenses || 0).toLocaleString()}`,
      icon: FiTrendingDown,
      bgColor: "bg-red-50 dark:bg-red-900/20",
      iconColor: "text-red-600 dark:text-red-400",
      valueColor: "text-red-600 dark:text-red-400",
    },
    {
      label: "You Paid",
      value: `₹${(overall?.yourTotalPaid || 0).toLocaleString()}`,
      icon: FiDollarSign,
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
      iconColor: "text-amber-600 dark:text-amber-400",
      valueColor: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Net Balance",
      value: `${(overall?.yourNetBalance || 0) >= 0 ? "+" : ""}₹${Math.abs(overall?.yourNetBalance || 0).toLocaleString()}`,
      icon: FiTrendingUp,
      bgColor: (overall?.yourNetBalance || 0) >= 0 ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-red-50 dark:bg-red-900/20",
      iconColor: (overall?.yourNetBalance || 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
      valueColor: (overall?.yourNetBalance || 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
    },
    {
      label: "Groups",
      value: (groups || []).length,
      icon: FiUsers,
      bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      valueColor: "text-indigo-600 dark:text-indigo-400",
    },
  ];

  const doughnutData = {
    labels: groupsWithExpenses.map((g) => g.groupName),
    datasets: [{
      data: groupsWithExpenses.map((g) => g.totalExpenses),
      backgroundColor: CHART_COLORS.slice(0, groupsWithExpenses.length),
      borderColor: "transparent",
      borderWidth: 0,
      hoverOffset: 8,
    }],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "65%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 16, usePointStyle: true, pointStyleWidth: 10,
          color: "#9ca3af",
          font: { size: 12, family: "Inter, sans-serif" },
        },
      },
      tooltip: {
        backgroundColor: "#1e293b",
        titleFont: { size: 13, family: "Inter" },
        bodyFont: { size: 12, family: "Inter" },
        padding: 12, cornerRadius: 12,
        callbacks: {
          label: (ctx) => {
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
            const pct = ((ctx.raw / total) * 100).toFixed(1);
            return ` ₹${ctx.raw.toLocaleString()} (${pct}%)`;
          },
        },
      },
    },
  };

  const barData = {
    labels: groupsWithExpenses.map((g) =>
      g.groupName.length > 12 ? g.groupName.slice(0, 12) + "..." : g.groupName
    ),
    datasets: [
      {
        label: "Total Expenses",
        data: groupsWithExpenses.map((g) => g.totalExpenses),
        backgroundColor: "#c7d2fe",
        borderRadius: 8, borderSkipped: false,
      },
      {
        label: "You Paid",
        data: groupsWithExpenses.map((g) => g.yourPaid),
        backgroundColor: "#6366f1",
        borderRadius: 8, borderSkipped: false,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top", align: "end",
        labels: {
          padding: 16, usePointStyle: true, pointStyleWidth: 10,
          color: "#9ca3af",
          font: { size: 12, family: "Inter" },
        },
      },
      tooltip: {
        backgroundColor: "#1e293b",
        padding: 12, cornerRadius: 12,
        callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ₹${ctx.raw.toLocaleString()}` },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#9ca3af", font: { size: 11, family: "Inter" } },
      },
      y: {
        grid: { color: "#f1f5f9" },
        ticks: {
          color: "#9ca3af",
          font: { size: 11, family: "Inter" },
          callback: (v) => `₹${v.toLocaleString()}`,
        },
      },
    },
  };

  const getStatusBadge = (status) => {
    const badges = {
      settled: <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">✅ All Settled</span>,
      owes: <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">💸 You Owe</span>,
      owed: <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">💰 You're Owed</span>,
    };
    return badges[status] || null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.username} 👋
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-gray-500 dark:text-gray-400">Here's your financial overview</p>
            {getStatusBadge(overall?.status)}
          </div>
        </div>
        <Link to="/groups" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 w-fit">
          <FiPlus className="h-4 w-4" /> New Group
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${stat.valueColor}`}>{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-xl`}>
                  <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      {groupsWithExpenses.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Expenses by Group</h3>
            <div className="h-[300px] flex items-center justify-center">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Contribution</h3>
            <div className="h-[300px]">
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
        </div>
      )}

      {/* Groups */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Groups</h3>
          <Link to="/groups" className="text-indigo-600 dark:text-indigo-400 text-sm font-medium flex items-center gap-1 hover:underline">
            View all <FiArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {groups && groups.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
              <Link key={group.groupId} to={`/groups/${group.groupId}`} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-gray-100 dark:border-gray-600 transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-indigo-400 to-indigo-600 h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-lg">{group.groupName?.charAt(0)?.toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{group.groupName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{group.memberCount} members • {group.currency}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Total: ₹{group.totalExpenses.toLocaleString()}</span>
                  <span className={`font-semibold ${group.yourBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                    {group.yourBalance >= 0 ? "+" : ""}₹{Math.abs(group.yourBalance).toLocaleString()}
                  </span>
                </div>
                <div className="mt-2">
                  {group.status === "settled" && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">✅ Settled</span>}
                  {group.status === "owes" && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">💸 You owe</span>}
                  {group.status === "owed" && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">💰 Owed to you</span>}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-gray-100 dark:bg-gray-700 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiUsers className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No groups yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Create your first group to start tracking</p>
            <Link to="/groups" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-all inline-flex items-center gap-2">
              <FiPlus className="h-4 w-4" /> Create Group
            </Link>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Overall Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Group Expenses</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">₹{(overall?.totalGroupExpenses || 0).toLocaleString()}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Your Total Paid</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">₹{(overall?.yourTotalPaid || 0).toLocaleString()}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Net Balance</p>
            <p className={`text-xl font-bold ${(overall?.yourNetBalance || 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
              {(overall?.yourNetBalance || 0) >= 0 ? "+" : ""}₹{Math.abs(overall?.yourNetBalance || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;