import React, { useState, useEffect, useCallback } from 'react';
import { leadService } from '../services/leadService';
import { userService } from '../services/userService';
import { categoryService } from '../services/categoryService';
import { convertedClientService } from '../services/convertedClientService';
import { Lead, FilterParams, User, City } from '../types';
import { SearchBar } from '../components/leads/SearchBar';
import { FilterDropdown } from '../components/leads/FilterDropdown';
import { CityFilterDropdown } from '../components/leads/CityFilterDropdown';
import { LeadTable } from '../components/leads/LeadTable';
import { LeadCard } from '../components/leads/LeadCard';
import { LeadModal } from '../components/leads/LeadModal';
import { LeadDetailModal } from '../components/leads/LeadDetailModal';
import { ConvertedClientModal } from '../components/converted/ConvertedClientModal';
import { ImportCSVModal } from '../components/leads/ImportCSVModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { SkeletonRow } from '../components/common/SkeletonLoader';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { cityService } from '../services/cityService';
import { exportLeadsToCSV } from '../utils/csv';
import {
  Plus,
  Download,
  Upload,
  LayoutList,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  MessageSquare
} from 'lucide-react';

export const LeadsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Filters & Search
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [priority, setPriority] = useState('All');
  const [dueOnly, setDueOnly] = useState(false);
  const [callerId, setCallerId] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);

  // Category filter states
  const [categoryId, setCategoryId] = useState('All');
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCityIds, setSelectedCityIds] = useState<string[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  // Modals state
  const [callers, setCallers] = useState<User[]>([]);
  const [addEditModalOpen, setAddEditModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Quick Note inline popup state
  const [quickNoteLead, setQuickNoteLead] = useState<Lead | null>(null);
  const [quickNoteText, setQuickNoteText] = useState('');

  // Convert Lead -> Converted Client flow
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [converting, setConverting] = useState(false);

  // Import category list
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

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params: FilterParams = {
        isNewLead: false, // Strict segregation: only fetch active worked leads
        search,
        status: status !== 'All' ? status : undefined,
        priority: priority !== 'All' ? priority : undefined,
        dueFollowUp: dueOnly ? true : undefined,
        callerId: user?.role === 'admin' && callerId ? callerId : undefined,
        sortBy,
        page,
        limit: 15,
        categoryId: categoryId !== 'All' ? categoryId : undefined,
        cityId: selectedCityIds.length > 0 ? selectedCityIds.join(',') : undefined
      };

      const res = await leadService.getLeads(params);
      if (res.success && res.leads) {
        setLeads(res.leads);
        setTotalPages(res.pagination.pages);
        setTotalLeads(res.pagination.total);
      }
    } catch (err: any) {
      toast('Error Loading Leads', err.message || 'Failed to fetch prospects', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, status, priority, dueOnly, callerId, sortBy, page, user, toast, categoryId, selectedCityIds]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    if (user?.role === 'admin') {
      userService.getUsers().then((res) => {
        if (res.success) setCallers(res.users);
      });
    }
  }, [user]);

  const handleSaveLead = async (formData: any) => {
    setSaving(true);
    try {
      if (editingLead) {
        const res = await leadService.updateLead(editingLead._id, formData);
        if (res.success) {
          toast('Prospect Updated', `Successfully saved changes for ${res.lead.name}`, 'success');
          fetchLeads();
        }
      } else {
        const res = await leadService.createLead(formData);
        if (res.success) {
          toast('Prospect Created', `Successfully added ${res.lead.name}`, 'success');
          fetchLeads();
        }
      }
    } catch (err: any) {
      toast('Save Failed', err.response?.data?.message || err.message, 'error');
    } finally {
      setSaving(false);
      setEditingLead(null);
    }
  };

  const handleDeleteLead = async () => {
    if (!leadToDelete) return;
    setDeleting(true);
    try {
      const res = await leadService.deleteLead(leadToDelete._id);
      if (res.success) {
        toast('Prospect Deleted', `Removed ${leadToDelete.name} from database`, 'success');
        setDeleteConfirmOpen(false);
        setLeadToDelete(null);
        fetchLeads();
      }
    } catch (err: any) {
      toast('Delete Failed', err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleAddNote = async (
    leadId: string,
    content: string,
    options?: { status?: any; nextFollowUpDate?: string; isWhatsApp?: boolean }
  ) => {
    try {
      const res = await leadService.addNote(leadId, content, options);
      if (res.success) {
        toast('Conversation Update Logged', 'Saved conversation details to prospect timeline', 'success');
        fetchLeads();
        if (detailLead?._id === leadId) setDetailLead(res.lead);
      }
    } catch (err: any) {
      toast('Error', err.message, 'error');
    }
  };

  const handleUpdateStatus = async (leadId: string, newStatus: any) => {
    try {
      const res = await leadService.updateLead(leadId, { status: newStatus });
      if (res.success) {
        toast('Status Changed', `Lead status updated to ${newStatus}`, 'success');
        fetchLeads();
        if (detailLead?._id === leadId) setDetailLead(res.lead);
      }
    } catch (err: any) {
      toast('Error', err.message, 'error');
    }
  };

  const handleCompleteFollowUp = async (leadId: string, nextDate?: string) => {
    try {
      const res = await leadService.completeFollowUp(leadId, nextDate);
      if (res.success) {
        toast('Follow-up Complete', 'Marked follow-up as completed', 'success');
        fetchLeads();
        if (detailLead?._id === leadId) setDetailLead(res.lead);
      }
    } catch (err: any) {
      toast('Error', err.message, 'error');
    }
  };

  const handleBulkImport = async (importedLeads: any[]) => {
    try {
      const res = await leadService.importLeads(importedLeads);
      if (res.success) {
        toast('CSV Import Complete', `Imported ${res.count} prospects into pipeline`, 'success');
        fetchLeads();
      }
    } catch (err: any) {
      toast('Import Failed', err.message, 'error');
    }
  };

  const handleExportCSV = () => {
    if (leads.length === 0) {
      toast('No Data', 'No prospects available to export', 'info');
      return;
    }
    exportLeadsToCSV(leads, `prospects_export_${new Date().toISOString().substring(0, 10)}.csv`);
    toast('CSV Exported', 'Downloaded prospects spreadsheet', 'success');
  };

  // Handle triggering conversion from LeadDetailModal
  const handleConvertLead = (lead: Lead) => {
    setLeadToConvert(lead);
    setDetailLead(null); // Close lead detail modal
    setConvertModalOpen(true);
  };

  // Handle saving the converted client (with leadId reference)
  const handleCreateFromLead = async (data: any) => {
    setConverting(true);
    try {
      const res = await convertedClientService.createClient(data);
      if (res.success) {
        toast(
          'Client Converted! 🎉',
          `${leadToConvert?.name} submitted for admin approval. You'll be notified once approved.`,
          'success'
        );
        setConvertModalOpen(false);
        setLeadToConvert(null);
        fetchLeads();
      }
    } catch (err: any) {
      toast('Conversion Error', err.response?.data?.message || err.message, 'error');
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Main Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Prospect Pipeline & Lead Queue
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your leads, log call notes, and schedule follow-ups ({totalLeads} total prospects)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Table View"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Import CSV */}
          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center space-x-1.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 text-xs font-semibold px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Import CSV</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 text-xs font-semibold px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Add Prospect */}
          <button
            onClick={() => {
              setEditingLead(null);
              setAddEditModalOpen(true);
            }}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-md shadow-indigo-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Prospect</span>
          </button>
        </div>
      </div>

      {/* Search Bar & Filter Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <SearchBar value={search} onChange={(val) => { setSearch(val); setPage(1); }} />
        <div className="flex flex-wrap items-center gap-3">
          <CityFilterDropdown
            selectedCityIds={selectedCityIds}
            setSelectedCityIds={(ids) => { setSelectedCityIds(ids); setPage(1); }}
            cities={cities}
          />
          <FilterDropdown
            status={status}
            setStatus={(s) => { setStatus(s); setPage(1); }}
            priority={priority}
            setPriority={(p) => { setPriority(p); setPage(1); }}
            dueOnly={dueOnly}
            setDueOnly={(d) => { setDueOnly(d); setPage(1); }}
            callerId={callerId}
            setCallerId={(c) => { setCallerId(c); setPage(1); }}
            callers={callers}
            sortBy={sortBy}
            setSortBy={(sort) => { setSortBy(sort); setPage(1); }}
            categoryId={categoryId}
            setCategoryId={(cat) => { setCategoryId(cat); setPage(1); }}
            categories={categories}
            onReset={() => {
              setStatus('All');
              setPriority('All');
              setDueOnly(false);
              setCallerId('');
              setCategoryId('All');
              setSelectedCityIds([]);
              setSearch('');
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="space-y-3">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : leads.length === 0 ? (
        <EmptyState
          title="No Prospects Found"
          description="Try broadening your search term or resetting your active filters."
          actionText="Add New Prospect"
          onAction={() => setAddEditModalOpen(true)}
        />
      ) : viewMode === 'table' ? (
        <LeadTable
          leads={leads}
          onSelectLead={(l) => setDetailLead(l)}
          onEditLead={(l) => { setEditingLead(l); setAddEditModalOpen(true); }}
          onDeleteLead={(l) => { setLeadToDelete(l); setDeleteConfirmOpen(true); }}
          onQuickNote={(l) => { setQuickNoteLead(l); setQuickNoteText(''); }}
          onCompleteFollowUp={(l) => handleCompleteFollowUp(l._id)}
          showCallerColumn={user?.role === 'admin'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {leads.map((l) => (
            <LeadCard
              key={l._id}
              lead={l}
              onSelectLead={(lead) => setDetailLead(lead)}
              onEditLead={(lead) => { setEditingLead(lead); setAddEditModalOpen(true); }}
              onDeleteLead={(lead) => { setLeadToDelete(lead); setDeleteConfirmOpen(true); }}
              onQuickNote={(lead) => { setQuickNoteLead(lead); setQuickNoteText(''); }}
              onCompleteFollowUp={(lead) => handleCompleteFollowUp(lead._id)}
              showCallerInfo={user?.role === 'admin'}
            />
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500">
            Page <strong className="text-slate-900 dark:text-white font-bold">{page}</strong> of {totalPages}
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <LeadModal
        isOpen={addEditModalOpen}
        onClose={() => { setAddEditModalOpen(false); setEditingLead(null); }}
        onSubmit={handleSaveLead}
        lead={editingLead}
        callers={callers}
        loading={saving}
      />

      {/* Detail Modal */}
      <LeadDetailModal
        isOpen={!!detailLead}
        onClose={() => setDetailLead(null)}
        lead={detailLead}
        onAddNote={handleAddNote}
        onUpdateStatus={handleUpdateStatus}
        onCompleteFollowUp={handleCompleteFollowUp}
        onConvertLead={handleConvertLead}
      />

      {/* Import CSV Modal */}
      <ImportCSVModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleBulkImport}
      />

      {/* Convert Lead → Converted Client Modal (auto-opened after marking as Converted) */}
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

      {/* Quick Add Note Dialog */}
      {quickNoteLead && (
        <ConfirmDialog
          isOpen={!!quickNoteLead}
          onClose={() => setQuickNoteLead(null)}
          onConfirm={() => {
            if (quickNoteLead && quickNoteText.trim()) {
              handleAddNote(quickNoteLead._id, quickNoteText);
              setQuickNoteLead(null);
            }
          }}
          title={`Log Quick Note for ${quickNoteLead.name}`}
          message="Type your call summary or update below:"
          confirmText="Save Note"
          confirmVariant="primary"
        >
          <textarea
            value={quickNoteText}
            onChange={(e) => setQuickNoteText(e.target.value)}
            rows={3}
            placeholder="e.g. Left voicemail. Requested follow-up next Tuesday."
            className="w-full mt-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white"
          />
        </ConfirmDialog>
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => { setDeleteConfirmOpen(false); setLeadToDelete(null); }}
        onConfirm={handleDeleteLead}
        title="Delete Prospect"
        message={`Are you sure you want to permanently remove prospect "${leadToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete Prospect"
        confirmVariant="danger"
        loading={deleting}
      />
    </div>
  );
};
