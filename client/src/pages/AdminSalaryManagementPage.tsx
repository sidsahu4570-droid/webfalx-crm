import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { salaryService } from '../services/salaryService';
import { salaryPaymentService, SalaryPaymentRecord } from '../services/salaryPaymentService';
import { User, SalaryConfiguration } from '../types';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import { PaySalaryModal } from '../components/salary/PaySalaryModal';
import {
  DollarSign,
  UserCheck,
  CreditCard,
  History,
  Settings,
  RotateCcw,
  Plus,
  ArrowRight,
  TrendingUp,
  Award,
  Wallet
} from 'lucide-react';

export const AdminSalaryManagementPage: React.FC = () => {
  const { toast } = useToast();
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState<'management' | 'config' | 'ledger'>('management');

  // Backend state
  const [callers, setCallers] = useState<User[]>([]);
  const [configs, setConfigs] = useState<SalaryConfiguration[]>([]);
  const [payments, setPayments] = useState<SalaryPaymentRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Pay Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCaller, setSelectedCaller] = useState<User | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<SalaryConfiguration | null>(null);

  // Configuration Form State (from original AdminSalaryConfigPage)
  const [configCallerId, setConfigCallerId] = useState('');
  const [configMonthlySalary, setConfigMonthlySalary] = useState(0);
  const [configSalesTarget, setConfigSalesTarget] = useState(0);
  const [configMinThreshold, setConfigMinThreshold] = useState(0);

  const getCurrentMonthStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };
  const currentMonth = getCurrentMonthStr();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, configsRes, paymentsRes] = await Promise.all([
        userService.getUsers(),
        salaryService.getSalaryConfigurations(),
        salaryPaymentService.getAllPayments()
      ]);

      if (usersRes.success) {
        const callerUsers = usersRes.users.filter((u: User) => u.role === 'caller');
        setCallers(callerUsers);
      }
      if (configsRes.success) {
        setConfigs(configsRes.configs);
      }
      if (paymentsRes.success) {
        setPayments(paymentsRes.payments);
      }
    } catch (err: any) {
      toast('Error', err.response?.data?.message || 'Failed to fetch data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Real-time socket synchronization
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      fetchData();
    };

    socket.on('salary_payment_added', handleUpdate);
    socket.on('revenue_updated', handleUpdate);

    return () => {
      socket.off('salary_payment_added', handleUpdate);
      socket.off('revenue_updated', handleUpdate);
    };
  }, [socket]);

  // Handler for opening the modal
  const handleOpenPayModal = (caller: User) => {
    const callerId = caller.id || caller._id;
    const config = configs.find(
      (c) => c.userId === callerId || (typeof c.userId === 'object' && (c.userId as any)._id === callerId)
    );
    setSelectedCaller(caller);
    setSelectedConfig(config || null);
    setIsModalOpen(true);
  };

  // Handler for selecting caller in configuration tab
  const handleSelectConfigCaller = (callerId: string) => {
    setConfigCallerId(callerId);
    const config = configs.find(
      (cfg) => cfg.userId === callerId || (typeof cfg.userId === 'object' && (cfg.userId as any)._id === callerId)
    );

    if (config) {
      setConfigMonthlySalary(config.monthlySalary);
      setConfigSalesTarget(config.monthlySalesTarget);
      setConfigMinThreshold(config.minimumEligibleSales);
    } else {
      setConfigMonthlySalary(0);
      setConfigSalesTarget(0);
      setConfigMinThreshold(0);
    }
  };

  // Handler for saving compensation config
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configCallerId) {
      toast('Validation Error', 'Please select a caller', 'error');
      return;
    }

    try {
      const res = await salaryService.configureSalary({
        userId: configCallerId,
        monthlySalary: configMonthlySalary,
        monthlySalesTarget: configSalesTarget,
        minimumEligibleSales: configMinThreshold
      });

      if (res.success) {
        toast('Success', res.message, 'success');
        fetchData();
      }
    } catch (err: any) {
      toast('Save Error', err.response?.data?.message || 'Failed to save configuration', 'error');
    }
  };

  const formatINR = (val: number = 0) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-wider bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30">
            Admin Payroll Workspace
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2 flex items-center">
            <Wallet className="w-7 h-7 mr-2 text-indigo-400" />
            Salary & Payout Management
          </h2>
          <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-xl">
            Distribute salaries, record bonus milestones, process deductions, and manage compensation packages for the calling team.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl max-w-md">
        <button
          onClick={() => setActiveTab('management')}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all ${
            activeTab === 'management'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          💳 Pay Salary
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all ${
            activeTab === 'config'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          ⚙️ Settings
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all ${
            activeTab === 'ledger'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          📋 Ledger History
        </button>
      </div>

      {/* Loading Spinner */}
      {loading && (
        <div className="py-8 text-center text-xs text-slate-400">Loading payroll workspace...</div>
      )}

      {/* Tab: Management */}
      {!loading && activeTab === 'management' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Calling Team Payout Overview</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Live current month aggregates and pay actions</p>
            </div>
            <button
              onClick={fetchData}
              className="text-slate-400 hover:text-indigo-500 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3.5">Caller Name</th>
                  <th className="p-3.5">Monthly Salary</th>
                  <th className="p-3.5">Salary Paid</th>
                  <th className="p-3.5">Salary Remaining</th>
                  <th className="p-3.5">Bonus Paid</th>
                  <th className="p-3.5">Deduction</th>
                  <th className="p-3.5">Net Received</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {callers.map((caller) => {
                  const callerId = caller.id || caller._id;
                  const config = configs.find(
                    (c) => c.userId === callerId || (typeof c.userId === 'object' && (c.userId as any)._id === callerId)
                  );

                  const monthlySalary = config ? config.monthlySalary : 0;

                  // Filter current month payments
                  const callerMonthPayments = payments.filter(
                    (p) => p.callerId === callerId && p.month === currentMonth
                  );

                  const salaryPaid = callerMonthPayments.reduce((sum, p) => sum + (p.salaryPaid || 0), 0);
                  const salaryRemaining = Math.max(0, monthlySalary - salaryPaid);
                  const bonusPaid = callerMonthPayments.reduce((sum, p) => sum + (p.bonusPaid || 0), 0);
                  const deduction = callerMonthPayments.reduce((sum, p) => sum + (p.deduction || 0), 0);
                  const netReceived = salaryPaid + bonusPaid;

                  let statusText = 'Unpaid';
                  let statusClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';

                  if (salaryPaid >= monthlySalary && monthlySalary > 0) {
                    statusText = 'Fully Paid';
                    statusClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-900/60';
                  } else if (salaryPaid > 0) {
                    statusText = 'Partially Paid';
                    statusClass = 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-250 dark:border-amber-900/60';
                  }

                  return (
                    <tr key={callerId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3.5 font-bold text-slate-800 dark:text-slate-100">
                        {caller.name}
                        <span className="block text-[10px] text-slate-400 font-normal">{caller.email}</span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-700 dark:text-slate-300">
                        {formatINR(monthlySalary)}
                      </td>
                      <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                        {formatINR(salaryPaid)}
                      </td>
                      <td className="p-3.5 font-bold text-rose-500 dark:text-rose-400">
                        {formatINR(salaryRemaining)}
                      </td>
                      <td className="p-3.5 font-bold text-indigo-650 dark:text-indigo-300">
                        {formatINR(bonusPaid)}
                      </td>
                      <td className="p-3.5 font-bold text-rose-600 dark:text-rose-400">
                        {formatINR(deduction)}
                      </td>
                      <td className="p-3.5 font-extrabold text-indigo-600 dark:text-indigo-400">
                        {formatINR(netReceived)}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusClass}`}>
                          {statusText}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleOpenPayModal(caller)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-md shadow-indigo-500/10 transition-all"
                        >
                          Pay Salary
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Config */}
      {!loading && activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Left Form Panel: Select & Configure */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-indigo-500" />
                <span>1. Select Caller User</span>
              </h3>

              <div className="space-y-1">
                <select
                  value={configCallerId}
                  onChange={(e) => handleSelectConfigCaller(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white"
                >
                  <option value="">Choose Caller...</option>
                  {callers.map((c) => (
                    <option key={c.id || c._id} value={c.id || c._id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {configCallerId && (
              <form
                onSubmit={handleSaveConfig}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4 animate-scaleIn"
              >
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <span>2. Salary Target Details</span>
                </h3>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Monthly Salary Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={configMonthlySalary}
                      onChange={(e) => setConfigMonthlySalary(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Monthly Sales Target (Sales count)
                    </label>
                    <input
                      type="number"
                      value={configSalesTarget}
                      onChange={(e) => setConfigSalesTarget(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Min Eligible Sales (Threshold count)
                    </label>
                    <input
                      type="number"
                      value={configMinThreshold}
                      onChange={(e) => setConfigMinThreshold(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-md transition-all"
                >
                  Save Settings
                </button>
              </form>
            )}
          </div>

          {/* Right Table Panel: Config Overview */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Callers Compensation Plan Overview
                </h3>
                <button
                  onClick={fetchData}
                  className="text-slate-400 hover:text-indigo-500 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                      <th className="p-3.5">Caller Name</th>
                      <th className="p-3.5">Monthly Salary</th>
                      <th className="p-3.5">Sales Target</th>
                      <th className="p-3.5">Min Threshold</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {callers.map((caller) => {
                      const callerId = caller.id || caller._id;
                      const config = configs.find(
                        (cfg) => cfg.userId === callerId || (typeof cfg.userId === 'object' && (cfg.userId as any)._id === callerId)
                      );

                      return (
                        <tr key={callerId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                            {caller.name}
                            <span className="block text-[10px] text-slate-400 font-normal">{caller.email}</span>
                          </td>
                          <td className="p-3.5 font-bold text-slate-700 dark:text-slate-300">
                            {config ? formatINR(config.monthlySalary) : '-'}
                          </td>
                          <td className="p-3.5 font-bold text-slate-700 dark:text-slate-300">
                            {config ? `${config.monthlySalesTarget} Sales` : '-'}
                          </td>
                          <td className="p-3.5 font-bold text-slate-700 dark:text-slate-300">
                            {config ? `${config.minimumEligibleSales} Sales` : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Ledger History */}
      {!loading && activeTab === 'ledger' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden animate-fadeIn">
          <div className="p-5 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Global Payment Ledger History</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Chronological ledger of every salary payout recorded</p>
            </div>
            <button
              onClick={fetchData}
              className="text-slate-400 hover:text-indigo-500 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {payments.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-medium">No salary payments recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3.5">Caller</th>
                    <th className="p-3.5">Month</th>
                    <th className="p-3.5">Salary Paid</th>
                    <th className="p-3.5">Bonus Paid</th>
                    <th className="p-3.5">Deduction</th>
                    <th className="p-3.5">Net Paid</th>
                    <th className="p-3.5">Payment Date</th>
                    <th className="p-3.5">Method</th>
                    <th className="p-3.5">Created By</th>
                    <th className="p-3.5">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {payments.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3.5 font-bold text-slate-800 dark:text-slate-100">{p.callerName}</td>
                      <td className="p-3.5 font-bold text-slate-700 dark:text-slate-350">{p.month}</td>
                      <td className="p-3.5 text-emerald-600 dark:text-emerald-400 font-bold">{formatINR(p.salaryPaid)}</td>
                      <td className="p-3.5 text-indigo-650 dark:text-indigo-300 font-bold">{formatINR(p.bonusPaid)}</td>
                      <td className="p-3.5 text-rose-500 dark:text-rose-455 font-bold">{formatINR(p.deduction)}</td>
                      <td className="p-3.5 font-extrabold text-indigo-600 dark:text-indigo-400">{formatINR(p.netPaid)}</td>
                      <td className="p-3.5 font-mono text-slate-500 dark:text-slate-400">
                        {new Date(p.paidAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="p-3.5">
                        <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900 px-2 py-0.5 rounded-md text-[10px] font-bold">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500 dark:text-slate-400 font-semibold">{p.paidBy?.name || 'System'}</td>
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
      )}

      {/* Pay Payout Modal */}
      <PaySalaryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCaller(null);
          setSelectedConfig(null);
        }}
        caller={selectedCaller}
        config={selectedConfig}
        onSuccess={fetchData}
      />
    </div>
  );
};
