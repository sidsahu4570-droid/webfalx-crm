import React, { useState, useEffect } from 'react';
import { appRevenueService, OverallRevenueStats } from '../services/appRevenueService';
import { LoadingSpinner } from '../components/common/SkeletonLoader';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import {
  TrendingUp,
  Building,
  Smartphone,
  PieChart,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export const OverallRevenuePage: React.FC = () => {
  const { toast } = useToast();
  const { socket } = useSocket();
  const [stats, setStats] = useState<OverallRevenueStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverallStats = async () => {
    try {
      const res = await appRevenueService.getOverallRevenueStats();
      if (res.success) setStats(res.stats);
    } catch (err: any) {
      toast('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverallStats();
  }, []);

  // Real-Time Socket Listener for Live Overall Financial Updates
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchOverallStats();

    socket.on('revenue_updated', handleUpdate);
    socket.on('client_created', handleUpdate);
    socket.on('client_updated', handleUpdate);
    socket.on('payment_added', handleUpdate);

    return () => {
      socket.off('revenue_updated', handleUpdate);
      socket.off('client_created', handleUpdate);
      socket.off('client_updated', handleUpdate);
      socket.off('payment_added', handleUpdate);
    };
  }, [socket]);

  const formatINR = (val: number = 0) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading || !stats) {
    return <LoadingSpinner text="Calculating Combined Overall Business Financial Performance..." />;
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-wider bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30">
            Executive Financial Dashboard • Combined Business Metrics
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2 flex items-center">
            <TrendingUp className="w-7 h-7 mr-2 text-emerald-400" />
            Overall Business Revenue & Net Profit
          </h2>
          <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-xl">
            Automated live aggregation combining Website Revenue and App Revenue into one unified business performance dashboard.
          </p>
        </div>
      </div>

      {/* Main KPI Combined Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Combined Revenue */}
        <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800 p-6 rounded-3xl shadow-sm space-y-2">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
            Combined Gross Revenue
          </span>
          <span className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 block">
            {formatINR(stats.combinedRevenue)}
          </span>
          <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800/60 flex justify-between text-xs font-mono text-slate-600 dark:text-slate-300">
            <span>Website: <strong>{formatINR(stats.websiteRevenue)}</strong></span>
            <span>App: <strong>{formatINR(stats.appRevenue)}</strong></span>
          </div>
        </div>

        {/* Total Combined Expenses */}
        <div className="bg-rose-50/70 dark:bg-rose-950/20 border border-rose-300 dark:border-rose-800 p-6 rounded-3xl shadow-sm space-y-2">
          <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
            Combined Operating Expenses
          </span>
          <span className="text-3xl font-extrabold font-mono text-rose-600 dark:text-rose-400 block">
            {formatINR(stats.combinedExpenses)}
          </span>
          <div className="pt-2 border-t border-rose-200 dark:border-rose-800/60 flex justify-between text-xs font-mono text-slate-600 dark:text-slate-300">
            <span>Website: <strong>{formatINR(stats.websiteExpenses)}</strong></span>
            <span>App: <strong>{formatINR(stats.appExpenses)}</strong></span>
          </div>
        </div>

        {/* Employee Salary Expenses */}
        <div className="bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-300 dark:border-indigo-800 p-6 rounded-3xl shadow-sm space-y-2">
          <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">
            Employee Salary Expenses
          </span>
          <span className="text-3xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400 block">
            {formatINR(stats.totalEmployeeCost)}
          </span>
          <div className="pt-2 border-t border-indigo-200 dark:border-indigo-800/60 flex justify-between text-xs font-mono text-slate-600 dark:text-slate-300">
            <span>Salary Paid: <strong>{formatINR(stats.totalSalaryPaid)}</strong></span>
            <span>Bonus Paid: <strong>{formatINR(stats.totalBonusPaid)}</strong></span>
          </div>
        </div>

        {/* Total Overall Net Profit */}
        <div className="bg-gradient-to-br from-indigo-500/10 via-white to-white dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900 border border-indigo-300 dark:border-indigo-800/60 p-6 rounded-3xl shadow-sm space-y-2">
          <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">
            Overall Net Profit
          </span>
          <span className="text-3xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400 block">
            {formatINR(stats.overallProfit)}
          </span>
          <div className="pt-2 border-t border-indigo-200 dark:border-indigo-800/60 flex justify-between text-xs font-mono text-slate-600 dark:text-slate-300 animate-pulse">
            <span>Gross Profit: <strong>{formatINR(stats.websiteProfit + stats.appProfit)}</strong></span>
            <span>Employee Cost: <strong>-{formatINR(stats.totalEmployeeCost)}</strong></span>
          </div>
        </div>
      </div>

      {/* Comparison Analytics Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
          <PieChart className="w-4 h-4 mr-2 text-indigo-500" />
          Revenue, Expenses & Profit Comparison (Website vs App)
        </h3>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.comparisons}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis dataKey="category" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip formatter={(value: any) => formatINR(Number(value))} />
              <Legend />
              <Bar dataKey="Website" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              <Bar dataKey="App" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Combined" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
