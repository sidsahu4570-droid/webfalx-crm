import React, { useState } from 'react';
import { DirectCallButton } from '../common/DirectCallButton';
import { Lead } from '../../types';
import { FormulaEngine } from '../../utils/formulaEngine';
import { WhatsAppModal } from '../whatsapp/WhatsAppModal';
import {
  getStatusBadgeStyle,
  getStatusRowStyle,
  getPriorityBadgeStyle,
  formatDate,
  formatTimeAgo,
  isFollowUpDue
} from '../../utils/formatters';
import {
  Phone,
  Mail,
  Building,
  Calendar,
  CheckCircle,
  MessageSquarePlus,
  Edit2,
  Trash2,
  UserCheck,
  ArrowUpDown,
  Download,
  CheckSquare,
  Square,
  Hash,
  MessageCircle
} from 'lucide-react';
import { exportLeadsToCSV } from '../../utils/csv';

interface LeadTableProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (lead: Lead) => void;
  onQuickNote: (lead: Lead) => void;
  onCompleteFollowUp: (lead: Lead) => void;
  showCallerColumn?: boolean;
}

export const LeadTable: React.FC<LeadTableProps> = ({
  leads,
  onSelectLead,
  onEditLead,
  onDeleteLead,
  onQuickNote,
  onCompleteFollowUp,
  showCallerColumn = false
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [whatsappLead, setWhatsappLead] = useState<Lead | null>(null);
  const [sortField, setSortField] = useState<keyof Lead | 'name' | 'serialNumber'>('serialNumber');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSelectAll = () => {
    if (selectedIds.length === leads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(leads.map((l) => l._id));
    }
  };

  const handleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSort = (field: keyof Lead | 'name' | 'serialNumber') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Sorted Leads
  const sortedLeads = [...leads].sort((a, b) => {
    if (sortField === 'serialNumber') {
      const numA = a.serialNumber || 0;
      const numB = b.serialNumber || 0;
      return sortOrder === 'asc' ? numA - numB : numB - numA;
    }
    const valA = (a[sortField] || '').toString().toLowerCase();
    const valB = (b[sortField] || '').toString().toLowerCase();
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleBulkExport = () => {
    const selectedLeads = leads.filter((l) => selectedIds.includes(l._id));
    exportLeadsToCSV(selectedLeads.length > 0 ? selectedLeads : leads, 'Bulk_Exported_Leads.csv');
  };

  // Formula Engine Calculations for Summary Bar
  const totalCount = FormulaEngine.COUNTA(leads);
  const convertedCount = FormulaEngine.COUNT(leads.filter((l) => l.status === 'Converted'));
  const validContacts = FormulaEngine.COUNTA(leads.map((l) => l.phone));

  return (
    <div className="space-y-3">
      {/* Bulk Actions Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-indigo-950 text-white p-3 rounded-2xl flex items-center justify-between shadow-lg text-xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <span className="bg-indigo-600 font-extrabold px-2.5 py-0.5 rounded-full text-[11px]">
              {selectedIds.length} Selected
            </span>
            <span className="text-slate-300 font-semibold">Bulk Actions Toolbar</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleBulkExport}
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Bulk Export CSV</span>
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-slate-400 hover:text-white font-semibold px-2 py-1"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="w-full overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <table className="w-full text-left border-collapse min-w-[950px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider sticky top-0 backdrop-blur-md z-10">
              <th className="py-3.5 px-4 w-10">
                <button onClick={handleSelectAll} className="text-slate-400 hover:text-indigo-600">
                  {selectedIds.length === leads.length && leads.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="py-3.5 px-3 w-16 cursor-pointer hover:text-indigo-600" onClick={() => toggleSort('serialNumber')}>
                <div className="flex items-center space-x-1">
                  <span>S. No.</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3.5 px-4 cursor-pointer hover:text-indigo-600" onClick={() => toggleSort('name')}>
                <div className="flex items-center space-x-1">
                  <span>Prospect Info</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              {showCallerColumn && (
                <th className="py-3.5 px-4 cursor-pointer hover:text-indigo-600" onClick={() => toggleSort('callerName')}>
                  <div className="flex items-center space-x-1">
                    <span>Caller</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
              )}
              <th className="py-3.5 px-4 cursor-pointer hover:text-indigo-600" onClick={() => toggleSort('status')}>
                <div className="flex items-center space-x-1">
                  <span>Status & Priority</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3.5 px-4 max-w-[280px]">Latest Update / Note</th>
              <th className="py-3.5 px-4 cursor-pointer hover:text-indigo-600" onClick={() => toggleSort('nextFollowUpDate')}>
                <div className="flex items-center space-x-1">
                  <span>Next Follow-up</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
            {sortedLeads.map((lead, idx) => {
              const isDue = isFollowUpDue(lead.nextFollowUpDate);
              const rowStyle = getStatusRowStyle(lead.status);
              const isSelected = selectedIds.includes(lead._id);
              const sNoDisplay = lead.serialNumber || idx + 1;

              return (
                <tr
                  key={lead._id}
                  className={`${rowStyle} ${isSelected ? 'bg-indigo-50/70 dark:bg-indigo-950/40' : ''} transition-all duration-150 group cursor-pointer`}
                  onClick={() => onSelectLead(lead)}
                >
                  <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                    <button onClick={(e) => handleSelectOne(lead._id, e)} className="text-slate-400 hover:text-indigo-600">
                      {isSelected ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4" />}
                    </button>
                  </td>

                  {/* Serial Number Column */}
                  <td className="py-4 px-3 font-mono font-extrabold text-indigo-600 dark:text-indigo-400 text-xs">
                    #{sNoDisplay}
                  </td>

                  {/* Prospect Contact & Company */}
                  <td className="py-4 px-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-sm border border-indigo-100 dark:border-indigo-800 shrink-0">
                        {lead.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center space-x-1.5">
                          <span>{lead.name}</span>
                          {lead.isNewLead && (
                            <span className="text-[9px] bg-amber-500/10 text-amber-600 border border-amber-500/20 px-1.5 py-0.2 rounded font-extrabold">NEW</span>
                          )}
                        </div>
                        {lead.company && (
                          <div className="flex items-center text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                            <Building className="w-3 h-3 mr-1 text-slate-400" />
                            <span>{lead.company}</span>
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          {lead.categoryName && (
                            <span className="inline-flex items-center text-[9px] bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-1.5 py-0.2 rounded font-semibold">
                              {lead.categoryName}
                            </span>
                          )}
                          {lead.cityName && (
                            <span className="inline-flex items-center text-[9px] bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 border border-indigo-150 dark:border-indigo-900/50 px-1.5 py-0.2 rounded font-bold">
                              {lead.cityName}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-3 text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                          {lead.phone && (
                            <span className="flex items-center space-x-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{lead.phone}</span>
                              <DirectCallButton phone={lead.phone} leadId={lead._id} size="xs" label="Call" />
                            </span>
                          )}
                          {lead.email && (
                            <span className="flex items-center">
                              <Mail className="w-3 h-3 mr-1 text-slate-400" />
                              {lead.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Caller info */}
                  {showCallerColumn && (
                    <td className="py-4 px-4 font-medium text-slate-700 dark:text-slate-300">
                      <div className="flex items-center space-x-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="font-semibold text-xs">{lead.callerName}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block">{lead.callerEmail}</span>
                    </td>
                  )}

                  {/* Status & Priority */}
                  <td className="py-4 px-4 space-y-1.5">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeStyle(lead.status)}`}>
                      {lead.status}
                    </span>
                    <div>
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-semibold border ${getPriorityBadgeStyle(lead.priority)}`}>
                        {lead.priority} Priority
                      </span>
                    </div>
                  </td>

                  {/* Latest Update */}
                  <td className="py-4 px-4 max-w-[280px]">
                    <p className="text-xs text-slate-800 dark:text-slate-200 line-clamp-2 font-medium">
                      "{lead.latestUpdate || 'No notes added yet'}"
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Updated {formatTimeAgo(lead.updatedAt)}
                    </span>
                  </td>

                  {/* Next Follow-up */}
                  <td className="py-4 px-4">
                    {lead.nextFollowUpDate ? (
                      <div className="space-y-1">
                        <div className={`flex items-center font-bold text-xs ${isDue ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
                          <Calendar className="w-3.5 h-3.5 mr-1" />
                          <span>{formatDate(lead.nextFollowUpDate)}</span>
                        </div>
                        {isDue && (
                          <span className="inline-block text-[9px] bg-amber-500/10 text-amber-600 border border-amber-500/20 px-1.5 py-0.5 rounded font-extrabold animate-pulse">
                            DUE NOW
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic">No follow-up set</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end space-x-1">
                      {lead.phone && (
                        <button
                          onClick={() => setWhatsappLead(lead)}
                          title="Send WhatsApp Message"
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-xl transition-all font-bold"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onQuickNote(lead)}
                        title="Add Conversation Note"
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-xl transition-all"
                      >
                        <MessageSquarePlus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onCompleteFollowUp(lead)}
                        title="Mark Follow-up Complete"
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-xl transition-all"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEditLead(lead)}
                        title="Edit Prospect"
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-xl transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteLead(lead)}
                        title="Delete Prospect"
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Excel Formula Calculation Engine Summary Bar */}
        <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-3 px-4 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center space-x-4">
            <span className="font-sans font-bold text-slate-500 uppercase text-[10px] tracking-wider">Formula Engine:</span>
            <span className="text-slate-800 dark:text-slate-200 font-bold">COUNT(Leads) = {totalCount}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">COUNT(Converted) = {convertedCount}</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">COUNTA(Phone Contacts) = {validContacts}</span>
          </div>
          <span className="text-[11px] text-slate-400 font-sans italic">Click headers to sort ascending / descending</span>
        </div>
      </div>

      {/* WhatsApp Modal */}
      {whatsappLead && (
        <WhatsAppModal
          isOpen={!!whatsappLead}
          onClose={() => setWhatsappLead(null)}
          leadId={whatsappLead._id}
          recipientName={whatsappLead.name}
          companyName={whatsappLead.company}
          phone={whatsappLead.phone}
        />
      )}
    </div>
  );
};
