import React, { useState, useEffect } from 'react';
import { convertedClientService } from '../services/convertedClientService';
import { ConvertedClient, WebsiteUpdate, PaymentHistory } from '../types';
import { formatDate } from '../utils/formatters';
import { ConvertedClientDetailModal } from '../components/converted/ConvertedClientDetailModal';
import { LoadingSpinner } from '../components/common/SkeletonLoader';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import {
  DollarSign,
  Search,
  Award,
  Calendar,
  Building,
  Globe,
  Clock,
  Eye,
  PlusCircle,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const CallerPaymentsPage: React.FC = () => {
  const { toast } = useToast();
  const { socket } = useSocket();

  const [clients, setClients] = useState<ConvertedClient[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [websiteStatus, setWebsiteStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');

  // Modals
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ConvertedClient | null>(null);
  const [websiteUpdates, setWebsiteUpdates] = useState<WebsiteUpdate[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);

  const fetchCallerData = async () => {
    try {
      const res = await convertedClientService.getClients({
        search: search || undefined,
        websiteStatus: websiteStatus || undefined,
        paymentStatus: paymentStatus || undefined,
        approvalStatus: 'Approved'
      });
      if (res.success) setClients(res.clients);
    } catch (err: any) {
      toast('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCallerData();
  }, [search, websiteStatus, paymentStatus]);

  // Real-time socket updates
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchCallerData();

    socket.on('client_updated', handleUpdate);
    socket.on('payment_added', handleUpdate);
    socket.on('website_update_added', handleUpdate);

    return () => {
      socket.off('client_updated', handleUpdate);
      socket.off('payment_added', handleUpdate);
      socket.off('website_update_added', handleUpdate);
    };
  }, [socket]);

  const formatINR = (val: number = 0) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleSelectClient = async (client: ConvertedClient) => {
    setSelectedClient(client);
    setDetailOpen(true);
    try {
      const res = await convertedClientService.getClientById(client._id);
      if (res.success) {
        setWebsiteUpdates(res.websiteUpdates);
        setPaymentHistory(res.paymentHistory);
      }
    } catch (err: any) {
      console.error('[Error]', err);
    }
  };

  const handleAddWebsiteUpdate = async (clientId: string, updateText: string, status?: string) => {
    try {
      const res = await convertedClientService.addWebsiteUpdate(clientId, updateText, status);
      if (res.success) {
        toast('Progress Logged', 'Added daily website progress update', 'success');
        fetchCallerData();
        if (selectedClient?._id === clientId) {
          handleSelectClient(res.client);
        }
      }
    } catch (err: any) {
      toast('Error', err.message, 'error');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading My Client Deals & Payments..." />;
  }

  // Caller Dashboard Metrics
  const totalConvertedClients = clients.length;
  const totalRevenueGenerated = clients.reduce((sum, c) => sum + (c.clientPaidAmount || 0), 0);
  const upcomingMeetingsCount = clients.filter((c) => c.upcomingMeetingDate && new Date(c.upcomingMeetingDate) >= new Date()).length;

  const getWebsiteStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered':
      case 'Website Done':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'Website In Making':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 animate-pulse';
      case 'On Hold':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'Cancelled':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'Website Had To Make':
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-900 to-slate-950 text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-wider bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-500/30">
            Caller Portal • Personal Client Deals
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2">
            My Deals & Payments
          </h2>
          <p className="text-purple-200 text-xs md:text-sm mt-1 max-w-xl">
            Track your client deals, payment statuses, and website progress.
          </p>
        </div>
      </div>

      {/* Top Caller Dashboard KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Converted */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Converted Clients</span>
          <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 block">{totalConvertedClients}</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Your deals</span>
        </div>

        {/* Total Revenue Generated */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Revenue Brought</span>
          <span className="text-xl font-extrabold font-mono text-slate-900 dark:text-white mt-1 block">{formatINR(totalRevenueGenerated)}</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Collected</span>
        </div>

        {/* Upcoming Meetings */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm">
          <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider block">Upcoming Meetings</span>
          <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1 block">{upcomingMeetingsCount}</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Scheduled demos</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your client name, company or phone..."
            className="w-full bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={websiteStatus}
            onChange={(e) => setWebsiteStatus(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
          >
            <option value="">Website Status: All</option>
            <option value="Website Had To Make">Website Had To Make</option>
            <option value="Website In Making">Website In Making</option>
            <option value="Website Done">Website Done</option>
            <option value="Delivered">Delivered</option>
            <option value="On Hold">On Hold</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
          >
            <option value="">Client Payment: All</option>
            <option value="Not Paid">Not Paid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Fully Paid">Fully Paid</option>
          </select>
        </div>
      </div>

      {/* Caller Personal Earnings & Clients Table */}
      <div className="w-full overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <table className="w-full text-left border-collapse min-w-[950px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4 sticky left-0 bg-slate-50 dark:bg-slate-900 z-10">Client / Company</th>
              <th className="py-3.5 px-4">Website Status</th>
              <th className="py-3.5 px-4">Latest Website Update</th>
              <th className="py-3.5 px-4">Next Meeting</th>
              <th className="py-3.5 px-4">Client Payment Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
            {clients.length > 0 ? (
              clients.map((client) => (
                <tr
                  key={client._id}
                  onClick={() => handleSelectClient(client)}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  {/* Client Name & Phone */}
                  <td className="py-4 px-4 sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-100 dark:border-slate-800">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 font-bold flex items-center justify-center text-xs border border-purple-100 dark:border-purple-800 shrink-0">
                        {client.clientName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block text-sm">
                          {client.clientName}
                        </span>
                        {client.company && (
                          <span className="text-[11px] text-slate-500 flex items-center">
                            <Building className="w-3 h-3 mr-1" />
                            {client.company}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Website Status */}
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getWebsiteStatusBadge(
                        client.websiteStatus
                      )}`}
                    >
                      <Globe className="w-3 h-3 mr-1" />
                      {client.websiteStatus}
                    </span>
                  </td>

                  {/* Latest Website Update */}
                  <td className="py-4 px-4 max-w-[200px]">
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 italic line-clamp-2">
                      "{client.latestWebsiteUpdate || 'No website updates yet'}"
                    </p>
                  </td>

                  {/* Next Meeting */}
                  <td className="py-4 px-4">
                    {client.upcomingMeetingDate ? (
                      <span className="font-semibold text-amber-600 dark:text-amber-400 text-[11px] flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1" />
                        {formatDate(client.upcomingMeetingDate)}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">None scheduled</span>
                    )}
                  </td>

                  {/* Client Payment Status */}
                  <td className="py-4 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        client.paymentStatus === 'Fully Paid'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : client.paymentStatus === 'Partially Paid'
                          ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                          : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      }`}
                    >
                      {client.paymentStatus}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleSelectClient(client)}
                      className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors inline-flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Details</span>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-xs text-slate-400 italic font-sans">
                  No assigned converted clients match the current filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Drawer */}
      <ConvertedClientDetailModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        client={selectedClient}
        websiteUpdates={websiteUpdates}
        paymentHistory={paymentHistory}
        onAddWebsiteUpdate={handleAddWebsiteUpdate}
        onAddPayment={async () => {}}
      />
    </div>
  );
};
