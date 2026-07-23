import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { ConvertedClient, WebsiteUpdate, PaymentHistory, ClientExpenseHistoryRecord } from '../../types';
import { formatDate, formatDateTime, formatTimeAgo } from '../../utils/formatters';
import { convertedClientService } from '../../services/convertedClientService';
import {
  Building,
  Phone,
  Mail,
  Calendar,
  Globe,
  DollarSign,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  PlusCircle,
  History,
  Send,
  CreditCard,
  Receipt,
  FileText,
  Smartphone,
  ShoppingBag
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ConvertedClientDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: ConvertedClient | null;
  websiteUpdates: WebsiteUpdate[];
  paymentHistory: PaymentHistory[];
  onAddWebsiteUpdate: (clientId: string, updateText: string, websiteStatus?: string) => Promise<void>;
  onAddPayment: (clientId: string, data: { paymentType: string; amount: number; paymentMode?: string; note?: string }) => Promise<void>;
  onToggleLock?: (clientId: string, fieldName: string, isLocked: boolean) => Promise<void>;
  onApproveClient?: (clientId: string, status: 'Approved' | 'Rejected') => Promise<void>;
  onRefreshClient?: () => void;
}

export const ConvertedClientDetailModal: React.FC<ConvertedClientDetailModalProps> = ({
  isOpen,
  onClose,
  client,
  websiteUpdates,
  paymentHistory,
  onAddWebsiteUpdate,
  onAddPayment,
  onToggleLock,
  onApproveClient,
  onRefreshClient
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'financials' | 'website' | 'payments' | 'expenses' | 'fieldLocks'>('financials');

  // Website update form state
  const [newUpdateText, setNewUpdateText] = useState('');
  const [updateWebsiteStatus, setUpdateWebsiteStatus] = useState('');
  const [addingUpdate, setAddingUpdate] = useState(false);

  // Payment form state
  const [paymentType, setPaymentType] = useState('client_payment_received');
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [paymentNote, setPaymentNote] = useState('');
  const [addingPayment, setAddingPayment] = useState(false);

  // Expense form state
  const [expenseType, setExpenseType] = useState<any>('Website Cost');
  const [expenseAmount, setExpenseAmount] = useState<number | ''>('');
  const [expenseNotes, setExpenseNotes] = useState('');
  const [expenseHistory, setExpenseHistory] = useState<ClientExpenseHistoryRecord[]>([]);
  const [addingExpense, setAddingExpense] = useState(false);

  const fetchExpenseHistory = async () => {
    if (!client?._id) return;
    try {
      const res = await convertedClientService.getClientExpenseHistory(client._id);
      if (res.success) setExpenseHistory(res.history);
    } catch (e) {}
  };

  useEffect(() => {
    if (client?._id && isOpen) {
      if (client.projectType === 'app') setExpenseType('App Development Cost');
      else setExpenseType('Website Development Cost');
      fetchExpenseHistory();
    }
  }, [client?._id, isOpen, client?.projectType]);

  if (!client) return null;

  const formatINR = (val: number = 0) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleWebsiteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpdateText.trim()) return;
    setAddingUpdate(true);
    try {
      await onAddWebsiteUpdate(client._id, newUpdateText, updateWebsiteStatus || undefined);
      setNewUpdateText('');
      setUpdateWebsiteStatus('');
    } finally {
      setAddingUpdate(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentAmount || Number(paymentAmount) <= 0) return;
    setAddingPayment(true);
    try {
      await onAddPayment(client._id, {
        paymentType,
        amount: Number(paymentAmount),
        paymentMode,
        note: paymentNote
      });
      setPaymentAmount('');
      setPaymentNote('');
    } finally {
      setAddingPayment(false);
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount || Number(expenseAmount) <= 0) return;
    setAddingExpense(true);
    try {
      await convertedClientService.addClientExpense(client._id, {
        expenseType,
        amount: Number(expenseAmount),
        notes: expenseNotes
      });
      setExpenseAmount('');
      setExpenseNotes('');
      fetchExpenseHistory();
      if (onRefreshClient) onRefreshClient();
    } finally {
      setAddingExpense(false);
    }
  };

  const lockableFields = [
    { key: 'totalClientAmount', label: 'Total Client Amount (₹)' },
    { key: 'clientPaidAmount', label: 'Client Paid Amount (₹)' },
    { key: 'websiteMakingCost', label: 'Website Making Cost (₹)' },
    { key: 'domainCharges', label: 'Domain Charges (₹)' },
    { key: 'appDevelopmentCost', label: 'App Development Cost (₹)' },
    { key: 'playStoreCost', label: 'Play Store Cost (₹)' },
    { key: 'websiteDeliveryDate', label: 'Website Delivery Date' },
    { key: 'websiteStatus', label: 'Website Status' },
    { key: 'meetingDate', label: 'Past Meeting Date' },
    { key: 'upcomingMeetingDate', label: 'Upcoming Meeting Date' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={client.clientName}
      subtitle={`Converted Client Financial & Delivery Management • Assigned to ${client.callerName}`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-5">
        {/* Top Header Card & Approval Status */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center text-lg shadow-md">
              {client.clientName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{client.clientName}</h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    client.approvalStatus === 'Approved'
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      : client.approvalStatus === 'Rejected'
                      ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                      : 'bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse'
                  }`}
                >
                  {client.approvalStatus}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-600 border border-purple-200">
                  {client.projectType === 'app' ? '📱 App Project' : '🌐 Website Project'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Company: {client.company || 'N/A'} • Phone: {client.phone || 'N/A'}
              </p>
            </div>
          </div>

          {user?.role === 'admin' && client.approvalStatus === 'Pending Approval' && onApproveClient && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onApproveClient(client._id, 'Approved')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm"
              >
                Approve Client
              </button>
              <button
                onClick={() => onApproveClient(client._id, 'Rejected')}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm"
              >
                Reject
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('financials')}
            className={`pb-2.5 px-3 border-b-2 transition-all ${
              activeTab === 'financials'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            📊 Financial Summary
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-2.5 px-3 border-b-2 transition-all ${
              activeTab === 'payments'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            💳 Client Payments ({paymentHistory.length})
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`pb-2.5 px-3 border-b-2 transition-all ${
              activeTab === 'expenses'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            💸 Expense History ({expenseHistory.length})
          </button>
          <button
            onClick={() => setActiveTab('website')}
            className={`pb-2.5 px-3 border-b-2 transition-all ${
              activeTab === 'website'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            🌐 Project Milestones ({websiteUpdates.length})
          </button>
          {user?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('fieldLocks')}
              className={`pb-2.5 px-3 border-b-2 transition-all ${
                activeTab === 'fieldLocks'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              🔒 Admin Field Locker
            </button>
          )}
        </div>

        {/* Tab 1: Financial Summary */}
        {activeTab === 'financials' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Total Client Deal</span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-white block font-mono">
                  {formatINR(client.totalClientAmount)}
                </span>
                <span className="text-[10px] text-slate-500 font-mono block">
                  Received: <strong className="text-emerald-600">{formatINR(client.clientPaidAmount)}</strong> • Pending: <strong className="text-amber-600">{formatINR(client.clientPendingAmount)}</strong>
                </span>
              </div>

              <div className="bg-gradient-to-br from-indigo-500/10 to-transparent p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800 space-y-1">
                <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase">Project Net Profit</span>
                <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 block font-mono">
                  {formatINR(client.netProfit)}
                </span>
                <span className="text-[10px] text-slate-500 font-mono block">
                  Gross: <strong>{formatINR(client.grossRevenue)}</strong> • Expenses: <strong className="text-rose-600">{formatINR(client.totalExpenses)}</strong>
                </span>
              </div>
            </div>

            {/* Detailed Expense Breakdown */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center justify-between">
                <span>Expenses Breakdown ({client.projectType === 'app' ? 'App Project' : 'Website Project'})</span>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => setActiveTab('expenses')}
                    className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline text-[11px]"
                  >
                    + Add / Manage Expenses
                  </button>
                )}
              </h4>

              {client.projectType === 'app' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-sans block">App Development Cost</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400 mt-0.5 block">{formatINR(client.appDevelopmentCost || 0)}</span>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-sans block">Play Store Cost</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 mt-0.5 block">{formatINR(client.playStoreCost || 0)}</span>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-sans block">Other Expenses</span>
                    <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">{formatINR(client.otherExpenses)}</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-sans block">Website Making Cost</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 block">{formatINR(client.websiteMakingCost)}</span>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-sans block">Domain Charges</span>
                    <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">{formatINR(client.domainCharges)}</span>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-sans block">Other Expenses</span>
                    <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">{formatINR(client.otherExpenses)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Client Payments */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            {user?.role === 'admin' && (
              <form onSubmit={handlePaymentSubmit} className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center">
                  <CreditCard className="w-4 h-4 mr-1.5 text-indigo-500" />
                  Add Client Payment Entry
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Payment Amount (₹) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value ? Number(e.target.value) : '')}
                      placeholder="e.g. 10000"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <option value="UPI">UPI / GPay / PhonePe</option>
                      <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Note / Reference
                    </label>
                    <input
                      type="text"
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                      placeholder="Transaction Ref No..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={addingPayment}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl shadow-md transition-all disabled:opacity-50"
                  >
                    {addingPayment ? 'Logging...' : 'Save Payment Entry'}
                  </button>
                </div>
              </form>
            )}

            {/* Payment History Table */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-400">
                    <th className="p-3">Amount (₹)</th>
                    <th className="p-3">Mode</th>
                    <th className="p-3">Notes</th>
                    <th className="p-3">Logged By</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {paymentHistory.length > 0 ? (
                    paymentHistory.map((p) => (
                      <tr key={p._id}>
                        <td className="p-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                          {formatINR(p.amount)}
                        </td>
                        <td className="p-3 font-sans font-semibold text-slate-800 dark:text-slate-200">
                          {p.paymentMode}
                        </td>
                        <td className="p-3 font-sans text-slate-600 dark:text-slate-300">
                          {p.note || '-'}
                        </td>
                        <td className="p-3 font-sans text-slate-500">{p.createdBy}</td>
                        <td className="p-3 font-sans text-slate-400">{formatDate(p.createdAt)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-400 italic font-sans">
                        No payment entries recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Expense History */}
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            {user?.role === 'admin' && (
              <form onSubmit={handleExpenseSubmit} className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center">
                  <Receipt className="w-4 h-4 mr-1.5 text-purple-500" />
                  Log {client.projectType === 'app' ? 'App Project' : 'Website Project'} Expense Entry
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Expense Category *
                    </label>
                    <select
                      value={expenseType}
                      onChange={(e) => setExpenseType(e.target.value as any)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      {client.projectType === 'app' ? (
                        <>
                          <option value="App Development Cost">📱 App Development Cost</option>
                          <option value="Play Store Cost">🛒 Play Store Cost</option>
                          <option value="Other Expense">💸 Other Expenses</option>
                        </>
                      ) : (
                        <>
                          <option value="Website Development Cost">🌐 Website Development Cost</option>
                          <option value="Domain Cost">🌐 Domain Cost</option>
                          <option value="Other Expense">💸 Other Expenses</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Expense Amount (₹) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value ? Number(e.target.value) : '')}
                      placeholder="e.g. 5000"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-extrabold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Expense Notes / Vendor
                    </label>
                    <input
                      type="text"
                      value={expenseNotes}
                      onChange={(e) => setExpenseNotes(e.target.value)}
                      placeholder="Vendor or developer note..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={addingExpense}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-xl shadow-md transition-all disabled:opacity-50"
                  >
                    {addingExpense ? 'Logging...' : 'Save Expense Entry'}
                  </button>
                </div>
              </form>
            )}

            {/* Expense History Table */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-400">
                    <th className="p-3">Category</th>
                    <th className="p-3">Amount (₹)</th>
                    <th className="p-3">Notes</th>
                    <th className="p-3">Logged By</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {expenseHistory.length > 0 ? (
                    expenseHistory.map((exp) => (
                      <tr key={exp._id}>
                        <td className="p-3 font-sans font-bold text-purple-600 dark:text-purple-400">
                          {exp.expenseType}
                        </td>
                        <td className="p-3 font-extrabold text-rose-600 dark:text-rose-400">
                          {formatINR(exp.amount)}
                        </td>
                        <td className="p-3 font-sans text-slate-600 dark:text-slate-300">
                          {exp.notes || '-'}
                        </td>
                        <td className="p-3 font-sans text-slate-500">{exp.createdBy}</td>
                        <td className="p-3 font-sans text-slate-400">{formatDate(exp.createdAt)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-400 italic font-sans">
                        No expense records logged for this project yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Website Progress Timeline */}
        {activeTab === 'website' && (
          <div className="space-y-4">
            <form onSubmit={handleWebsiteSubmit} className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Add Progress Update / Milestone
              </label>
              <textarea
                value={newUpdateText}
                onChange={(e) => setNewUpdateText(e.target.value)}
                required
                rows={2}
                placeholder="e.g. Completed app build / homepage design..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
              />
              <div className="flex items-center justify-between">
                <select
                  value={updateWebsiteStatus}
                  onChange={(e) => setUpdateWebsiteStatus(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="">Keep current status</option>
                  <option value="Website Had To Make">Project Had To Make</option>
                  <option value="Website In Making">Project In Making</option>
                  <option value="Website Done">Project Done</option>
                  <option value="Delivered">Delivered</option>
                  <option value="On Hold">On Hold</option>
                </select>

                <button
                  type="submit"
                  disabled={addingUpdate}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition-all"
                >
                  Post Progress Update
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {websiteUpdates.map((u) => (
                <div key={u._id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                  <p className="text-slate-800 dark:text-slate-200 font-medium">"{u.updateText}"</p>
                  <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                    <span>By {u.updatedBy}</span>
                    <span>{formatDateTime(u.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Admin Field Locker */}
        {activeTab === 'fieldLocks' && user?.role === 'admin' && onToggleLock && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Field Edit Permissions & Locks
            </h4>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
              {lockableFields.map((field) => {
                const isLocked = !!(client.lockedFields as any)?.[field.key];
                return (
                  <div key={field.key} className="p-3 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{field.label}</span>
                    <button
                      onClick={() => onToggleLock(client._id, field.key, !isLocked)}
                      className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl font-bold transition-all ${
                        isLocked
                          ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      }`}
                    >
                      {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      <span>{isLocked ? 'LOCKED' : 'UNLOCKED'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
