import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { userService } from '../services/userService';
import { DashboardStats, User, ActivityLog } from '../types';
import { StatsCard } from '../components/dashboard/StatsCard';
import { OverviewCharts } from '../components/dashboard/OverviewCharts';
import { LoadingSpinner } from '../components/common/SkeletonLoader';
import { UserModal } from '../components/admin/UserModal';
import { ActivityLogTable } from '../components/admin/ActivityLogTable';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import {
  Users,
  Shield,
  Layers,
  CalendarClock,
  CheckCircle2,
  UserPlus,
  Activity,
  Trash2,
  Briefcase
} from 'lucide-react';

const defaultStats: DashboardStats = {
  totalLeads: 0,
  followUpsDueToday: 0,
  completedFollowUps: 0,
  newLeadsAddedToday: 0,
  statusCounts: {
    New: 0,
    Interested: 0,
    'Follow-up': 0,
    'Meeting Scheduled': 0,
    Converted: 0,
    'Not Interested': 0,
    Closed: 0
  },
  priorityCounts: {
    Low: 0,
    Medium: 0,
    High: 0
  },
  callersPerformance: []
};

export const AdminDashboard: React.FC = () => {
  const { toast } = useToast();
  const { socket } = useSocket();
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);

  // Clear Demo Data state
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes, logsRes] = await Promise.all([
        adminService.getStats().catch(() => ({ success: true, stats: defaultStats })),
        userService.getUsers().catch(() => ({ success: true, users: [] })),
        adminService.getActivityLogs({ limit: 8 }).catch(() => ({ success: true, logs: [] }))
      ]);

      if (statsRes && statsRes.stats) setStats(statsRes.stats);
      if (usersRes && usersRes.users) setUsers(usersRes.users);
      if (logsRes && logsRes.logs) setLogs(logsRes.logs);
    } catch (err: any) {
      console.error('[Admin Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Socket Listener for Real-Time Synchronization across Dashboard
  useEffect(() => {
    if (!socket) return;
    const handleRefresh = () => fetchAdminData();
    const handleNewActivity = (newLog: ActivityLog) => {
      setLogs((prev) => [newLog, ...prev.slice(0, 7)]);
      fetchAdminData();
    };

    socket.on('activity_new', handleNewActivity);
    socket.on('lead_created', handleRefresh);
    socket.on('lead_updated', handleRefresh);
    socket.on('client_created', handleRefresh);
    socket.on('client_updated', handleRefresh);
    socket.on('converted_client_created', handleRefresh);
    socket.on('converted_client_updated', handleRefresh);
    socket.on('leads_imported', handleRefresh);

    return () => {
      socket.off('activity_new', handleNewActivity);
      socket.off('lead_created', handleRefresh);
      socket.off('lead_updated', handleRefresh);
      socket.off('client_created', handleRefresh);
      socket.off('client_updated', handleRefresh);
      socket.off('converted_client_created', handleRefresh);
      socket.off('converted_client_updated', handleRefresh);
      socket.off('leads_imported', handleRefresh);
    };
  }, [socket]);

  const handleCreateUser = async (data: any) => {
    setCreatingUser(true);
    try {
      const res = await userService.createUser(data);
      if (res.success) {
        toast('Caller Account Created', `Created caller profile for ${res.user.name}`, 'success');
        fetchAdminData();
      }
    } catch (err: any) {
      toast('Creation Failed', err.response?.data?.message || err.message, 'error');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleClearDemoData = async () => {
    setClearing(true);
    try {
      const res = await adminService.clearDemoData();
      if (res.success) {
        toast('Demo Data Purged', 'All sample leads and demo callers have been deleted', 'success');
        setClearConfirmOpen(false);
        fetchAdminData();
      }
    } catch (err: any) {
      toast('Purge Failed', err.message, 'error');
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading Admin Command Center..." />;
  }

  const activeCallersCount = users.filter((u) => u.role === 'caller' && u.isActive).length;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-wider bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30">
            Admin Command Center
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2">
            Team Performance & Operational Intelligence
          </h2>
          <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-xl">
            Live updates across callers, prospect pipelines, status distribution, and activity logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCreateUserOpen(true)}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Caller Account</span>
          </button>

          <button
            onClick={() => setClearConfirmOpen(true)}
            className="flex items-center space-x-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold px-3 py-2.5 rounded-2xl transition-all shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Clear Demo Data</span>
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Active Prospects Pipeline"
          value={stats.totalLeads}
          icon={Layers}
          iconBgColor="bg-indigo-500/10"
          iconTextColor="text-indigo-600 dark:text-indigo-400"
          subtitle="Active team leads in process"
        />
        <StatsCard
          title="Total Converted Clients"
          value={stats.statusCounts['Converted'] || 0}
          icon={Briefcase}
          iconBgColor="bg-emerald-500/10"
          iconTextColor="text-emerald-600 dark:text-emerald-400"
          subtitle="Synchronized live converted count"
        />
        <StatsCard
          title="Follow-ups Due Today"
          value={stats.followUpsDueToday}
          icon={CalendarClock}
          iconBgColor="bg-amber-500/10"
          iconTextColor="text-amber-600 dark:text-amber-400"
          subtitle="Pending follow-up actions"
        />
        <StatsCard
          title="Active Calling Agents"
          value={activeCallersCount}
          icon={Users}
          iconBgColor="bg-purple-500/10"
          iconTextColor="text-purple-600 dark:text-purple-400"
          subtitle={`Out of ${users.filter((u) => u.role === 'caller').length} registered callers`}
        />
      </div>

      {/* Analytics Charts */}
      <OverviewCharts stats={stats} />

      {/* Live Audit Log Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center">
            <Activity className="w-4 h-4 mr-2 text-indigo-500" />
            Live Activity Audit Stream
          </h3>
          <span className="text-xs text-slate-500 font-mono">Real-time socket updates</span>
        </div>
        <ActivityLogTable logs={logs} />
      </div>

      {/* Create User Modal */}
      <UserModal
        isOpen={createUserOpen}
        onClose={() => setCreateUserOpen(false)}
        onSubmit={handleCreateUser}
        loading={creatingUser}
      />

      {/* Confirm Clear Demo Data Modal */}
      <ConfirmDialog
        isOpen={clearConfirmOpen}
        onClose={() => setClearConfirmOpen(false)}
        onConfirm={handleClearDemoData}
        title="Purge All Demo Data?"
        message="Are you sure you want to permanently delete all sample demo leads, sample caller profiles, and activity logs? Real caller profiles and active data will not be affected."
        confirmText="Yes, Clear Demo Data"
      />
    </div>
  );
};
