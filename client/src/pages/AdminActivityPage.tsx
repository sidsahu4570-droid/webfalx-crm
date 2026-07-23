import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { ActivityLog } from '../types';
import { ActivityLogTable } from '../components/admin/ActivityLogTable';
import { LoadingSpinner } from '../components/common/SkeletonLoader';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { Activity, ChevronLeft, ChevronRight } from 'lucide-react';

export const AdminActivityPage: React.FC = () => {
  const { toast } = useToast();
  const { socket } = useSocket();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await adminService.getActivityLogs({
        page,
        limit: 20,
        action: actionFilter || undefined
      });
      if (res.success && res.logs) {
        setLogs(res.logs);
        setTotalPages(res.pagination.pages);
      }
    } catch (err: any) {
      toast('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  // Real-time audit log stream
  useEffect(() => {
    if (!socket) return;
    const handleNewActivity = (newLog: ActivityLog) => {
      setLogs((prev) => [newLog, ...prev.slice(0, 19)]);
    };

    socket.on('activity_new', handleNewActivity);
    return () => {
      socket.off('activity_new', handleNewActivity);
    };
  }, [socket]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-indigo-600 text-white">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Real-time System Activity & Audit Trail
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live stream of caller logins, lead creations, status changes, and admin assignments
            </p>
          </div>
        </div>

        {/* Action Type Filter */}
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200"
        >
          <option value="">All Actions</option>
          <option value="CREATE_LEAD">Create Lead</option>
          <option value="STATUS_CHANGE">Status Change</option>
          <option value="NOTE_ADDED">Note Added</option>
          <option value="ASSIGN_LEAD">Lead Reassigned</option>
          <option value="LOGIN">User Login</option>
          <option value="CREATE_USER">Create Caller</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching audit trail history..." />
      ) : (
        <ActivityLogTable logs={logs} />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500">
            Page <strong className="text-slate-900 dark:text-white font-bold">{page}</strong> of {totalPages}
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
