import React, { useState, useEffect } from 'react';
import { salaryService } from '../services/salaryService';
import { userService } from '../services/userService';
import { User, SalaryConfiguration } from '../types';
import { useToast } from '../context/ToastContext';
import { Settings, UserCheck, DollarSign, ArrowRight, RotateCcw, ShieldAlert, Award } from 'lucide-react';

export const AdminSalaryConfigPage: React.FC = () => {
  const { toast } = useToast();
  const [callers, setCallers] = useState<User[]>([]);
  const [configs, setConfigs] = useState<SalaryConfiguration[]>([]);
  const [loading, setLoading] = useState(false);

  // Edit / Form state
  const [selectedCallerId, setSelectedCallerId] = useState('');
  const [monthlySalary, setMonthlySalary] = useState(0);
  const [monthlySalesTarget, setMonthlySalesTarget] = useState(0);
  const [minimumEligibleSales, setMinimumEligibleSales] = useState(0);
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const usersRes = await userService.getUsers(); // lists users
      const configsRes = await salaryService.getSalaryConfigurations();
      
      if (usersRes.success) {
        // filter only callers
        const callerUsers = usersRes.users.filter((u: User) => u.role === 'caller');
        setCallers(callerUsers);
      }
      if (configsRes.success) {
        setConfigs(configsRes.configs);
      }
    } catch (err: any) {
      toast('Error', err.response?.data?.message || 'Failed to fetch data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCaller = (callerId: string) => {
    setSelectedCallerId(callerId);
    const config = configs.find(cfg => cfg.userId === callerId || (typeof cfg.userId === 'object' && (cfg.userId as any)._id === callerId));

    if (config) {
      setMonthlySalary(config.monthlySalary);
      setMonthlySalesTarget(config.monthlySalesTarget);
      setMinimumEligibleSales(config.minimumEligibleSales);
    } else {
      setMonthlySalary(0);
      setMonthlySalesTarget(0);
      setMinimumEligibleSales(0);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCallerId) {
      toast('Validation Error', 'Please select a caller', 'error');
      return;
    }

    try {
      const res = await salaryService.configureSalary({
        userId: selectedCallerId,
        monthlySalary,
        monthlySalesTarget,
        minimumEligibleSales
      });

      if (res.success) {
        toast('Success', res.message, 'success');
        fetchData();
      }
    } catch (err: any) {
      toast('Save Error', err.response?.data?.message || 'Failed to save configuration', 'error');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center">
          💼 Salary Settings Configurator
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Configure salary based compensation plans, sales targets, and thresholds for individual callers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form Panel: Select & Configure */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-indigo-500" />
              <span>1. Select Caller User</span>
            </h3>

            <div className="space-y-1">
              <select
                value={selectedCallerId}
                onChange={(e) => handleSelectCaller(e.target.value)}
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

          {selectedCallerId && (
            <form
              onSubmit={handleSaveConfig}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4"
            >
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span>2. Salary Target Details</span>
              </h3>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Monthly Salary Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={monthlySalary}
                    onChange={(e) => setMonthlySalary(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Monthly Sales Target (Sales count)
                  </label>
                  <input
                    type="number"
                    value={monthlySalesTarget}
                    onChange={(e) => setMonthlySalesTarget(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Min Eligible Sales (Threshold count)
                  </label>
                  <input
                    type="number"
                    value={minimumEligibleSales}
                    onChange={(e) => setMinimumEligibleSales(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-md"
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

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading configurations...</div>
            ) : callers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No callers registered in system.</div>
            ) : (
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
                      const config = configs.find(cfg => cfg.userId === callerId || (typeof cfg.userId === 'object' && (cfg.userId as any)._id === callerId));

                      return (
                        <tr key={callerId} className="hover:bg-slate-55 dark:hover:bg-slate-800/30">
                          <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                            {caller.name}
                            <span className="block text-[10px] text-slate-400 font-normal">{caller.email}</span>
                          </td>
                          <td className="p-3.5 font-bold text-slate-700 dark:text-slate-300">
                            {config ? `₹${config.monthlySalary.toLocaleString()}` : '-'}
                          </td>
                          <td className="p-3.5 text-center font-bold">
                            {config ? `${config.monthlySalesTarget} Sales` : '-'}
                          </td>
                          <td className="p-3.5 text-center font-bold">
                            {config ? `${config.minimumEligibleSales} Sales` : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
