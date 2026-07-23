import React, { useState, useEffect } from 'react';
import { leadService } from '../services/leadService';
import { userService } from '../services/userService';
import { convertedClientService } from '../services/convertedClientService';
import { Lead, User, LeadStatus, City } from '../types';
import { LeadTable } from '../components/leads/LeadTable';
import { LeadModal } from '../components/leads/LeadModal';
import { LeadDetailModal } from '../components/leads/LeadDetailModal';
import { ConvertedClientModal } from '../components/converted/ConvertedClientModal';
import { ExcelImportModal } from '../components/leads/ExcelImportModal';
import { CityFilterDropdown } from '../components/leads/CityFilterDropdown';
import { LoadingSpinner } from '../components/common/SkeletonLoader';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { categoryService } from '../services/categoryService';
import { cityService } from '../services/cityService';
import { Sparkles, Search, Upload, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const NewLeadsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [callers, setCallers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedCallerId, setSelectedCallerId] = useState('');
  const [categoryIdFilter, setCategoryIdFilter] = useState('All');
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCityIds, setSelectedCityIds] = useState<string[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  useEffect(() => {
    categoryService.getCategories().then((res) => {
      if (res.success) {
        setCategories(res.categories);
      }
    });
    cityService.getCities().then((res) => {
      if (res.success) {
        setCities(res.cities);
      }
    });
  }, []);

  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [excelImportModalOpen, setExcelImportModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Convert Lead → Converted Client flow
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [converting, setConverting] = useState(false);

  const fetchNewLeads = async () => {
    try {
      const [leadsRes, callersRes] = await Promise.all([
        leadService.getLeads({
          isNewLead: true, // Only unworked imported leads!
          search: search || undefined,
          status: statusFilter !== 'All' ? statusFilter : undefined,
          callerId: selectedCallerId || undefined,
          categoryId: categoryIdFilter !== 'All' ? categoryIdFilter : undefined,
          cityId: selectedCityIds.length > 0 ? selectedCityIds.join(',') : undefined
        }),
        user?.role === 'admin' ? userService.getUsers() : Promise.resolve({ success: true, users: [] })
      ]);

      if (leadsRes.success) setLeads(leadsRes.leads);
      if (callersRes.success && callersRes.users) {
        setCallers(callersRes.users.filter((u) => u.role === 'caller'));
      }
    } catch (err: any) {
      toast('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewLeads();
  }, [search, statusFilter, selectedCallerId, categoryIdFilter, selectedCityIds]);

  // Realtime Socket
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchNewLeads();

    socket.on('lead_created', handleUpdate);
    socket.on('lead_updated', handleUpdate);
    socket.on('leads_imported', handleUpdate);

    return () => {
      socket.off('lead_created', handleUpdate);
      socket.off('lead_updated', handleUpdate);
      socket.off('leads_imported', handleUpdate);
    };
  }, [socket]);

  const handleLeadUpdateSubmit = async (data: any) => {
    if (!editingLead) return;
    try {
      const res = await leadService.updateLead(editingLead._id, data);
      if (res.success) {
        toast('Lead Updated', 'Lead updated and moved to active Leads', 'success');
        setEditModalOpen(false);
        fetchNewLeads();
      }
    } catch (err: any) {
      toast('Update Error', err.message, 'error');
    }
  };

  const handleAddNote = async (
    leadId: string,
    content: string,
    options?: { status?: LeadStatus; nextFollowUpDate?: string; isWhatsApp?: boolean }
  ) => {
    try {
      const res = await leadService.addNote(leadId, content, options);
      if (res.success) {
        toast('Conversation Logged', 'Update saved! Lead automatically moved to active Leads.', 'success');
        fetchNewLeads();
      }
    } catch (err: any) {
      toast('Error', err.message, 'error');
    }
  };

  const handleUpdateStatus = async (leadId: string, status: LeadStatus) => {
    try {
      const res = await leadService.updateLead(leadId, { status });
      if (res.success) {
        toast('Status Changed', `Status updated to ${status}. Lead moved to active Leads.`, 'success');
        fetchNewLeads();
      }
    } catch (err: any) {
      toast('Error', err.message, 'error');
    }
  };

  const handleCompleteFollowUp = async (leadId: string, nextDate?: string) => {
    try {
      const res = await leadService.completeFollowUp(leadId, nextDate);
      if (res.success) {
        toast('Follow-up Completed', 'Lead moved to active Leads.', 'success');
        fetchNewLeads();
      }
    } catch (err: any) {
      toast('Error', err.message, 'error');
    }
  };

  const handleConvertLead = (lead: Lead) => {
    setLeadToConvert(lead);
    setDetailLead(null);
    setConvertModalOpen(true);
  };

  const handleCreateFromLead = async (data: any) => {
    setConverting(true);
    try {
      const res = await convertedClientService.createClient(data);
      if (res.success) {
        toast(
          'Client Converted! 🎉',
          `${leadToConvert?.name} submitted for admin approval.`,
          'success'
        );
        setConvertModalOpen(false);
        setLeadToConvert(null);
        fetchNewLeads();
      }
    } catch (err: any) {
      toast('Conversion Error', err.response?.data?.message || err.message, 'error');
    } finally {
      setConverting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading New Unworked Leads Queue..." />;
  }

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase font-extrabold tracking-wider bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full border border-amber-500/30 flex items-center">
              <Sparkles className="w-3 h-3 mr-1" />
              Unworked Imported Leads Queue
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2">
            New Leads Queue ({leads.length})
          </h2>
          <p className="text-amber-200/90 text-xs md:text-sm mt-1 max-w-xl">
            Imported leads waiting for first contact. Updating or adding a note to any lead automatically moves it to your active Leads pipeline.
          </p>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate('/admin/import-history')}
              className="flex items-center space-x-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3.5 py-2.5 rounded-2xl border border-white/20 transition-all shrink-0"
            >
              <History className="w-4 h-4" />
              <span>Import History</span>
            </button>

            <button
              onClick={() => setExcelImportModalOpen(true)}
              className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold px-4 py-2.5 rounded-2xl shadow-lg transition-all shrink-0"
            >
              <Upload className="w-4 h-4" />
              <span>Import Excel / CSV</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search new lead name, company, phone or email..."
            className="w-full bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CityFilterDropdown
            selectedCityIds={selectedCityIds}
            setSelectedCityIds={setSelectedCityIds}
            cities={cities}
          />

          {isAdmin && (
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
          )}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
          >
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="Interested">Interested</option>
            <option value="Follow-up">Follow-up</option>
            <option value="Meeting Scheduled">Meeting Scheduled</option>
          </select>

          {categories.length > 0 && (
            <select
              value={categoryIdFilter}
              onChange={(e) => setCategoryIdFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Leads Table */}
      <LeadTable
        leads={leads}
        onSelectLead={(l) => setDetailLead(l)}
        onEditLead={(l) => {
          setEditingLead(l);
          setEditModalOpen(true);
        }}
        onDeleteLead={async (l) => {
          await leadService.deleteLead(l._id);
          fetchNewLeads();
        }}
        onQuickNote={(l) => {
          setDetailLead(l);
        }}
        onCompleteFollowUp={(l) => handleCompleteFollowUp(l._id)}
        showCallerColumn={isAdmin}
      />

      {/* Edit Lead Modal */}
      {editingLead && (
        <LeadModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSubmit={handleLeadUpdateSubmit}
          lead={editingLead}
          callers={callers}
        />
      )}

      {/* Lead Detail Drawer */}
      {detailLead && (
        <LeadDetailModal
          isOpen={!!detailLead}
          onClose={() => setDetailLead(null)}
          lead={detailLead}
          onAddNote={handleAddNote}
          onUpdateStatus={handleUpdateStatus}
          onCompleteFollowUp={handleCompleteFollowUp}
          onConvertLead={handleConvertLead}
        />
      )}

      {/* Admin Excel Lead Import Modal */}
      {isAdmin && (
        <ExcelImportModal
          isOpen={excelImportModalOpen}
          onClose={() => setExcelImportModalOpen(false)}
          callers={callers}
          onImportComplete={fetchNewLeads}
        />
      )}

      {/* Convert Lead → Converted Client Modal */}
      {leadToConvert && (
        <ConvertedClientModal
          isOpen={convertModalOpen}
          onClose={() => { setConvertModalOpen(false); setLeadToConvert(null); }}
          onSubmit={handleCreateFromLead}
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
