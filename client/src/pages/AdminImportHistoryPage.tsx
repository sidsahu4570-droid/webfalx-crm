import React, { useState, useEffect } from 'react';
import { leadService } from '../services/leadService';
import { ImportHistoryRecord } from '../types';
import { formatDateTime } from '../utils/formatters';
import { LoadingSpinner } from '../components/common/SkeletonLoader';
import { useToast } from '../context/ToastContext';
import { History, FileSpreadsheet, UserCheck, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

export const AdminImportHistoryPage: React.FC = () => {
  const { toast } = useToast();
  const [history, setHistory] = useState<ImportHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await leadService.getImportHistory();
      if (res.success) setHistory(res.history);
    } catch (err: any) {
      toast('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading Lead Import History Logs..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-wider bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30">
            Admin Portal • Import Audit History
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2">
            Excel & CSV Lead Import Logs
          </h2>
          <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-xl">
            Complete audit trail of all bulk lead file imports, assigned callers, row counts, and duplicate handling results.
          </p>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
            <History className="w-4 h-4 mr-2 text-indigo-500" />
            Lead Import Records ({history.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">File Name</th>
                <th className="py-3.5 px-4">Assigned Caller</th>
                <th className="py-3.5 px-4">Imported By</th>
                <th className="py-3.5 px-4">Total Rows</th>
                <th className="py-3.5 px-4">Successful</th>
                <th className="py-3.5 px-4">Duplicates</th>
                <th className="py-3.5 px-4">Failed / Skipped</th>
                <th className="py-3.5 px-4">Import Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-mono">
              {history.length > 0 ? (
                history.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-4 px-4 font-sans font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <FileSpreadsheet className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>{item.fileName}</span>
                    </td>
                    <td className="py-4 px-4 font-sans text-slate-800 dark:text-slate-200">
                      <span className="font-bold">{item.assignedCallerName}</span>
                      <span className="text-[10px] text-slate-400 block font-normal">{item.assignedCallerEmail}</span>
                    </td>
                    <td className="py-4 px-4 font-sans text-slate-600 dark:text-slate-400">
                      {item.importedBy}
                    </td>
                    <td className="py-4 px-4 font-extrabold text-slate-900 dark:text-white">
                      {item.totalRows}
                    </td>
                    <td className="py-4 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                      {item.successfulImports}
                    </td>
                    <td className="py-4 px-4 font-semibold text-amber-600 dark:text-amber-400">
                      {item.duplicateCount} ({item.duplicateAction})
                    </td>
                    <td className="py-4 px-4 text-rose-500">
                      {item.failedImports}
                    </td>
                    <td className="py-4 px-4 font-sans text-slate-500 text-[11px]">
                      {formatDateTime(item.importDate)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-slate-400 italic font-sans">
                    No lead import logs found. Use the "Import Excel / CSV" button on the New Leads page to import leads.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
