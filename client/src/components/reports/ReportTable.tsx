import React from 'react';
import { DailyReport } from '../../types';
import { formatDate, formatTimeAgo } from '../../utils/formatters';
import {
  Lock,
  Unlock,
  Edit2,
  Trash2,
  History,
  PhoneCall,
  MessageCircle,
  TrendingUp,
  Clock,
  UserCheck
} from 'lucide-react';

interface ReportTableProps {
  reports: DailyReport[];
  onEditReport: (report: DailyReport) => void;
  onDeleteReport?: (report: DailyReport) => void;
  onUnlockReport?: (report: DailyReport) => void;
  onLockReport?: (report: DailyReport) => void;
  onViewHistory?: (report: DailyReport) => void;
  isAdmin?: boolean;
}

export const ReportTable: React.FC<ReportTableProps> = ({
  reports,
  onEditReport,
  onDeleteReport,
  onUnlockReport,
  onLockReport,
  onViewHistory,
  isAdmin = false
}) => {
  if (reports.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-500 font-bold flex items-center justify-center mx-auto text-xl">
          📊
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          No Daily Reports Found
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          No daily work reports have been submitted for the selected filter criteria yet.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <table className="w-full text-left border-collapse min-w-[950px]">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            <th className="py-3.5 px-4">Date & Caller</th>
            <th className="py-3.5 px-4">Calls (Total / Conn)</th>
            <th className="py-3.5 px-4">Conversions / Meetings</th>
            <th className="py-3.5 px-4">Follow-ups & WA</th>
            <th className="py-3.5 px-4 max-w-[240px]">Daily Remarks</th>
            <th className="py-3.5 px-4">Status & Access</th>
            <th className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
          {reports.map((report) => {
            const editState = report.editState;
            const canEdit = editState?.canEdit ?? true;
            const isUnlockActive = editState?.adminUnlockActive;

            return (
              <tr
                key={report._id}
                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
              >
                {/* Date & Caller */}
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs border border-indigo-100 dark:border-indigo-800 shrink-0">
                      {report.callerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block text-sm">
                        {formatDate(report.reportDate)}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center">
                        <UserCheck className="w-3 h-3 mr-1 text-indigo-500" />
                        {report.callerName}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Total, Connected & Not Picked Calls with New vs Old Lead Stats */}
                <td className="py-4 px-4">
                  <div className="space-y-1">
                    <span className="font-extrabold text-slate-900 dark:text-white block text-sm">
                      {report.totalCalls} <span className="text-xs font-normal text-slate-400">Total Calls</span>
                    </span>
                    <div className="flex items-center space-x-1.5 text-[10px] font-bold">
                      <span className="bg-indigo-500/10 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-500/20" title="Activities on newly assigned leads">
                        New: {report.newLeadStats?.callsMade || 0} Calls ({report.newLeadStats?.convertedClients || 0} Conv)
                      </span>
                      <span className="bg-slate-500/10 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-500/20" title="Activities on existing prospects">
                        Old: {report.oldLeadStats?.callsMade || 0} Calls ({report.oldLeadStats?.convertedClients || 0} Conv)
                      </span>
                    </div>
                  </div>
                </td>

                {/* Conversions & Meetings */}
                <td className="py-4 px-4">
                  <div className="flex flex-col space-y-1">
                    <span className="inline-flex items-center text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 text-[11px] w-fit">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {report.convertedClients} Converted
                    </span>
                    <span className="inline-flex items-center text-purple-700 dark:text-purple-300 font-semibold bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800 text-[10px] w-fit">
                      {report.meetingsScheduled} Meetings
                    </span>
                  </div>
                </td>

                {/* Follow-ups & WhatsApp */}
                <td className="py-4 px-4">
                  <div className="text-slate-700 dark:text-slate-300 space-y-0.5">
                    <span className="block font-semibold">
                      Follow-ups: {report.followUpsDone} Done / {report.followUpsPending} Pending
                    </span>
                    <span className="block text-[11px] text-slate-400">
                      💬 WA Sent: {report.whatsappMessagesSent}
                    </span>
                  </div>
                </td>

                {/* Daily Remarks */}
                <td className="py-4 px-4 max-w-[240px]">
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] line-clamp-2 italic">
                    "{report.remarks || 'No remarks provided'}"
                  </p>
                </td>

                {/* Status & Access */}
                <td className="py-4 px-4">
                  {isAdmin ? (
                    <span className="inline-flex items-center text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full text-[10px] font-bold border border-indigo-200 dark:border-indigo-800">
                      <Unlock className="w-3 h-3 mr-1 text-indigo-500" />
                      Admin Access
                    </span>
                  ) : isUnlockActive ? (
                    <span className="inline-flex items-center text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full text-[10px] font-bold border border-amber-500/30 animate-pulse">
                      <Unlock className="w-3 h-3 mr-1 text-amber-500" />
                      Unlocked (10 Min Window)
                    </span>
                  ) : canEdit ? (
                    <span className="inline-flex items-center text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                      <Unlock className="w-3 h-3 mr-1 text-emerald-500" />
                      Editable (2h Window)
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-full text-[10px] font-bold border border-rose-200 dark:border-rose-800">
                      <Lock className="w-3 h-3 mr-1 text-rose-500" />
                      Locked
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end space-x-1">
                    {/* Admin 10-Min Unlock Trigger */}
                    {isAdmin && onUnlockReport && !isUnlockActive && (
                      <button
                        onClick={() => onUnlockReport(report)}
                        className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors"
                        title="Grant 10-Min Edit Unlock to Caller"
                      >
                        <Unlock className="w-4 h-4" />
                      </button>
                    )}

                    {/* Admin Manual Lock Trigger */}
                    {isAdmin && onLockReport && isUnlockActive && (
                      <button
                        onClick={() => onLockReport(report)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                        title="Lock Report"
                      >
                        <Lock className="w-4 h-4" />
                      </button>
                    )}

                    {/* Edit Button */}
                    <button
                      onClick={() => onEditReport(report)}
                      disabled={!canEdit}
                      className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      title={canEdit ? 'Edit Report' : 'Locked for Caller'}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Edit History Viewer */}
                    {onViewHistory && (
                      <button
                        onClick={() => onViewHistory(report)}
                        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="View Edit History"
                      >
                        <History className="w-4 h-4" />
                      </button>
                    )}

                    {/* Admin Delete */}
                    {isAdmin && onDeleteReport && (
                      <button
                        onClick={() => onDeleteReport(report)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                        title="Delete Report"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
