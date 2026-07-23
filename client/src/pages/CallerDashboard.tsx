import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';
import { leadService } from '../services/leadService';
import { convertedClientService } from '../services/convertedClientService';
import { DashboardStats, Lead } from '../types';
import { StatsCard } from '../components/dashboard/StatsCard';
import { OverviewCharts } from '../components/dashboard/OverviewCharts';
import { LoadingSpinner } from '../components/common/SkeletonLoader';
import { LeadDetailModal } from '../components/leads/LeadDetailModal';
import { ConvertedClientModal } from '../components/converted/ConvertedClientModal';
import { SalaryBonusTrackerCard } from '../components/salary/SalaryBonusTrackerCard';
import { salaryService } from '../services/salaryService';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import { formatDate, isFollowUpDue } from '../utils/formatters';
import {
  Users,
  CalendarClock,
  CheckCircle2,
  TrendingUp,
  Plus,
  ArrowRight,
  PhoneCall,
  Clock,
  Briefcase
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

export const CallerDashboard: React.FC = () => {
  const { user, updateCurrentUser } = useAuth();
  const { toast } = useToast();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [dueLeads, setDueLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Convert Lead -> Converted Client flow
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [converting, setConverting] = useState(false);

  // Salary Based progress states
  const [salaryProgress, setSalaryProgress] = useState<any>(null);
  const [bonusProgress, setBonusProgress] = useState<any[]>([]);
  const [salaryConfig, setSalaryConfig] = useState<any>(null);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, dueRes] = await Promise.all([
        adminService.getStats().catch(() => ({ success: true, stats: defaultStats })),
        leadService.getLeads({ dueFollowUp: true, limit: 5 }).catch(() => ({ success: true, leads: [] }))
      ]);

      if (statsRes && statsRes.stats) setStats(statsRes.stats);
      if (dueRes && dueRes.leads) setDueLeads(dueRes.leads);
    } catch (error) {
      console.error('[Dashboard Error]', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalaryProgress = async () => {
    try {
      const res = await salaryService.getSalaryProgress();
      if (res.success) {
        setSalaryProgress(res.salaryProgress);
        setBonusProgress(res.bonusProgress);
        setSalaryConfig(res.salaryConfiguration);
      }
    } catch (error) {
      console.error('[Salary Progress Fetch Error]', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchSalaryProgress();
  }, [user]);

  // Real-Time Socket Listener for Live Dashboard Synchronization
  useEffect(() => {
    if (!socket) return;
    const handleRefresh = () => {
      fetchDashboardData();
      fetchSalaryProgress();
    };

    socket.on('lead_created', handleRefresh);
    socket.on('lead_updated', handleRefresh);
    socket.on('client_created', handleRefresh);
    socket.on('client_updated', handleRefresh);
    socket.on('converted_client_created', handleRefresh);
    socket.on('converted_client_updated', handleRefresh);
    socket.on('leads_imported', handleRefresh);
    socket.on('salary_progress_updated', handleRefresh);
    socket.on('bonus_progress_updated', handleRefresh);

    return () => {
      socket.off('lead_created', handleRefresh);
      socket.off('lead_updated', handleRefresh);
      socket.off('client_created', handleRefresh);
      socket.off('client_updated', handleRefresh);
      socket.off('converted_client_created', handleRefresh);
      socket.off('converted_client_updated', handleRefresh);
      socket.off('leads_imported', handleRefresh);
      socket.off('salary_progress_updated', handleRefresh);
      socket.off('bonus_progress_updated', handleRefresh);
    };
  }, [socket, user]);

  const handleCompleteFollowUp = async (leadId: string, nextDate?: string) => {
    try {
      const res = await leadService.completeFollowUp(leadId, nextDate);
      if (res.success) {
        toast('Follow-up Completed', 'Marked follow-up as completed', 'success');
        fetchDashboardData();
        if (selectedLead?._id === leadId) setSelectedLead(res.lead);
      }
    } catch (err: any) {
      toast('Error', err.message, 'error');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading Caller Workspace..." />;
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-wider bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30">
            Caller Workspace • Daily Overview
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2">
            Welcome back, {user?.name}!
          </h2>
          <p className="text-indigo-200 text-xs md:text-sm mt-1 max-w-xl">
            Track your assigned prospects, follow-up schedule, converted clients, and calling performance.
          </p>
        </div>

        <button
          onClick={() => navigate('/dashboard/leads')}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold px-4 py-2.5 rounded-2xl shadow-lg transition-all"
        >
          <PhoneCall className="w-4 h-4" />
          <span>My Prospects</span>
        </button>
      </div>

      {/* Salary & Bonus Progress bars */}
      <SalaryBonusTrackerCard
        salaryProgress={salaryProgress}
        bonusProgress={bonusProgress}
        salaryConfig={salaryConfig}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Total Assigned Prospects"
          value={stats.totalLeads}
          icon={Users}
          iconBgColor="bg-indigo-500/10"
          iconTextColor="text-indigo-600 dark:text-indigo-400"
          subtitle="Assigned active prospects"
        />
        <StatsCard
          title="Converted Clients"
          value={stats.statusCounts['Converted'] || 0}
          icon={Briefcase}
          iconBgColor="bg-emerald-500/10"
          iconTextColor="text-emerald-600 dark:text-emerald-400"
          subtitle="Synchronized live converted clients"
        />
        <StatsCard
          title="Follow-ups Due Today"
          value={stats.followUpsDueToday}
          icon={CalendarClock}
          iconBgColor="bg-amber-500/10"
          iconTextColor="text-amber-600 dark:text-amber-400"
          subtitle="Follow-ups requiring action"
        />
        <StatsCard
          title="Completed Follow-ups"
          value={stats.completedFollowUps}
          icon={CheckCircle2}
          iconBgColor="bg-blue-500/10"
          iconTextColor="text-blue-600 dark:text-blue-400"
          subtitle="Total calls and follow-ups logged"
        />
      </div>

      {/* Analytics Charts */}
      <OverviewCharts stats={stats} />

      {/* Due Follow-ups Quick Widget */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
            <Clock className="w-4 h-4 mr-2 text-amber-500" />
            Top Due Follow-ups Requiring Immediate Action
          </h3>
          <button
            onClick={() => navigate('/dashboard/followups')}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center"
          >
            <span>View All Follow-ups</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

        {dueLeads.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {dueLeads.map((lead) => (
              <div
                key={lead._id}
                onClick={() => setSelectedLead(lead)}
                className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 px-3 rounded-2xl cursor-pointer transition-all"
              >
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                    {lead.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {lead.company ? `${lead.company} • ` : ''}Phone: {lead.phone || 'N/A'}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded-full">
                    {formatDate(lead.nextFollowUpDate)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-400 italic">
            🎉 Great job! No follow-ups currently due.
          </div>
        )}
      </div>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <LeadDetailModal
          isOpen={!!selectedLead}
          onClose={() => setSelectedLead(null)}
          lead={selectedLead}
          onAddNote={async (id, text, opts) => {
            await leadService.addNote(id, text, opts);
            fetchDashboardData();
          }}
          onUpdateStatus={async (id, s) => {
            await leadService.updateLead(id, { status: s });
            fetchDashboardData();
          }}
          onCompleteFollowUp={handleCompleteFollowUp}
          onConvertLead={(lead) => {
            setLeadToConvert(lead);
            setSelectedLead(null);
            setConvertModalOpen(true);
          }}
        />
      )}

      {leadToConvert && (
        <ConvertedClientModal
          isOpen={convertModalOpen}
          onClose={() => { setConvertModalOpen(false); setLeadToConvert(null); }}
          onSubmit={async (data) => {
            setConverting(true);
            try {
              const res = await convertedClientService.createClient(data);
              if (res.success) {
                toast('Client Converted!', `${leadToConvert?.name} submitted for admin approval.`, 'success');
                setConvertModalOpen(false);
                setLeadToConvert(null);
                fetchDashboardData();
              }
            } catch (err: any) {
              toast('Conversion Error', err.response?.data?.message || err.message, 'error');
            } finally {
              setConverting(false);
            }
          }}
          prefillFromLead={{
            leadId: leadToConvert._id,
            name: leadToConvert.name,
            company: leadToConvert.company,
            phone: leadToConvert.phone,
            email: leadToConvert.email,
            address: leadToConvert.address,
            callerName: leadToConvert.callerName,
            serialNumber: leadToConvert.serialNumber,
            categoryName: leadToConvert.categoryName,
            source: leadToConvert.source,
          }}
          loading={converting}
        />
      )}
    </div>
  );
};
