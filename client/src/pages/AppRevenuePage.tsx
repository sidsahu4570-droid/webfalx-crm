import React, { useState, useEffect } from 'react';
import { appRevenueService, AppRevenueRecord, AppExpenseRecord, AppRevenueStats } from '../services/appRevenueService';
import { LoadingSpinner } from '../components/common/SkeletonLoader';
import { Modal } from '../components/common/Modal';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/formatters';
import {
  Smartphone,
  Plus,
  CreditCard,
  Building,
  TrendingUp,
  DollarSign,
  PieChart,
  Layers,
  CheckCircle2,
  AlertCircle,
  ShoppingBag
} from 'lucide-react';

export const AppRevenuePage: React.FC = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<AppRevenueStats | null>(null);
  const [revenues, setRevenues] = useState<AppRevenueRecord[]>([]);
  const [expenses, setExpenses] = useState<AppExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [addRevenueOpen, setAddRevenueOpen] = useState(false);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [selectedRevenue, setSelectedRevenue] = useState<AppRevenueRecord | null>(null);

  // Revenue Form State
  const [clientName, setClientName] = useState('');
  const [company, setCompany] = useState('');
  const [totalAmount, setTotalAmount] = useState<number | ''>('');
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [revenueType, setRevenueType] = useState<'Mobile Apps' | 'Web Apps' | 'Maintenance' | 'Subscription Revenue' | 'Other Revenue'>('Mobile Apps');
  const [notes, setNotes] = useState('');

  // Expense Form State
  const [expenseType, setExpenseType] = useState('App Development Cost');
  const [expenseAmount, setExpenseAmount] = useState<number | ''>('');
  const [expenseNotes, setExpenseNotes] = useState('');

  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentMode, setPaymentMode] = useState('UPI');

  const fetchData = async () => {
    try {
      const [statsRes, revRes, expRes] = await Promise.all([
        appRevenueService.getAppRevenueStats(),
        appRevenueService.getAppRevenues(),
        appRevenueService.getAppExpenses()
      ]);
      if (statsRes.success) setStats(statsRes.stats);
      if (revRes.success) setRevenues(revRes.revenues);
      if (expRes.success) setExpenses(expRes.expenses);
    } catch (err: any) {
      toast('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatINR = (val: number = 0) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleCreateRevenue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !totalAmount) return;
    try {
      const res = await appRevenueService.createAppRevenue({
        clientName,
        company,
        totalAmount: Number(totalAmount),
        paidAmount: paidAmount ? Number(paidAmount) : 0,
        revenueType,
        notes
      });
      if (res.success) {
        toast('App Revenue Logged', `Recorded ${revenueType} project for ${clientName}`, 'success');
        setAddRevenueOpen(false);
        setClientName('');
        setCompany('');
        setTotalAmount('');
        setPaidAmount('');
        fetchData();
      }
    } catch (err: any) {
      toast('Error', err.message, 'error');
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount) return;
    try {
      const res = await appRevenueService.createAppExpense({
        expenseType,
        amount: Number(expenseAmount),
        notes: expenseNotes
      });
      if (res.success) {
        toast('App Expense Logged', `Recorded ${expenseType} of ${formatINR(Number(expenseAmount))}`, 'success');
        setAddExpenseOpen(false);
        setExpenseAmount('');
        setExpenseNotes('');
        fetchData();
      }
    } catch (err: any) {
      toast('Error', err.message, 'error');
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRevenue || !paymentAmount) return;
    try {
      const res = await appRevenueService.addAppPayment(selectedRevenue._id, {
        amount: Number(paymentAmount),
        paymentMode
      });
      if (res.success) {
        toast('Payment Received', `Recorded payment of ${formatINR(Number(paymentAmount))}`, 'success');
        setAddPaymentOpen(false);
        setSelectedRevenue(null);
        setPaymentAmount('');
        fetchData();
      }
    } catch (err: any) {
      toast('Error', err.message, 'error');
    }
  };

  if (loading || !stats) {
    return <LoadingSpinner text="Loading App Revenue & Financial Dashboard..." />;
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-wider bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-500/30">
            Admin Portal • App Revenue Management
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2 flex items-center">
            <Smartphone className="w-7 h-7 mr-2 text-purple-400" />
            App Revenue & Expenses
          </h2>
          <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-xl">
            Track App Development Costs, Play Store Costs, received app revenue, and app net profit.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setAddRevenueOpen(true)}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-2xl shadow-md transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add App Client</span>
          </button>

          <button
            onClick={() => setAddExpenseOpen(true)}
            className="flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-2xl shadow-md transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add App Expense</span>
          </button>
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Expected App Revenue
          </span>
          <span className="text-2xl md:text-3xl font-extrabold font-mono text-slate-900 dark:text-white mt-2 block">
            {formatINR(stats.totalExpectedAmount)}
          </span>
        </div>

        <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-5 rounded-3xl shadow-sm">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
            Received App Cash
          </span>
          <span className="text-2xl md:text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-2 block">
            {formatINR(stats.totalReceivedAmount)}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
            Pending App Revenue
          </span>
          <span className="text-2xl md:text-3xl font-extrabold font-mono text-amber-600 dark:text-amber-400 mt-2 block">
            {formatINR(stats.totalPendingAmount)}
          </span>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 via-white to-white dark:from-purple-950/40 dark:via-slate-900 dark:to-slate-900 border border-purple-300 dark:border-purple-800/60 p-5 rounded-3xl shadow-sm">
          <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider block">
            App Net Profit
          </span>
          <span className="text-2xl md:text-3xl font-extrabold font-mono text-purple-600 dark:text-purple-400 mt-2 block">
            {formatINR(stats.netProfit)}
          </span>
        </div>
      </div>

      {/* App Specific Expenses Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 p-6 rounded-3xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-extrabold text-purple-700 dark:text-purple-300 uppercase tracking-wider block">
              App Development Cost
            </span>
            <span className="text-3xl font-extrabold font-mono text-purple-900 dark:text-purple-100 block">
              {formatINR(stats.totalAppDevelopmentCost)}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white font-bold flex items-center justify-center shadow-lg">
            <Smartphone className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 p-6 rounded-3xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-extrabold text-blue-700 dark:text-blue-300 uppercase tracking-wider block">
              Play Store Cost
            </span>
            <span className="text-3xl font-extrabold font-mono text-blue-900 dark:text-blue-100 block">
              {formatINR(stats.totalPlayStoreCost)}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center shadow-lg">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* App Clients Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
          <span className="flex items-center">
            <Smartphone className="w-4 h-4 mr-2 text-purple-500" />
            App Clients Revenue Records ({revenues.length})
          </span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Client Name</th>
                <th className="py-3 px-4">Revenue Type</th>
                <th className="py-3 px-4">Total Deal (₹)</th>
                <th className="py-3 px-4">Received (₹)</th>
                <th className="py-3 px-4">Pending (₹)</th>
                <th className="py-3 px-4">Payment Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-mono">
              {revenues.length > 0 ? (
                revenues.map((rev) => (
                  <tr key={rev._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-sans font-bold text-slate-900 dark:text-white">
                      {rev.clientName}
                      {rev.company && <span className="text-[10px] text-slate-400 block font-normal">{rev.company}</span>}
                    </td>
                    <td className="py-3.5 px-4 font-sans font-semibold text-purple-600 dark:text-purple-400">
                      📱 App Project
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white">
                      {formatINR(rev.totalAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-emerald-600 dark:text-emerald-400 font-bold">
                      {formatINR(rev.paidAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-amber-600 dark:text-amber-400 font-bold">
                      {formatINR(rev.pendingAmount)}
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${rev.paymentStatus === 'Fully Paid' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>
                        {rev.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedRevenue(rev);
                          setAddPaymentOpen(true);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-xl"
                      >
                        + Payment
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-xs text-slate-400 italic font-sans">
                    No app client revenue records logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add App Client Modal */}
      <Modal
        isOpen={addRevenueOpen}
        onClose={() => setAddRevenueOpen(false)}
        title="Add App Client Revenue Project"
        subtitle="Record new mobile app, web app, or maintenance contract revenue"
      >
        <form onSubmit={handleCreateRevenue} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Client Name *
            </label>
            <input
              type="text"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Acme Tech"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Total Deal Amount (₹) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value ? Number(e.target.value) : '')}
                placeholder="e.g. 50000"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-extrabold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Initial Received Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value ? Number(e.target.value) : '')}
                placeholder="e.g. 15000"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-extrabold text-emerald-600"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setAddRevenueOpen(false)}
              className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold px-4 py-2 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl shadow-md"
            >
              Save App Revenue
            </button>
          </div>
        </form>
      </Modal>

      {/* Add App Expense Modal */}
      <Modal
        isOpen={addExpenseOpen}
        onClose={() => setAddExpenseOpen(false)}
        title="Record App Operating Expense"
        subtitle="Add App Development Cost, Play Store Cost, software, server, or API cost"
      >
        <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Expense Category *
            </label>
            <select
              value={expenseType}
              onChange={(e) => setExpenseType(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold"
            >
              <option value="App Development Cost">📱 App Development Cost</option>
              <option value="Play Store Cost">🛒 Play Store Cost</option>
              <option value="Employee Cost">Employee Cost</option>
              <option value="Software Cost">Software Cost</option>
              <option value="Server Cost">Server Cost</option>
              <option value="API Cost">API Cost</option>
              <option value="Other Expenses">Other Expenses</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Expense Amount (₹) *
            </label>
            <input
              type="number"
              min="1"
              required
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value ? Number(e.target.value) : '')}
              placeholder="e.g. 5000"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-extrabold"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setAddExpenseOpen(false)}
              className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold px-4 py-2 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-xl shadow-md"
            >
              Save App Expense
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Payment Modal */}
      {selectedRevenue && (
        <Modal
          isOpen={addPaymentOpen}
          onClose={() => setAddPaymentOpen(false)}
          title={`Add Payment Entry for ${selectedRevenue.clientName}`}
          subtitle={`Current pending amount: ${formatINR(selectedRevenue.pendingAmount)}`}
        >
          <form onSubmit={handleAddPayment} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Amount (₹) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value ? Number(e.target.value) : '')}
                placeholder="Amount received..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-extrabold"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setAddPaymentOpen(false)}
                className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold px-4 py-2 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl shadow-md"
              >
                Save Payment Entry
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
