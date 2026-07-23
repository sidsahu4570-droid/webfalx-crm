import React, { useState, useEffect } from 'react';
import { convertedClientService } from '../services/convertedClientService';
import { ConvertedClient, WebsiteUpdate, PaymentHistory } from '../types';
import { ConvertedClientTable } from '../components/converted/ConvertedClientTable';
import { ConvertedClientDetailModal } from '../components/converted/ConvertedClientDetailModal';
import { LoadingSpinner } from '../components/common/SkeletonLoader';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { DollarSign, Search, Filter, CreditCard } from 'lucide-react';

export const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<ConvertedClient[]>([]);
  const [loading, setLoading] = useState(true);

  const [paymentStatus, setPaymentStatus] = useState('');
  const [search, setSearch] = useState('');

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ConvertedClient | null>(null);
  const [websiteUpdates, setWebsiteUpdates] = useState<WebsiteUpdate[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);

  const fetchPaymentsData = async () => {
    try {
      const res = await convertedClientService.getClients({
        paymentStatus: paymentStatus || undefined,
        search: search || undefined,
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
    fetchPaymentsData();
  }, [paymentStatus, search]);

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

  const handleAddPayment = async (clientId: string, data: any) => {
    try {
      const res = await convertedClientService.addPaymentRecord(clientId, data);
      if (res.success) {
        toast('Payment Logged', 'Transaction saved successfully', 'success');
        fetchPaymentsData();
        if (selectedClient?._id === clientId) {
          handleSelectClient(res.client);
        }
      }
    } catch (err: any) {
      toast('Error', err.message, 'error');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading Payment & Expense Management..." />;
  }

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-xl">
        <span className="text-[10px] uppercase font-extrabold tracking-wider bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30">
          Financials • Payment & Expense Tracking
        </span>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2">
          Payments & Expenses Ledger
        </h2>
        <p className="text-emerald-200 text-xs md:text-sm mt-1 max-w-xl">
          Record client payments, track expenses, and view transaction history in INR ₹.
        </p>
      </div>

      {/* Filter Bar */}
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
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
          >
            <option value="">Client Payment: All</option>
            <option value="Not Paid">Not Paid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Fully Paid">Fully Paid</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Converted Clients Table */}
      <ConvertedClientTable
        clients={clients}
        onSelectClient={handleSelectClient}
        onEditClient={handleSelectClient}
        onAddPayment={handleSelectClient}
        isAdmin={isAdmin}
      />

      {/* Detail Drawer */}
      <ConvertedClientDetailModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        client={selectedClient}
        websiteUpdates={websiteUpdates}
        paymentHistory={paymentHistory}
        onAddWebsiteUpdate={async () => {}}
        onAddPayment={handleAddPayment}
      />
    </div>
  );
};
