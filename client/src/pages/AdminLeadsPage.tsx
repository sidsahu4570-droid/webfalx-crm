import React, { useState, useEffect, useCallback } from 'react';
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
import { categoryService } from '../services/categoryService';
import { cityService } from '../services/cityService';
import { Layers } from 'lucide-react';

export const AdminLeadsPage: React.FC = () => {
  const { toast } = useToast();
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
        cityId: selectedCityIds.length > 0 ? selectedCityIds.join(',') : undefined
      };
      const res = await leadService.getLeads(params);
      if (res.success && res.leads) setLeads(res.leads);
    } catch (err: any) {
      toast('Error Loading Leads', err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [search, status, priority, dueOnly, callerId, toast, categoryId, selectedCityIds]);

  useEffect(() => {
    fetchCallers();
    fetchAllLeads();
  }, [fetchAllLeads]);

  const handleAssignLead = async (leadId: string, targetCallerId: string) => {
    try {
      const res = await adminService.assignLead(leadId, targetCallerId);
      if (res.success) {
        toast('Lead Reassigned', res.message, 'success');
        fetchAllLeads();
        if (selectedLead?._id === leadId) setSelectedLead(res.lead);
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
      if (res.success) {
        toast('Conversation Update Saved', 'Note logged to prospect', 'success');
        fetchAllLeads();
        if (selectedLead?._id === leadId) setSelectedLead(res.lead);
      }
    } catch (err: any) {
      toast('Error', err.message, 'error');
    }
  };

  const handleUpdateStatus = async (leadId: string, newStatus: any) => {
    try {
      const res = await leadService.updateLead(leadId, { status: newStatus });
      if (res.success) {
        toast('Status Changed', `Lead status changed to ${newStatus}`, 'success');
        fetchAllLeads();
        if (selectedLead?._id === leadId) setSelectedLead(res.lead);
      }
    } catch (err: any) {
      toast('Error', err.message, 'error');
    }
  };

  const handleCompleteFollowUp = async (leadId: string, nextDate?: string) => {
    try {
      const res = await leadService.completeFollowUp(leadId, nextDate);
      if (res.success) {
        toast('Follow-up Completed', 'Marked follow-up as done', 'success');
        fetchAllLeads();
        if (selectedLead?._id === leadId) setSelectedLead(res.lead);
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
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Admin view of all call team prospects ({leads.length} prospects shown)
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
            }}
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching full team prospects pipeline..." />
      ) : (
        <LeadTable
          leads={leads}
          onSelectLead={(l) => setSelectedLead(l)}
          onEditLead={(l) => setSelectedLead(l)}
          onDeleteLead={() => {}}
          onQuickNote={(l) => setSelectedLead(l)}
          onCompleteFollowUp={(l) => handleCompleteFollowUp(l._id)}
          showCallerColumn={true}
        />
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
