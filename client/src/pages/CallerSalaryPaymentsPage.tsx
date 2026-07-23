import React, { useState, useEffect } from 'react';
import { salaryPaymentService, SalaryPaymentRecord, SalarySummaryData } from '../services/salaryPaymentService';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import { LoadingSpinner } from '../components/common/SkeletonLoader';
import {
  DollarSign,
  Calendar,
  CreditCard,
  TrendingUp,
  FileText,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  History,
  TrendingDown,
  Percent
} from 'lucide-react';

export const CallerSalaryPaymentsPage: React.FC = () => {
  const { toast } = useToast();
  const { socket } = useSocket();
  const [loading, setLoading] = useState(true);
  
  const [summary, setSummary] = useState<SalarySummaryData | null>(null);
  const [payments, setPayments] = useState<SalaryPaymentRecord[]>([]);

  const fetchSalaryData = async () => {
    try {
      const [summaryRes, paymentsRes] = await Promise.all([
        salaryPaymentService.getCallerSummary(),
        salaryPaymentService.getCallerPayments()
      ]);

      if (summaryRes.success) setSummary(summaryRes.summary);
      if (paymentsRes.success) setPayments(paymentsRes.payments);
    } catch (err: any) {
      toast('Error', err.response?.data?.message || 'Failed to fetch salary details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaryData();
  }, []);

  // Real-time synchronization
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchSalaryData();

    socket.on('salary_payment_added', handleUpdate);
    socket.on('revenue_updated', handleUpdate);

    return () => {
      socket.off('salary_payment_added', handleUpdate);
      socket.off('revenue_updated', handleUpdate);
    };
  }, [socket]);

  const formatINR = (val: number = 0) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading) {
    return <LoadingSpinner text="Retrieving Personal Salary & Payout Records..." />;
  }

  // Calculate overall performance percentages
  const salaryPaidPercent = summary && summary.monthlySalary > 0 
    ? Math.round((summary.salaryPaid / summary.monthlySalary) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-wider bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30">
            Earnings Center • Personal Payroll
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2 flex items-center">
            <DollarSign className="w-7 h-7 mr-1 text-emerald-400" />
            My Salary & Payments
          </h2>
          <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-xl">
            Securely track your monthly configurations, payout summaries, bonuses, deductions, and complete history of received transactions.
          </p>
        </div>
        <button
          onClick={fetchSalaryData}
          className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-xl transition-all self-end md:self-center"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Salary Summary Cards */}
      {summary && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Monthly Salary */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-2 relative overflow-hidden group">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Monthly Salary Plan
              </span>
              <span className="text-2xl font-extrabold font-mono text-slate-800 dark:text-slate-100 block">
                {formatINR(summary.monthlySalary)}
              </span>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-500">
                <span>Current Month Target</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">Active</span>
              </div>
            </div>

            {/* Salary Paid */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-2 relative overflow-hidden group">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Salary Paid
              </span>
              <span className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-450 block">
                {formatINR(summary.salaryPaid)}
              </span>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-500">
                <span>Progress: {salaryPaidPercent}%</span>
                <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${salaryPaidPercent}%` }} />
                </div>
              </div>
            </div>

            {/* Remaining Salary */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-2 relative overflow-hidden group">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Salary Remaining
              </span>
              <span className="text-2xl font-extrabold font-mono text-rose-500 dark:text-rose-400 block">
                {formatINR(summary.salaryRemaining)}
              </span>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-500">
                <span>To be disbursed</span>
                <AlertCircle className={`w-3.5 h-3.5 ${summary.salaryRemaining > 0 ? 'text-rose-500' : 'text-slate-400'}`} />
              </div>
            </div>

            {/* Net Salary Received */}
            <div className="bg-gradient-to-br from-indigo-500/5 to-transparent dark:from-indigo-950/20 dark:to-transparent bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-850 p-5 rounded-3xl shadow-sm space-y-2 relative overflow-hidden group">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                Net Salary Received
              </span>
              <span className="text-2xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400 block">
                {formatINR(summary.netReceived)}
              </span>
              <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/60 flex justify-between items-center text-[10px] text-slate-500">
                <span>(Salary + Bonus)</span>
                <CheckCircle className="w-3.5 h-3.5 text-indigo-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Bonus Paid */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">Bonus Payouts Paid</span>
              <span className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">{formatINR(summary.bonusPaid)}</span>
            </div>

            {/* Deduction */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider block">Deduction process</span>
              <span className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">{formatINR(summary.deduction)}</span>
            </div>

            {/* Status & Last Payment Date */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">Payment Status</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mt-1">
                  {summary.paymentStatus}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">Last Paid Date</span>
                <span className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 block mt-1">
                  {summary.lastPaymentDate 
                    ? new Date(summary.lastPaymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'No payments'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-150 dark:border-slate-800 flex items-center space-x-2">
          <History className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Personal Payment History Ledger</h3>
        </div>

        {payments.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium">No payments received yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3.5">Payment Date</th>
                  <th className="p-3.5">Salary Paid</th>
                  <th className="p-3.5">Bonus Paid</th>
                  <th className="p-3.5">Deduction</th>
                  <th className="p-3.5">Net Received</th>
                  <th className="p-3.5">Payment Method</th>
                  <th className="p-3.5">Remarks / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-55 dark:hover:bg-slate-800/40">
                    <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300">
                      {new Date(p.paidAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="p-3.5 text-emerald-600 dark:text-emerald-450 font-bold">{formatINR(p.salaryPaid)}</td>
                    <td className="p-3.5 text-indigo-650 dark:text-indigo-300 font-bold">{formatINR(p.bonusPaid)}</td>
                    <td className="p-3.5 text-rose-500 dark:text-rose-455 font-bold">{formatINR(p.deduction)}</td>
                    <td className="p-3.5 text-indigo-600 dark:text-indigo-400 font-extrabold">{formatINR(p.netPaid)}</td>
                    <td className="p-3.5">
                      <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900 px-2 py-0.5 rounded-md text-[10px] font-bold">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500 dark:text-slate-400 max-w-xs truncate" title={p.notes}>
                      {p.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
