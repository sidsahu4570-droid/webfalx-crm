import React, { useState, useEffect } from 'react';
import { convertedClientService } from '../services/convertedClientService';
import { ConvertedClient, WebsiteUpdate, PaymentHistory } from '../types';
import { ConvertedClientTable } from '../components/converted/ConvertedClientTable';
import { ConvertedClientModal } from '../components/converted/ConvertedClientModal';
import { ConvertedClientDetailModal } from '../components/converted/ConvertedClientDetailModal';
import { LoadingSpinner } from '../components/common/SkeletonLoader';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import { Building, Plus, Search, Filter } from 'lucide-react';

export const CallerConvertedClientsPage: React.FC = () => {
  const { toast } = useToast();
  const { socket } = useSocket();
  const [clients, setClients] = useState<ConvertedClient[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [websiteStatus, setWebsiteStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ConvertedClient | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Detail Drawer data
  const [websiteUpdates, setWebsiteUpdates] = useState<WebsiteUpdate[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);

  const fetchClients = async () => {
    try {
      const res = await convertedClientService.getClients({
        search: search || undefined,
        websiteStatus: websiteStatus || undefined,
        paymentStatus: paymentStatus || undefined
      });
      if (res.success) setClients(res.clients);
    } catch (err: any) {
      toast('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [search, websiteStatus, paymentStatus]);

  // Socket.io Real-time Event Listener
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
        toast('Client Record Saved', 'Converted client data updated successfully', 'success');
        setCreateModalOpen(false);
        fetchClients();
      }
    } catch (err: any) {
      toast('Error', err.response?.data?.message || err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddWebsiteUpdate = async (clientId: string, updateText: string, status?: string) => {
    try {
      const res = await convertedClientService.addWebsiteUpdate(clientId, updateText, status);
      if (res.success) {
        toast('Website Progress Logged', 'Added daily website progress update', 'success');
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
        toast('Payment Logged', 'Transaction recorded successfully', 'success');
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
    return <LoadingSpinner text="Loading your converted clients..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-wider bg-white/10 px-3 py-1 rounded-full border border-white/20">
            Caller Workspace • Converted Clients
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2">
            Your Converted Clients & Deals
          </h2>
          <p className="text-indigo-200 text-xs md:text-sm mt-1 max-w-xl">
            Track client deals, website development status, and payment receipts.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedClient(null);
            setCreateModalOpen(true);
          }}
          className="flex items-center space-x-2 bg-white text-indigo-900 hover:bg-indigo-50 text-xs font-bold px-4 py-3 rounded-2xl shadow-lg transition-all shrink-0"
        >
          <Plus className="w-4 h-4 text-indigo-600" />
          <span>Add Converted Client</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search client name, company or phone..."
            className="w-full bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
          >
            <option value="">All Payment Statuses</option>
            <option value="Not Paid">Not Paid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Fully Paid">Fully Paid</option>
            <option value="Overdue">Overdue</option>
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
      />

      {/* Create / Edit Modal */}
      <ConvertedClientModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        initialClient={selectedClient}
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
      />
    </div>
  );
};
