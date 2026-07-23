import React, { useState, useEffect } from 'react';
import { convertedClientService } from '../services/convertedClientService';
import { RevenueStats } from '../types';
import { LoadingSpinner } from '../components/common/SkeletonLoader';
import { useToast } from '../context/ToastContext';
import {
  TrendingUp,
  DollarSign,
  Users,
  CreditCard,
  Building,
  PieChart,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Plus
} from 'lucide-react';
import { Modal } from '../components/common/Modal';

export const AdminRevenuePage: React.FC = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Expense Modals
  const [domainModalOpen, setDomainModalOpen] = useState(false);
  const [domainAmount, setDomainAmount] = useState<number | ''>('');
  const [domainNotes, setDomainNotes] = useState('');

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState<number | ''>('');
  const [expenseType, setExpenseType] = useState('General');
  const [expenseNotes, setExpenseNotes] = useState('');

  const fetchRevenueData = async () => {
    try {
      const res = await convertedClientService.getRevenueStats();
      if (res.success) setStats(res.stats);
    } catch (err: any) {
      toast('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const formatINR = (val: number = 0) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleAddDomainCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainAmount || Number(domainAmount) <= 0) return;
    try {
      const res = await convertedClientService.createDomainCharge(Number(domainAmount), domainNotes);
      if (res.success) {
        toast('Domain Charge Logged', `Recorded Domain Charge of ${formatINR(Number(domainAmount))}`, 'success');
        setDomainModalOpen(false);
        setDomainAmount('');
        setDomainNotes('');
        fetchRevenueData();
      }
    } catch (err: any) {
      toast('Error', err.message, 'error');
    }
  };

  const handleAddOtherExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount || Number(expenseAmount) <= 0) return;
    try {
      const res = await convertedClientService.createOtherExpense(Number(expenseAmount), expenseType, expenseNotes);
      if (res.success) {
        toast('Expense Logged', `Recorded ${expenseType} Expense of ${formatINR(Number(expenseAmount))}`, 'success');
        setExpenseModalOpen(false);
        setExpenseAmount('');
        setExpenseNotes('');
        fetchRevenueData();
      }
    } catch (err: any) {
      toast('Error', err.message, 'error');
    }
  };

  if (loading || !stats) {
    return <LoadingSpinner text="Loading Admin Revenue & Net Profit Dashboard..." />;
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-wider bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30">
            Admin Portal • Executive Revenue Dashboard
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2">
            Revenue & Net Profit Overview
          </h2>
          <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-xl">
            Real-time business financial metrics calculated from received client payments, website costs, domain charges, and expenses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setDomainModalOpen(true)}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-2xl shadow-md transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Domain Charge</span>
          </button>

          <button
            onClick={() => setExpenseModalOpen(true)}
            className="flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-2xl shadow-md transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Expected Amount */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Expected Amount
          </span>
          <span className="text-2xl md:text-3xl font-extrabold font-mono text-slate-900 dark:text-white mt-2 block">
            {formatINR(stats.totalExpectedAmount)}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Sum of total deal values ({stats.totalConvertedClients} clients)
          </span>
        </div>

        {/* Total Received Amount (Gross Revenue) */}
        <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-5 rounded-3xl shadow-sm">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
            Total Received Amount (Gross Revenue)
          </span>
          <span className="text-2xl md:text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-2 block">
            {formatINR(stats.totalReceivedAmount)}
          </span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block font-semibold">
            Actual client cash collected
          </span>
        </div>

        {/* Total Client Pending Amount */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
            Total Client Pending
          </span>
          <span className="text-2xl md:text-3xl font-extrabold font-mono text-amber-600 dark:text-amber-400 mt-2 block">
            {formatINR(stats.totalClientPendingAmount)}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Awaiting client collection
          </span>
        </div>

        {/* Net Profit */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-white to-white dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 border border-emerald-300 dark:border-emerald-800/60 p-5 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Net Profit
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 font-bold flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl md:text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-2 block">
            {formatINR(stats.netProfit)}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Received minus all website, domain & expenses
          </span>
        </div>
      </div>

      {/* Website Operating Expenses Breakdown Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
          <CreditCard className="w-4 h-4 mr-2 text-indigo-500" />
          Website Operating Expenses Breakdown (INR ₹)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <span className="text-indigo-600 dark:text-indigo-400 font-bold text-[11px] block font-sans uppercase tracking-wider">
              Website Development Cost
            </span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block">
              {formatINR(stats.totalWebsiteCost)}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <span className="text-indigo-600 dark:text-indigo-400 font-bold text-[11px] block font-sans uppercase tracking-wider">
              Domain Cost
            </span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block">
              {formatINR(stats.totalDomainCharges)}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <span className="text-indigo-600 dark:text-indigo-400 font-bold text-[11px] block font-sans uppercase tracking-wider">
              Other Expenses
            </span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block">
              {formatINR(stats.totalOtherExpenses)}
            </span>
          </div>
        </div>
      </div>

      {/* Caller Breakdown */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
          <Users className="w-4 h-4 mr-2 text-indigo-500" />
          Caller Performance & Revenue Contribution
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Caller Name</th>
                <th className="py-3 px-4">Converted Clients</th>
                <th className="py-3 px-4">Revenue Brought (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-mono">
              {stats.callerBreakdown && stats.callerBreakdown.length > 0 ? (
                stats.callerBreakdown.map((caller) => (
                  <tr key={caller.callerId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-sans font-bold text-slate-900 dark:text-white">
                      {caller.callerName}
                      <span className="text-[10px] text-slate-400 block font-normal">{caller.callerEmail}</span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                      {caller.convertedCount} Clients
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white">
                      {formatINR(caller.revenueGenerated)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-xs text-slate-400 italic font-sans">
                    No caller breakdown data available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Domain Charge Modal */}
      <Modal
        isOpen={domainModalOpen}
        onClose={() => setDomainModalOpen(false)}
        title="Record Domain Charge (Admin)"
        subtitle="Add domain purchase or renewal charges to subtract from Net Profit"
      >
        <form onSubmit={handleAddDomainCharge} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Domain Amount (INR ₹) *
            </label>
            <input
              type="number"
              min="1"
              value={domainAmount}
              onChange={(e) => setDomainAmount(e.target.value ? Number(e.target.value) : '')}
              required
              placeholder="e.g. 1200"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-extrabold text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Domain Notes / Provider
            </label>
            <input
              type="text"
              value={domainNotes}
              onChange={(e) => setDomainNotes(e.target.value)}
              placeholder="e.g. Godaddy domain renewal for client.com"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setDomainModalOpen(false)}
              className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold px-4 py-2 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!domainAmount}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md"
            >
              Save Domain Charge
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Other Expense Modal */}
      <Modal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        title="Record Operating Expense (Admin)"
        subtitle="Add general business expense to subtract from Net Profit"
      >
        <form onSubmit={handleAddOtherExpense} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Expense Amount (INR ₹) *
            </label>
            <input
              type="number"
              min="1"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value ? Number(e.target.value) : '')}
              required
              placeholder="e.g. 3000"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-extrabold text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Expense Type
            </label>
            <input
              type="text"
              value={expenseType}
              onChange={(e) => setExpenseType(e.target.value)}
              placeholder="e.g. Hosting, Software, Marketing..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Expense Notes
            </label>
            <input
              type="text"
              value={expenseNotes}
              onChange={(e) => setExpenseNotes(e.target.value)}
              placeholder="Expense details..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setExpenseModalOpen(false)}
              className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold px-4 py-2 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!expenseAmount}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md"
            >
              Save Expense
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
