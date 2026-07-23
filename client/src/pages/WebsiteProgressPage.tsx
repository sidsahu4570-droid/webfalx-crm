import React, { useState, useEffect } from 'react';
import { convertedClientService } from '../services/convertedClientService';
import { ConvertedClient, WebsiteUpdate, WebsiteStatus } from '../types';
import { formatDate, formatDateTime, formatTimeAgo } from '../utils/formatters';
import { LoadingSpinner } from '../components/common/SkeletonLoader';
import { Modal } from '../components/common/Modal';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import {
  Globe,
  Search,
  Filter,
  Calendar,
  Clock,
  Send,
  Building,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  PauseCircle,
  XCircle,
  Plus
} from 'lucide-react';

export const WebsiteProgressPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { socket } = useSocket();

  const [clients, setClients] = useState<ConvertedClient[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  // Update Modal State
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ConvertedClient | null>(null);
  const [updateText, setUpdateText] = useState('');
  const [newStatus, setNewStatus] = useState<WebsiteStatus | ''>('');
  const [submittingUpdate, setSubmittingUpdate] = useState(false);

  // Client Detail Timeline Modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [clientUpdates, setClientUpdates] = useState<WebsiteUpdate[]>([]);

  const fetchWebsiteData = async () => {
    try {
      const res = await convertedClientService.getClients({
        websiteStatus: statusFilter || undefined,
        search: search || undefined,
        projectType: 'website',
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
    fetchWebsiteData();
  }, [statusFilter, search]);

  // Realtime Socket
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchWebsiteData();

    socket.on('website_update_added', handleUpdate);
    socket.on('client_updated', handleUpdate);

    return () => {
      socket.off('website_update_added', handleUpdate);
      socket.off('client_updated', handleUpdate);
    };
  }, [socket]);

  const handleOpenUpdateModal = (client: ConvertedClient) => {
    setSelectedClient(client);
    setUpdateText('');
    setNewStatus(client.websiteStatus);
    setUpdateModalOpen(true);
  };

  const handleOpenHistory = async (client: ConvertedClient) => {
    setSelectedClient(client);
    setHistoryModalOpen(true);
    try {
      const res = await convertedClientService.getClientById(client._id);
      if (res.success) {
        setClientUpdates(res.websiteUpdates);
      }
    } catch (err: any) {
      console.error('[Error]', err);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !updateText.trim()) return;

    setSubmittingUpdate(true);
    try {
      const res = await convertedClientService.addWebsiteUpdate(
        selectedClient._id,
        updateText.trim(),
        newStatus || undefined
      );

      if (res.success) {
        toast('Progress Logged', 'Website progress update posted successfully', 'success');
        setUpdateModalOpen(false);
        fetchWebsiteData();
      }
    } catch (err: any) {
      toast('Error', err.message, 'error');
    } finally {
      setSubmittingUpdate(false);
    }
  };

  const getWebsiteStatusBadge = (status: WebsiteStatus) => {
    switch (status) {
      case 'Delivered':
      case 'Website Done':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'Website In Making':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 animate-pulse';
      case 'On Hold':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'Website Had To Make':
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading Website Progress Tracking System..." />;
  }

  // Summary Metrics
  const totalProjects = clients.length;
  const inMakingCount = clients.filter((c) => c.websiteStatus === 'Website In Making').length;
  const deliveredCount = clients.filter((c) => ['Delivered', 'Website Done'].includes(c.websiteStatus)).length;
  const hadToMakeCount = clients.filter((c) => c.websiteStatus === 'Website Had To Make').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-wider bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-500/30">
            Development Portal • Website Progress Tracker
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2">
            Website Development & Delivery Timeline
          </h2>
          <p className="text-blue-200 text-xs md:text-sm mt-1 max-w-xl">
            Track daily website progress updates, delivery dates, client requirements, and development status.
          </p>
        </div>
      </div>

      {/* Website KPI Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Projects</span>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block">{totalProjects}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Converted client sites</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">In Development</span>
          <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 block">{inMakingCount}</span>
          <span className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5 block">Currently being built</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Delivered / Done</span>
          <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">{deliveredCount}</span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 block">Completed projects</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Had To Make</span>
          <span className="text-2xl font-extrabold text-slate-700 dark:text-slate-300 mt-1 block">{hadToMakeCount}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Pending initiation</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search client name, company or website status..."
            className="w-full bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
        >
          <option value="">All Development Statuses</option>
          <option value="Website Had To Make">Website Had To Make</option>
          <option value="Website In Making">Website In Making</option>
          <option value="Website Done">Website Done</option>
          <option value="Delivered">Delivered</option>
          <option value="On Hold">On Hold</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Website Project Cards Grid */}
      {clients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {clients.map((item) => (
            <div
              key={item._id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all space-y-3.5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header info */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 font-bold flex items-center justify-center text-sm border border-blue-100 dark:border-blue-800">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {item.clientName}
                      </h4>
                      {item.company && (
                        <span className="text-xs text-slate-500 flex items-center mt-0.5">
                          <Building className="w-3 h-3 mr-1" />
                          {item.company}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 ${getWebsiteStatusBadge(
                      item.websiteStatus
                    )}`}
                  >
                    {item.websiteStatus}
                  </span>
                </div>

                {/* Delivery Date & Caller */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Target Delivery:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {item.websiteDeliveryDate ? formatDate(item.websiteDeliveryDate) : 'Not Specified'}
                    </span>
                  </div>
                  {user?.role === 'admin' && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                      <span>Caller:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{item.callerName}</span>
                    </div>
                  )}
                </div>

                {/* Latest Update Note */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Latest Progress Update
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 italic bg-blue-50/40 dark:bg-blue-950/20 p-3 rounded-2xl border border-blue-100 dark:border-blue-900/40 line-clamp-3">
                    "{item.latestWebsiteUpdate || 'No updates logged yet'}"
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenHistory(item)}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center"
                >
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  <span>View Timeline</span>
                </button>

                <button
                  onClick={() => handleOpenUpdateModal(item)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-md flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Daily Update</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-3">
          <Globe className="w-10 h-10 text-blue-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No Website Projects Found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No website progress records match the selected status filter.
          </p>
        </div>
      )}

      {/* Add Daily Update Modal */}
      {selectedClient && (
        <Modal
          isOpen={updateModalOpen}
          onClose={() => setUpdateModalOpen(false)}
          title={`Log Website Progress: ${selectedClient.clientName}`}
          subtitle="Record what work was done today and update project status"
        >
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Progress Description / Notes *
              </label>
              <textarea
                value={updateText}
                onChange={(e) => setUpdateText(e.target.value)}
                rows={3}
                required
                placeholder="What was completed today? (e.g. Design wireframes created, client sent content & logo, website tested on mobile...)"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Website Development Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as WebsiteStatus)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white"
              >
                <option value="Website Had To Make">Website Had To Make</option>
                <option value="Website In Making">Website In Making</option>
                <option value="Website Done">Website Done</option>
                <option value="Delivered">Delivered</option>
                <option value="On Hold">On Hold</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setUpdateModalOpen(false)}
                className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold px-4 py-2 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingUpdate || !updateText.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md flex items-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submittingUpdate ? 'Saving Update...' : 'Submit Progress Update'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* History Timeline Modal */}
      {selectedClient && (
        <Modal
          isOpen={historyModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          title={`Website Update Timeline: ${selectedClient.clientName}`}
          subtitle="Full daily progress history & status changes"
        >
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {clientUpdates.length > 0 ? (
              clientUpdates.map((upd) => (
                <div
                  key={upd._id}
                  className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-900 dark:text-white">{upd.updatedBy}</span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {formatDateTime(upd.createdAt)} ({formatTimeAgo(upd.createdAt)})
                    </span>
                  </div>
                  <span className="inline-block bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-500/20">
                    {upd.websiteStatus}
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 italic">"{upd.updateText}"</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-6">
                No progress updates logged for this project yet.
              </p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
