import React, { useState, useEffect } from 'react';
import { convertedClientService } from '../services/convertedClientService';
import { userService } from '../services/userService';
import { ConvertedClient, WebsiteUpdate, PaymentHistory, User } from '../types';
import { ConvertedClientTable } from '../components/converted/ConvertedClientTable';
import { ConvertedClientModal } from '../components/converted/ConvertedClientModal';
import { ConvertedClientDetailModal } from '../components/converted/ConvertedClientDetailModal';
import { LoadingSpinner } from '../components/common/SkeletonLoader';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import { Building, Plus, Search, Filter, ShieldCheck, Download } from 'lucide-react';

export const AdminConvertedClientsPage: React.FC = () => {
  const { toast } = useToast();
  const { socket } = useSocket();
  const [clients, setClients] = useState<ConvertedClient[]>([]);
  const [callers, setCallers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCallerId, setSelectedCallerId] = useState('');
  const [websiteStatus, setWebsiteStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [approvalStatus, setApprovalStatus] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ConvertedClient | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Drawer data
  const [websiteUpdates, setWebsiteUpdates] = useState<WebsiteUpdate[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);

  const fetchClients = async () => {
    try {
      const [clientsRes, usersRes] = await Promise.all([
        convertedClientService.getClients({
          callerId: selectedCallerId || undefined,
          websiteStatus: websiteStatus || undefined,
          paymentStatus: paymentStatus || undefined,
          approvalStatus: approvalStatus || undefined,
          search: search || undefined
        }),
        userService.getUsers()
      ]);

      if (clientsRes.success) setClients(clientsRes.clients);
      if (usersRes.success) setCallers(usersRes.users.filter((u) => u.role === 'caller'));
    } catch (err: any) {
      toast('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [selectedCallerId, websiteStatus, paymentStatus, approvalStatus, search]);

  // Socket Listener
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchClients();

    socket.on('client_created', handleUpdate);
    socket.on('client_updated', handleUpdate);
    socket.on('website_update_added', handleUpdate);
    socket.on('payment_added', handleUpdate);

    return () => {
      socket.off('client_created', handleUpdate);
      socket.off('client_updated', handleUpdate);
      socket.off('website_update_added', handleUpdate);
      socket.off('payment_added', handleUpdate);
    };
  }, [socket]);

  const handleSelectClient = async (client: ConvertedClient) => {
    setSelectedClient(client);
    setDetailModalOpen(true);
    try {
      const res = await convertedClientService.getClientById(client._id);
      if (res.success) {
        setWebsiteUpdates(res.websiteUpdates);
        setPaymentHistory(res.paymentHistory);
      }
    } catch (err: any) {
      console.error('[Client Detail Error]', err);
    }
  };

  const handleCreateOrUpdate = async (data: Partial<ConvertedClient>) => {
    setSubmitting(true);
    try {
      let res;
      if (selectedClient && createModalOpen) {
        res = await convertedClientService.updateClient(selectedClient._id, data);
      } else {
        res = await convertedClientService.createClient(data);
      }

      if (res.success) {
        toast('Client Saved', 'Client record saved successfully', 'success');
        setCreateModalOpen(false);
        fetchClients();
      }
    } catch (err: any) {
      toast('Error', err.response?.data?.message || err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveClient = async (client: ConvertedClient, status: 'Approved' | 'Rejected') => {
    try {
      const res = await convertedClientService.approveClient(client._id, status);
      if (res.success) {
        toast('Approval Status Updated', `Client marked as ${status}`, 'success');
        fetchClients();
        if (selectedClient?._id === client._id) {
          handleSelectClient(res.client);
        }
      }
    } catch (err: any) {
      toast('Approval Error', err.message, 'error');
    }
  };

  const handleToggleLock = async (clientId: string, fieldName: string, isLocked: boolean) => {
    try {
      const res = await convertedClientService.toggleLock(clientId, fieldName, isLocked);
      if (res.success) {
        toast('Field Lock Updated', `Field '${fieldName}' ${isLocked ? 'locked' : 'unlocked'}`, 'success');
        fetchClients();
        if (selectedClient?._id === clientId) {
          handleSelectClient(res.client);
        }
      }
    } catch (err: any) {
      toast('Lock Error', err.message, 'error');
    }
  };

  const handleDeleteClient = async (client: ConvertedClient) => {
    const reason = window.prompt(`Move client '${client.clientName}' to Trash Archive?\nState deletion reason (optional):`);
    if (reason === null) return;

    try {
      const res = await convertedClientService.deleteClient(client._id, reason);
      if (res.success) {
        toast('Client Soft Deleted', res.message, 'info');
        fetchClients();
        if (selectedClient?._id === client._id) {
          setDetailModalOpen(false);
          setSelectedClient(null);
        }
      }
    } catch (err: any) {
      toast('Delete Error', err.message, 'error');
    }
  };

  const handleAddWebsiteUpdate = async (clientId: string, updateText: string, status?: string) => {
    try {
      const res = await convertedClientService.addWebsiteUpdate(clientId, updateText, status);
      if (res.success) {
        toast('Website Update Logged', 'Website progress note added', 'success');
        fetchClients();
        if (selectedClient?._id === clientId) {
          handleSelectClient(res.client);
        }
      }
    } catch (err: any) {
      toast('Error', err.message, 'error');
    }
  };

  const handleAddPayment = async (clientId: string, data: any) => {
    try {
      const res = await convertedClientService.addPaymentRecord(clientId, data);
      if (res.success) {
        toast('Payment Recorded', 'Transaction logged into payment history', 'success');
        fetchClients();
        if (selectedClient?._id === clientId) {
          handleSelectClient(res.client);
        }
      }
    } catch (err: any) {
      toast('Error', err.message, 'error');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading Admin Converted Clients Command Center..." />;
  }

  const pendingApprovalsCount = clients.filter((c) => c.approvalStatus === 'Pending Approval').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-wider bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30">
            Admin Portal • Converted Client Manager
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2">
            Team Converted Clients & Deals
          </h2>
          <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-xl">
            Approve caller conversion requests, control field locks, review website progress, and track net profits.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {pendingApprovalsCount > 0 && (
            <span className="bg-amber-500 text-slate-950 font-extrabold text-xs px-3 py-2 rounded-2xl animate-bounce">
              ⚠️ {pendingApprovalsCount} Approvals Pending!
            </span>
          )}

          <button
            onClick={() => {
              setSelectedClient(null);
              setCreateModalOpen(true);
            }}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-lg shadow-indigo-600/30 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Client Override</span>
          </button>
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
            placeholder="Search client name, company, phone, email or caller..."
            className="w-full bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCallerId}
            onChange={(e) => setSelectedCallerId(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
          >
            <option value="">All Callers</option>
            {callers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.email})
              </option>
            ))}
          </select>

          <select
            value={approvalStatus}
            onChange={(e) => setApprovalStatus(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200"
          >
            <option value="">All Approvals</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select
            value={websiteStatus}
            onChange={(e) => setWebsiteStatus(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
          >
            <option value="">All Website Statuses</option>
            <option value="Website Had To Make">Website Had To Make</option>
            <option value="Website In Making">Website In Making</option>
            <option value="Website Done">Website Done</option>
            <option value="Delivered">Delivered</option>
            <option value="On Hold">On Hold</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Converted Client Table */}
      <ConvertedClientTable
        clients={clients}
        onSelectClient={handleSelectClient}
        onEditClient={(client) => {
          setSelectedClient(client);
          setCreateModalOpen(true);
        }}
        onAddWebsiteUpdate={(client) => handleSelectClient(client)}
        onAddPayment={(client) => handleSelectClient(client)}
        onDeleteClient={handleDeleteClient}
        onApproveClient={handleApproveClient}
        isAdmin={true}
      />

      {/* Modal */}
      <ConvertedClientModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        initialClient={selectedClient}
        isAdmin={true}
        callers={callers}
        loading={submitting}
      />

      {/* Detail Drawer */}
      <ConvertedClientDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        client={selectedClient}
        websiteUpdates={websiteUpdates}
        paymentHistory={paymentHistory}
        onAddWebsiteUpdate={handleAddWebsiteUpdate}
        onAddPayment={handleAddPayment}
        onToggleLock={handleToggleLock}
        onApproveClient={async (clientId, status) => {
          const client = clients.find((c) => c._id === clientId);
          if (client) await handleApproveClient(client, status);
        }}
      />
    </div>
  );
};
