import React, { useState, useEffect } from 'react';
import { leadService } from '../services/leadService';
import { convertedClientService } from '../services/convertedClientService';
import { Lead, City } from '../types';
import { LeadTable } from '../components/leads/LeadTable';
import { LeadDetailModal } from '../components/leads/LeadDetailModal';
import { ConvertedClientModal } from '../components/converted/ConvertedClientModal';
import { CityFilterDropdown } from '../components/leads/CityFilterDropdown';
import { LoadingSpinner } from '../components/common/SkeletonLoader';
import { useToast } from '../context/ToastContext';
import { cityService } from '../services/cityService';
import { CalendarClock } from 'lucide-react';

export const FollowupsPage: React.FC = () => {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedCityIds, setSelectedCityIds] = useState<string[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  // Convert Lead -> Converted Client flow
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [converting, setConverting] = useState(false);

  const fetchDueLeads = async () => {
    setLoading(true);
    try {
      const res = await leadService.getLeads({
        dueFollowUp: true,
        limit: 50,
        cityId: selectedCityIds.length > 0 ? selectedCityIds.join(',') : undefined
      });
      if (res.success && res.leads) {
        setLeads(res.leads);
      }
    } catch (err: any) {
      toast('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cityService.getCities().then((res) => {
      if (res.success) {
        setCities(res.cities);
      }
    });
  }, []);

  useEffect(() => {
    fetchDueLeads();
  }, [selectedCityIds]);

  const handleCompleteFollowUp = async (leadId: string, nextDate?: string) => {
    try {
      const res = await leadService.completeFollowUp(leadId, nextDate);
      if (res.success) {
        toast('Follow-up Marked Done', 'Updated follow-up status', 'success');
        fetchDueLeads();
        if (selectedLead?._id === leadId) setSelectedLead(res.lead);
      }
    } catch (err: any) {
      toast('Error', err.message, 'error');
    }
  };

  const handleAddNote = async (leadId: string, content: string) => {
    try {
      const res = await leadService.addNote(leadId, content);
      if (res.success) {
        toast('Note Added', 'Note saved to prospect record', 'success');
        fetchDueLeads();
        if (selectedLead?._id === leadId) setSelectedLead(res.lead);
      }
    } catch (err: any) {
      toast('Error', err.message, 'error');
    }
  };

  const handleUpdateStatus = async (leadId: string, status: any) => {
    try {
      const res = await leadService.updateLead(leadId, { status });
      if (res.success) {
        toast('Status Changed', `Status updated to ${status}`, 'success');
        fetchDueLeads();
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
        toast('Client Converted!', `${leadToConvert?.name} submitted for admin approval.`, 'success');
        setConvertModalOpen(false);
        setLeadToConvert(null);
        fetchDueLeads();
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
        <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <CalendarClock className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Follow-up Call Schedule & Urgency Queue
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Prospects requiring call follow-up today or overdue ({leads.length} pending)
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CityFilterDropdown
            selectedCityIds={selectedCityIds}
            setSelectedCityIds={setSelectedCityIds}
            cities={cities}
          />
          {selectedCityIds.length > 0 && (
            <button
              onClick={() => setSelectedCityIds([])}
              className="text-xs text-slate-500 hover:text-rose-500 font-bold"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching scheduled follow-ups..." />
      ) : leads.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl text-center border border-slate-200 dark:border-slate-800">
          <p className="text-sm font-bold text-slate-900 dark:text-white">🎉 All Follow-ups Completed!</p>
          <p className="text-xs text-slate-500 mt-1">You have zero overdue or pending follow-ups today.</p>
        </div>
      ) : (
        <LeadTable
          leads={leads}
          onSelectLead={(l) => setSelectedLead(l)}
          onEditLead={(l) => setSelectedLead(l)}
          onDeleteLead={() => {}}
          onQuickNote={(l) => setSelectedLead(l)}
          onCompleteFollowUp={(l) => handleCompleteFollowUp(l._id)}
        />
      )}

      <LeadDetailModal
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        lead={selectedLead}
        onAddNote={handleAddNote}
        onUpdateStatus={handleUpdateStatus}
        onCompleteFollowUp={handleCompleteFollowUp}
        onConvertLead={handleConvertLead}
      />

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
