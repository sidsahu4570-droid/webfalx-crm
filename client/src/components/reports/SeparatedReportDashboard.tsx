import React, { useState, useEffect } from 'react';
import { reportService, ReportFilterParams } from '../../services/reportService';
import { LoadingSpinner } from '../common/SkeletonLoader';
import { formatDate } from '../../utils/formatters';
import { useSocket } from '../../context/SocketContext';
import {
  PhoneCall,
  PhoneOff,
  UserCheck,
  MessageCircle,
  Clock,
  Calendar,
  TrendingUp,
  Filter,
  Download,
  History,
  Sparkles,
  Layers
} from 'lucide-react';

interface SeparatedReportDashboardProps {
  isAdmin?: boolean;
  callerIdFilter?: string;
}

export const SeparatedReportDashboard: React.FC<SeparatedReportDashboardProps> = ({
  isAdmin = false,
  callerIdFilter
}) => {
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState<'new' | 'existing'>('new');
  const [filterRange, setFilterRange] = useState<string>('today');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [newReports, setNewReports] = useState<any[]>([]);
  const [existingReports, setExistingReports] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingAudits, setLoadingAudits] = useState<boolean>(false);
  const [showAuditDrawer, setShowAuditDrawer] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: ReportFilterParams = {
        filterRange,
        startDate: filterRange === 'custom' ? startDate : undefined,
        endDate: filterRange === 'custom' ? endDate : undefined,
        callerId: callerIdFilter
      };

      if (activeTab === 'new') {
        const [repRes, auditRes] = await Promise.all([
          reportService.getNewLeadReports(params),
          reportService.getNewLeadReportAudits({ callerId: callerIdFilter })
        ]);
        if (repRes.success) setNewReports(repRes.reports);
        if (auditRes.success) setAudits(auditRes.audits);
      } else {
        const [repRes, auditRes] = await Promise.all([
          reportService.getExistingLeadReports(params),
          reportService.getExistingLeadReportAudits({ callerId: callerIdFilter })
        ]);
        if (repRes.success) setExistingReports(repRes.reports);
        if (auditRes.success) setAudits(auditRes.audits);
      }
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, filterRange, startDate, endDate, callerIdFilter]);

  // Real-time Socket Listener
  useEffect(() => {
    if (!socket) return;
    const handleNewLeadUpdate = () => {
      if (activeTab === 'new') fetchData();
    };
    const handleExistingLeadUpdate = () => {
      if (activeTab === 'existing') fetchData();
    };

    socket.on('new_lead_report_updated', handleNewLeadUpdate);
    socket.on('existing_lead_report_updated', handleExistingLeadUpdate);

    return () => {
      socket.off('new_lead_report_updated', handleNewLeadUpdate);
      socket.off('existing_lead_report_updated', handleExistingLeadUpdate);
    };
  }, [socket, activeTab]);

  const currentReports = activeTab === 'new' ? newReports : existingReports;

  // Calculate Aggregated Metrics for KPI Cards
  const totals = currentReports.reduce(
    (acc, r) => ({
      totalCalls: acc.totalCalls + (r.totalCalls || 0),
      connectedCalls: acc.connectedCalls + (r.connectedCalls || 0),
      notPickedCalls: acc.notPickedCalls + (r.notPickedCalls || 0),
      whatsAppSent: acc.whatsAppSent + (r.whatsAppSent || 0),
      followUp: acc.followUp + (r.followUp || 0),
      meetingsScheduled: acc.meetingsScheduled + (r.meetingsScheduled || 0),
      convertedClients: acc.convertedClients + (r.convertedClients || 0)
    }),
    {
      totalCalls: 0,
      connectedCalls: 0,
      notPickedCalls: 0,
      whatsAppSent: 0,
      followUp: 0,
      meetingsScheduled: 0,
      convertedClients: 0
    }
  );

  const exportCSV = () => {
    if (currentReports.length === 0) return;
    const headers = [
      'Date',
      'Caller Name',
      'Total Calls',
      'Connected Calls',
      'Not Picked Calls',
      'WhatsApp Sent',
      'Follow-ups',
      'Meetings',
      'Converted Clients'
    ];
    const rows = currentReports.map((r) => [
      r.dateString,
      `"${r.callerName}"`,
      r.totalCalls,
      r.connectedCalls,
      r.notPickedCalls,
      r.whatsAppSent,
      r.followUp,
      r.meetingsScheduled,
      r.convertedClients
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeTab}_lead_daily_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 📌 Top Navigation Tabs for Reports */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('new')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === 'new'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>New Lead Daily Report</span>
          </button>

          <button
            onClick={() => setActiveTab('existing')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === 'existing'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Existing Lead (My Prospects) Report</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAuditDrawer(!showAuditDrawer)}
            className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
          >
            <History className="w-4 h-4 text-indigo-500" />
            <span>Audit Trail History</span>
          </button>

          <button
            onClick={exportCSV}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 📅 Date Range Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
          <span className="text-slate-400 flex items-center mr-2">
            <Filter className="w-3.5 h-3.5 mr-1 text-indigo-500" />
            Filter Period:
          </span>
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'last7days', label: 'Last 7 Days' },
            { id: 'last15days', label: 'Last 15 Days' },
            { id: 'last30days', label: 'Last 30 Days' },
            { id: 'thisMonth', label: 'This Month' },
            { id: 'custom', label: 'Custom Range' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterRange(f.id)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                filterRange === f.id
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 font-extrabold'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filterRange === 'custom' && (
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200"
            />
          </div>
        )}
      </div>

      {/* 📊 7 KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Calls</span>
            <PhoneCall className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white">{totals.totalCalls}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Connected</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{totals.connectedCalls}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Not Picked</span>
            <PhoneOff className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-xl font-extrabold text-orange-600 dark:text-orange-400">{totals.notPickedCalls}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">WhatsApp</span>
            <MessageCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{totals.whatsAppSent}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Follow-ups</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400">{totals.followUp}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Meetings</span>
            <Calendar className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-extrabold text-purple-600 dark:text-purple-400">{totals.meetingsScheduled}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Converted</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{totals.convertedClients}</div>
        </div>
      </div>

      {/* 📋 Daily Statistics Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white capitalize">
            {activeTab === 'new' ? 'New Lead' : 'Existing Lead'} Daily Activity Logs
          </h3>
          <span className="text-xs text-slate-400 font-medium">Total Entries: {currentReports.length}</span>
        </div>

        {loading ? (
          <LoadingSpinner text="Fetching daily report statistics..." />
        ) : currentReports.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs font-semibold">
            No report data recorded for the selected filter period.
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[850px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 text-[11px] font-bold text-slate-400 uppercase">
                  <th className="py-3.5 px-4">Date & Caller</th>
                  <th className="py-3.5 px-4">Total Calls</th>
                  <th className="py-3.5 px-4">Connected</th>
                  <th className="py-3.5 px-4">Not Picked</th>
                  <th className="py-3.5 px-4">WhatsApp Sent</th>
                  <th className="py-3.5 px-4">Follow-ups</th>
                  <th className="py-3.5 px-4">Meetings</th>
                  <th className="py-3.5 px-4">Converted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentReports.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">
                      <div>{formatDate(r.reportDate)}</div>
                      <div className="text-[11px] font-normal text-slate-400">{r.callerName}</div>
                    </td>
                    <td className="py-4 px-4 font-extrabold text-slate-800 dark:text-slate-200">{r.totalCalls}</td>
                    <td className="py-4 px-4 font-extrabold text-emerald-600 dark:text-emerald-400">{r.connectedCalls}</td>
                    <td className="py-4 px-4 font-extrabold text-orange-600 dark:text-orange-400">{r.notPickedCalls}</td>
                    <td className="py-4 px-4 font-extrabold text-emerald-600 dark:text-emerald-400">{r.whatsAppSent}</td>
                    <td className="py-4 px-4 font-extrabold text-blue-600 dark:text-blue-400">{r.followUp}</td>
                    <td className="py-4 px-4 font-extrabold text-purple-600 dark:text-purple-400">{r.meetingsScheduled}</td>
                    <td className="py-4 px-4 font-extrabold text-emerald-600 dark:text-emerald-400">{r.convertedClients}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 📜 Audit Trail Section */}
      {showAuditDrawer && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center">
              <History className="w-4 h-4 mr-2 text-indigo-500" />
              {activeTab === 'new' ? 'New Lead' : 'Existing Lead'} Audit Trail Log
            </h3>
            <button
              onClick={() => setShowAuditDrawer(false)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              Close Drawer ✖
            </button>
          </div>

          {audits.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">No audit logs recorded for this tab yet.</div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[750px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 text-[11px] font-bold text-slate-400 uppercase">
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Lead Name</th>
                    <th className="py-3.5 px-4">Lead Type</th>
                    <th className="py-3.5 px-4">Caller</th>
                    <th className="py-3.5 px-4">Status Transition</th>
                    <th className="py-3.5 px-4">WhatsApp Sent?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {audits.map((a) => (
                    <tr key={a._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                        {a.date} <span className="text-[10px] text-slate-400 font-normal">{a.time}</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-indigo-600 dark:text-indigo-400">{a.leadName}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600">
                          {a.leadType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">{a.callerName}</td>
                      <td className="py-3.5 px-4 text-[11px]">
                        <span className="text-slate-400">{a.previousStatus}</span> ➔{' '}
                        <span className="font-extrabold text-slate-900 dark:text-white">{a.updatedStatus}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            a.whatsAppStatus === 'Yes'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : 'bg-rose-500/10 text-rose-600'
                          }`}
                        >
                          {a.whatsAppStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
