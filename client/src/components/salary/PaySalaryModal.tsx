import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, FileText, CreditCard } from 'lucide-react';
import { User, SalaryConfiguration } from '../../types';
import { salaryPaymentService } from '../../services/salaryPaymentService';
import { useToast } from '../../context/ToastContext';

interface PaySalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  caller: User | null;
  config: SalaryConfiguration | null;
  onSuccess: () => void;
}

export const PaySalaryModal: React.FC<PaySalaryModalProps> = ({
  isOpen,
  onClose,
  caller,
  config,
  onSuccess
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [salaryPaid, setSalaryPaid] = useState<number>(0);
  const [bonusPaid, setBonusPaid] = useState<number>(0);
  const [deduction, setDeduction] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer');
  const [notes, setNotes] = useState<string>('');
  
  // Format current date as YYYY-MM-DD
  const getTodayDateStr = () => {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  };
  const [paidAt, setPaidAt] = useState<string>(getTodayDateStr());

  // Current month string formatted as "YYYY-MM"
  const getCurrentMonthStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };
  const currentMonth = getCurrentMonthStr();

  // Reset form when modal opens or caller changes
  useEffect(() => {
    if (isOpen) {
      setSalaryPaid(0);
      setBonusPaid(0);
      setDeduction(0);
      setPaymentMethod('Bank Transfer');
      setNotes('');
      setPaidAt(getTodayDateStr());
    }
  }, [isOpen, caller]);

  if (!isOpen || !caller) return null;

  const monthlySalary = config ? config.monthlySalary : 0;
  const netPaid = salaryPaid + bonusPaid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (salaryPaid < 0 || bonusPaid < 0 || deduction < 0) {
      toast('Validation Error', 'Values cannot be negative', 'error');
      return;
    }

    if (salaryPaid === 0 && bonusPaid === 0 && deduction === 0) {
      toast('Validation Error', 'Please enter at least one payment or deduction amount', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await salaryPaymentService.recordPayment({
        callerId: caller.id || caller._id || '',
        month: currentMonth,
        salaryPaid,
        bonusPaid,
        deduction,
        paymentMethod,
        notes,
        paidAt
      });

      if (res.success) {
        toast('Success', res.message, 'success');
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      toast('Payment Error', err.response?.data?.message || 'Failed to record payment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 animate-scaleIn">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 p-6 text-white flex justify-between items-center">
          <div className="flex items-center space-x-2.5">
            <div className="bg-indigo-500/20 p-2 rounded-xl border border-indigo-400/20">
              <DollarSign className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Record Salary Payout</h3>
              <p className="text-[10px] text-indigo-200/80 mt-0.5 font-medium">Record payroll payments, bonuses, or deductions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Read Only Details Grid */}
          <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div>
              <span className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Caller Name</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 block truncate">{caller.name}</span>
            </div>
            <div>
              <span className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Current Month</span>
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-1 block">
                {new Date().toLocaleDateString('default', { month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div>
              <span className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Monthly Salary</span>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                {formatINR(monthlySalary)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Salary Paying Now */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Salary Paying Now (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                <input
                  type="number"
                  min="0"
                  value={salaryPaid || ''}
                  onChange={(e) => setSalaryPaid(Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Bonus Paying Now */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Bonus Paying Now (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                <input
                  type="number"
                  min="0"
                  value={bonusPaid || ''}
                  onChange={(e) => setBonusPaid(Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Deduction */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider">
                Deduction (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-455 font-bold text-xs">₹</span>
                <input
                  type="number"
                  min="0"
                  value={deduction || ''}
                  onChange={(e) => setDeduction(Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-rose-50/50 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-900/60 rounded-xl pl-8 pr-3.5 py-2.5 text-xs font-bold text-rose-700 dark:text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Payment Date */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Payment Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                <input
                  type="date"
                  required
                  value={paidAt}
                  onChange={(e) => setPaidAt(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Payment Method */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Payment Method
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Payment Notes */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Payment Notes / Remarks
              </label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-3.5 text-slate-400 w-3.5 h-3.5" />
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record transaction ID or reference details..."
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Net payout preview */}
          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-150 dark:border-indigo-900/60 p-4 rounded-2xl flex justify-between items-center">
            <div>
              <span className="text-[10px] font-extrabold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">Net Amount Received By Caller</span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Salary Paying + Bonus Paying</p>
            </div>
            <span className="text-xl font-extrabold font-mono text-indigo-650 dark:text-indigo-300">
              {formatINR(netPaid)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold py-2.5 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-2/3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center"
            >
              {loading ? 'Recording Payment...' : 'Save Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
