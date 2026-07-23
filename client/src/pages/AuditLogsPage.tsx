import React, { useState, useEffect } from 'react';
import { auditLogService } from '../services/auditLogService';
import { AuditLogRecord } from '../types';
import { LoadingSpinner } from '../components/common/SkeletonLoader';
import { useToast } from '../context/ToastContext';
import { formatDateTime } from '../utils/formatters';
import { ShieldCheck, Search, Filter, Key } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await auditLogService.getLogs({
        search: search || undefined,
        module: moduleFilter || undefined
      });
      if (res.success) setLogs(res.logs);
    } catch (err: any) {
      toast('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [moduleFilter]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-wider bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30">
            Security & Audit Controls
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2 flex items-center">
            <ShieldCheck className="w-7 h-7 mr-2 text-indigo-400" />
            Audit & Security Log History
          </h2>
          <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-xl">
            Complete immutable security trail tracking field updates, payments, approvals, and field lock toggles.
          </p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
            placeholder="Search user, action, field changed, old or new value..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white"
          />
          <button
            onClick={fetchLogs}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-xl shrink-0"
          >
            Search
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-800 dark:text-slate-200 font-bold"
          >
            <option value="">All Modules</option>
            <option value="Lead">Leads</option>
            <option value="ConvertedClient">Converted Clients</option>
            <option value="Revenue">Revenue & Expenses</option>
            <option value="Attendance">Attendance</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      {loading ? (
        <LoadingSpinner text="Fetching audit security trail..." />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Field Changed</th>
                  <th className="py-3 px-4">Old Value</th>
                  <th className="py-3 px-4">New Value</th>
                  <th className="py-3 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-mono">
                {logs.length > 0 ? (
                  logs.map((l) => (
                    <tr key={l._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-sans text-slate-400 text-[11px]">
                        {formatDateTime(l.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 font-sans font-bold text-slate-900 dark:text-white">
                        {l.userName}
                        <span className="text-[10px] text-slate-400 block font-normal capitalize">
                          {l.userRole}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-sans font-bold text-indigo-600 dark:text-indigo-400">
                        {l.action}
                      </td>
                      <td className="py-3.5 px-4 font-sans text-slate-700 dark:text-slate-300">
                        {l.fieldChanged || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-rose-500 font-sans text-[11px]">
                        {l.oldValue || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-emerald-600 font-sans text-[11px]">
                        {l.newValue || '-'}
                      </td>
                      <td className="py-3.5 px-4 font-sans text-slate-400 text-[10px]">
                        {l.ipAddress || '127.0.0.1'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-xs text-slate-400 italic font-sans">
                      No audit security logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
