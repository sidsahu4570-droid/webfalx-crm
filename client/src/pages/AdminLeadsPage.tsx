import React, { useState, useEffect, useCallback, useRef } from 'react';
import { leadService } from '../services/leadService';
import { userService } from '../services/userService';
import { adminService } from '../services/adminService';
import { convertedClientService } from '../services/convertedClientService';
import { Lead, User, FilterParams, City } from '../types';
import { LeadTable } from '../components/leads/LeadTable';
import { LeadDetailModal } from '../components/leads/LeadDetailModal';
import { ConvertedClientModal } from '../components/converted/ConvertedClientModal';
import { SearchBar } from '../components/leads/SearchBar';
import { FilterDropdown } from '../components/leads/FilterDropdown';
import { CityFilterDropdown } from '../components/leads/CityFilterDropdown';
import { LoadingSpinner } from '../components/common/SkeletonLoader';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import { categoryService } from '../services/categoryService';
import { cityService } from '../services/cityService';
import { isFollowUpDue } from '../utils/formatters';
import { Layers, ChevronLeft, ChevronRight } from 'lucide-react';

export const AdminLeadsPage: React.FC = () => {
  const { toast } = useToast();
  const { socket } = useSocket();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [callers, setCallers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [priority, setPriority] = useState('All');
  const [dueOnly, setDueOnly] = useState(false);
  const [callerId, setCallerId] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [categoryId, setCategoryId] = useState('All');
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCityIds, setSelectedCityIds] = useState<string[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [sortBy, setSortBy] = useState('recentlyUpdated');

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalProspects, setTotalProspects] = useState(0);

  // Convert Lead -> Converted Client flow
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [converting, setConverting] = useState(false);

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

  const fetchCallers = async () => {
    try {
      const res = await userService.getUsers();
      if (res.success) setCallers(res.users);
    } catch (e) {}
  };

  const cityIdsKey = selectedCityIds.join(',');

  const fetchAllLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params: FilterParams = {
        isNewLead: false, // Strict segregation: only fetch active worked leads
        search,
        status: status !== 'All' ? status : undefined,
        priority: priority !== 'All' ? priority : undefined,
        dueFollowUp: dueOnly ? true : undefined,
        callerId: callerId ? callerId : undefined,
        limit: 50,
        categoryId: categoryId !== 'All' ? categoryId : undefined,
        cityId: cityIdsKey ? cityIdsKey : undefined,
        sortBy,
        page
      };
      const res = await leadService.getLeads(params);
      console.log('AdminLeadsPage fetch params:', params);
      console.log('AdminLeadsPage fetch response:', res);
      if (res.success && res.leads) {
        setLeads(res.leads);
        setTotalPages(res.pagination?.pages || 1);
        setTotalLeads(res.pagination?.total || 0);
        setTotalProspects(res.pagination?.totalProspects ?? res.pagination?.total ?? 0);
      }
    } catch (err: any) {
      console.error('AdminLeadsPage fetch error:', err);
      toast('Error Loading Leads', err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [search, status, priority, dueOnly, callerId, toast, categoryId, cityIdsKey, sortBy, page]);

  // Reset to page 1 when any filter changes
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setPage(1);
  }, [search, status, priority, dueOnly, callerId, categoryId, cityIdsKey, sortBy]);

  useEffect(() => {
    fetchCallers();
  }, []);

  useEffect(() => {
    fetchAllLeads();
  }, [fetchAllLeads]);

  // Track active filter values in a ref for stable access inside handleLeadUpdated
  const filtersRef = useRef({
    search,
    status,
    priority,
    dueOnly,
    callerId,
    categoryId,
    selectedCityIds
  });

  useEffect(() => {
    filtersRef.current = {
      search,
      status,
      priority,
      dueOnly,
      callerId,
      categoryId,
      selectedCityIds
    };
  }, [search, status, priority, dueOnly, callerId, categoryId, selectedCityIds]);

  const checkLeadMatchesFilters = useCallback((lead: Lead, currentFilters: typeof filtersRef.current): boolean => {
    // 1. Status
    if (currentFilters.status === 'All') {
      if (lead.status === 'Not Interested' || lead.status === 'Closed') {
        return false;
      }
    } else if (lead.status !== currentFilters.status) {
      return false;
    }

    // 2. Priority
    if (currentFilters.priority !== 'All' && lead.priority !== currentFilters.priority) {
      return false;
    }

    // 3. Due Follow-ups
    if (currentFilters.dueOnly) {
      if (!lead.nextFollowUpDate || !isFollowUpDue(lead.nextFollowUpDate)) {
        return false;
      }
    }

    // 4. Caller
    if (currentFilters.callerId) {
      const leadUserId = typeof lead.userId === 'object' && lead.userId ? (lead.userId as any)._id : lead.userId;
      if (leadUserId && leadUserId.toString() !== currentFilters.callerId.toString()) {
        return false;
      }
    }

    // 5. Category
    if (currentFilters.categoryId !== 'All') {
      const leadCatId = typeof lead.categoryId === 'object' && lead.categoryId ? (lead.categoryId as any)._id : lead.categoryId;
      if (leadCatId && leadCatId.toString() !== currentFilters.categoryId.toString()) {
        return false;
      }
    }

    // 6. City
    if (currentFilters.selectedCityIds.length > 0) {
      const leadCityId = typeof lead.cityId === 'object' && lead.cityId ? (lead.cityId as any)._id : lead.cityId;
      if (!leadCityId || !currentFilters.selectedCityIds.includes(leadCityId.toString())) {
        return false;
      }
    }

    // 7. Search
    if (currentFilters.search && currentFilters.search.trim() !== '') {
      const term = currentFilters.search.trim().toLowerCase();
      const nameMatch = lead.name?.toLowerCase().includes(term);
      const companyMatch = lead.company?.toLowerCase().includes(term);
      const emailMatch = lead.email?.toLowerCase().includes(term);
      const phoneMatch = lead.phone?.toLowerCase().includes(term);
      const serialMatch = lead.serialNumber?.toString().includes(term);
      if (!nameMatch && !companyMatch && !emailMatch && !phoneMatch && !serialMatch) {
        return false;
      }
    }

    return true;
  }, []);

  const handleLeadUpdated = useCallback((updatedLead: Lead) => {
    if (!updatedLead) return;

    const matches = checkLeadMatchesFilters(updatedLead, filtersRef.current);

    if (matches) {
      // Lead still matches active filters: update immediately in place
      setLeads((prev) => prev.map((l) => (l._id === updatedLead._id ? updatedLead : l)));
    } else {
      // Edge case: lead no longer matches active filter!
      // Remove lead from current filtered list immediately
      setLeads((prev) => prev.filter((l) => l._id !== updatedLead._id));

      // Recalculate pagination correctly without resetting to Page 1 unless required
      setTotalLeads((prevTotal) => {
        const newTotal = Math.max(0, prevTotal - 1);
        const newPages = Math.max(1, Math.ceil(newTotal / 50));
        setTotalPages(newPages);
        setPage((prevPage) => Math.min(prevPage, newPages));
        return newTotal;
      });
    }

    // Always update selectedLead if this lead is currently open in modal
    setSelectedLead((prev) => (prev?._id === updatedLead._id ? updatedLead : prev));
  }, [checkLeadMatchesFilters]);

  // Real-time Socket synchronization
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (updatedLead: any) => {
      if (!updatedLead) return;
      handleLeadUpdated(updatedLead);
    };

    const handleCreated = () => {
      fetchAllLeads();
    };

    socket.on('lead_created', handleCreated);
    socket.on('lead_updated', handleUpdate);
    socket.on('lead_assigned', handleUpdate);
    socket.on('leads_imported', handleCreated);

    return () => {
      socket.off('lead_created', handleCreated);
      socket.off('lead_updated', handleUpdate);
      socket.off('lead_assigned', handleUpdate);
      socket.off('leads_imported', handleCreated);
    };
  }, [socket, handleLeadUpdated, fetchAllLeads]);

  const handleAssignLead = async (leadId: string, targetCallerId: string) => {
    try {
      const res = await adminService.assignLead(leadId, targetCallerId);
      if (res.success && res.lead) {
        toast('Lead Reassigned', res.message, 'success');
        handleLeadUpdated(res.lead);
      }
    } catch (err: any) {
      toast('Reassign Failed', err.message, 'error');
    }
  };

  const handleAddNote = async (
    leadId: string,
    content: string,
    options?: { status?: any; nextFollowUpDate?: string; isWhatsApp?: boolean }
  ) => {
    try {
      const res = await leadService.addNote(leadId, content, options);
      if (res.success && res.lead) {
        toast('Conversation Update Saved', 'Note logged to prospect', 'success');
        handleLeadUpdated(res.lead);
      }
    } catch (err: any) {
      toast('Error', err.message, 'error');
    }
  };

  const handleUpdateStatus = async (leadId: string, newStatus: any) => {
    try {
      const res = await leadService.updateLead(leadId, { status: newStatus });
      if (res.success && res.lead) {
        toast('Status Changed', `Lead status changed to ${newStatus}`, 'success');
        handleLeadUpdated(res.lead);
      }
    } catch (err: any) {
      toast('Error', err.message, 'error');
    }
  };

  const handleCompleteFollowUp = async (leadId: string, nextDate?: string) => {
    try {
      const res = await leadService.completeFollowUp(leadId, nextDate);
      if (res.success && res.lead) {
        toast('Follow-up Completed', 'Marked follow-up as done', 'success');
        handleLeadUpdated(res.lead);
      }
    } catch (err: any) {
      toast('Error', err.message, 'error');
    }
  };

  const handleConvertLead = (lead: Lead) => {
    setLeadToConvert(lead);
    setSelectedLead(null);
    setConvertModalOpen(true);
  };

  const handleCreateFromLead = async (data: any) => {
    setConverting(true);
    try {
      const res = await convertedClientService.createClient(data);
      if (res.success) {
        toast('Client Converted!', `${leadToConvert?.name} has been converted and submitted for approval.`, 'success');
        setConvertModalOpen(false);
        setLeadToConvert(null);
        fetchAllLeads();
      }
    } catch (err: any) {
      toast('Conversion Error', err.response?.data?.message || err.message, 'error');
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-3 rounded-2xl bg-indigo-600 text-white">
          <Layers className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Cross-Caller Lead Oversight & Reassignment
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2">
            <span>Admin view of all call team prospects</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/70 shadow-sm">
              Total Prospects: {totalProspects.toLocaleString()} | Showing: {totalLeads.toLocaleString()}
            </span>
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <SearchBar value={search} onChange={(v) => setSearch(v)} />
        <div className="flex flex-wrap items-center gap-3">
          <CityFilterDropdown
            selectedCityIds={selectedCityIds}
            setSelectedCityIds={setSelectedCityIds}
            cities={cities}
          />
          <FilterDropdown
            status={status}
            setStatus={(s) => setStatus(s)}
            priority={priority}
            setPriority={(p) => setPriority(p)}
            dueOnly={dueOnly}
            setDueOnly={(d) => setDueOnly(d)}
            callerId={callerId}
            setCallerId={(c) => setCallerId(c)}
            callers={callers}
            categoryId={categoryId}
            setCategoryId={(cat) => setCategoryId(cat)}
            categories={categories}
            onReset={() => {
              setStatus('All');
              setPriority('All');
              setDueOnly(false);
              setCallerId('');
              setCategoryId('All');
              setSelectedCityIds([]);
              setSearch('');
              setSortBy('recentlyUpdated');
            }}
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="recentlyUpdated">Recently Updated</option>
            <option value="oldestUpdated">Oldest Updated</option>
            <option value="recentlyCreated">Recently Created</option>
            <option value="oldestCreated">Oldest Created</option>
            <option value="latestFollowUp">Latest Follow-up</option>
            <option value="oldestFollowUp">Oldest Follow-up</option>
            <option value="companyAsc">Company Name (A–Z)</option>
            <option value="companyDesc">Company Name (Z–A)</option>
            <option value="callerAsc">Caller Name (A–Z)</option>
            <option value="callerDesc">Caller Name (Z–A)</option>
            <option value="priorityHighToLow">Priority (High → Low)</option>
            <option value="priorityLowToHigh">Priority (Low → High)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching full team prospects pipeline..." />
      ) : (
        <div className="space-y-4">
          <LeadTable
            leads={leads}
            onSelectLead={(l) => setSelectedLead(l)}
            onEditLead={(l) => setSelectedLead(l)}
            onDeleteLead={() => {}}
            onDeleteMultipleLeads={async (ids) => {
              try {
                const res = await leadService.deleteMultipleLeads(ids);
                if (res.success) {
                  toast('Leads Deleted', `Successfully moved ${ids.length} leads to Trash History`, 'success');
                  fetchAllLeads();
                }
              } catch (err: any) {
                toast('Deletion Error', err.message, 'error');
              }
            }}
            onBulkAssignSuccess={fetchAllLeads}
            onQuickNote={(l) => setSelectedLead(l)}
            onCompleteFollowUp={(l) => handleCompleteFollowUp(l._id)}
            showCallerColumn={true}
            currentPage={page}
            pageSize={50}
          />
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
                  className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-650 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-650 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <LeadDetailModal
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        lead={selectedLead}
        onAddNote={handleAddNote}
        onUpdateStatus={handleUpdateStatus}
        onCompleteFollowUp={handleCompleteFollowUp}
        onAssignLead={handleAssignLead}
        onConvertLead={handleConvertLead}
        callers={callers}
      />

      {leadToConvert && (
        <ConvertedClientModal
          isOpen={convertModalOpen}
          onClose={() => { setConvertModalOpen(false); setLeadToConvert(null); }}
          onSubmit={handleCreateFromLead}
          isAdmin={true}
          callers={callers}
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
