import React from 'react';
import { ActivityLog } from '../../types';
import { formatDateTime } from '../../utils/formatters';
import { Activity, Shield, User, FileText, CheckCircle2, UserPlus } from 'lucide-react';

interface ActivityLogTableProps {
  logs: ActivityLog[];
}

export const ActivityLogTable: React.FC<ActivityLogTableProps> = ({ logs }) => {
  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE_LEAD':
        return <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md font-bold text-[10px]">CREATE LEAD</span>;
      case 'STATUS_CHANGE':
        return <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md font-bold text-[10px]">STATUS CHANGE</span>;
      case 'NOTE_ADDED':
        return <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md font-bold text-[10px]">NOTE ADDED</span>;
      case 'ASSIGN_LEAD':
        return <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-md font-bold text-[10px]">LEAD REASSIGNED</span>;
      case 'LOGIN':
        return <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md font-bold text-[10px]">LOGIN</span>;
      default:
        return <span className="bg-slate-500/10 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md font-bold text-[10px]">{action}</span>;
    }
  };

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <table className="w-full text-left border-collapse min-w-[700px]">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            <th className="py-3.5 px-4">Timestamp</th>
            <th className="py-3.5 px-4">User / Agent</th>
            <th className="py-3.5 px-4">Action Type</th>
            <th className="py-3.5 px-4">Audit Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {logs.map((log) => (
            <tr key={log._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
              <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                {formatDateTime(log.createdAt)}
              </td>
              <td className="py-3.5 px-4">
                <div className="font-semibold text-slate-800 dark:text-slate-200">{log.userName}</div>
                <div className="text-[10px] text-slate-400">{log.userEmail}</div>
              </td>
              <td className="py-3.5 px-4">{getActionBadge(log.action)}</td>
              <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                {log.details}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
