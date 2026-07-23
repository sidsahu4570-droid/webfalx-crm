import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Lead, LeadStatus, User } from '../../types';
import {
  getStatusBadgeStyle,
  getPriorityBadgeStyle,
  formatDate,
  formatDateTime,
  formatTimeAgo,
  isFollowUpDue
} from '../../utils/formatters';
import {
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CheckCircle,
  MessageSquare,
  Send,
  UserCheck,
  Clock,
  UserPlus,
  MessageCircle,
  Tag,
  Zap,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DirectCallButton } from '../common/DirectCallButton';

interface LeadDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onAddNote: (
    leadId: string,
    noteText: string,
    options?: { status?: LeadStatus; nextFollowUpDate?: string; isWhatsApp?: boolean }
  ) => Promise<void>;
  onUpdateStatus: (leadId: string, status: LeadStatus) => Promise<void>;
  onCompleteFollowUp: (leadId: string, nextDate?: string) => Promise<void>;
  onAssignLead?: (leadId: string, callerId: string) => Promise<void>;
  onConvertLead?: (lead: Lead) => void;
  callers?: User[];
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  isOpen,
  onClose,
  lead,
  onAddNote,
  onUpdateStatus,
  onCompleteFollowUp,
  onAssignLead,
  onConvertLead,
  callers = []
}) => {
  const { user } = useAuth();
  const [newNote, setNewNote] = useState('');
  const [updateStatus, setUpdateStatus] = useState<LeadStatus | ''>('');
  const [callbackDate, setCallbackDate] = useState('');
  const [whatsAppStatus, setWhatsAppStatus] = useState<'Yes' | 'No' | ''>('');
  const [whatsAppError, setWhatsAppError] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [selectedCaller, setSelectedCaller] = useState('');
  const [reassigning, setReassigning] = useState(false);

  if (!lead) return null;

  const isDue = isFollowUpDue(lead.nextFollowUpDate);

  const presetTemplates = [
    'Client said call after 2 days.',
    'Interested in website package.',
    'Budget issue currently.',
    'Asked to send portfolio on WhatsApp.',
    'Meeting scheduled for tomorrow.'
  ];

  const isNewLeadCheck = lead ? (lead.isNewLead === true || lead.leadType === 'imported') : false;

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    
    // Mandatory WhatsApp status validation ONLY for New / Imported Leads
    if (isNewLeadCheck && !whatsAppStatus) {
      setWhatsAppError('Please select whether a WhatsApp message was sent.');
      return;
    }
    setWhatsAppError('');

    setAddingNote(true);
    try {
      await onAddNote(lead._id, newNote, {
        status: updateStatus || lead.status,
        nextFollowUpDate: callbackDate || undefined,
        isWhatsApp: whatsAppStatus === 'Yes'
      });
      setNewNote('');
      setUpdateStatus('');
      setCallbackDate('');
      setWhatsAppStatus('');
      // After saving: if the selected status was Converted, trigger the convert flow
      if (updateStatus === 'Converted' && onConvertLead) {
        onConvertLead(lead);
      }
    } finally {
      setAddingNote(false);
    }
  };

  const handlePresetClick = (preset: string) => {
    setNewNote(preset);
    if (preset.includes('WhatsApp')) {
      setWhatsAppStatus('Yes');
    }
  };

  const handleFollowUpDone = async () => {
    await onCompleteFollowUp(lead._id, nextFollowUpDate || undefined);
    setNextFollowUpDate('');
  };

  const handleReassign = async () => {
    if (!selectedCaller || !onAssignLead) return;
    setReassigning(true);
    try {
      await onAssignLead(lead._id, selectedCaller);
      setSelectedCaller('');
    } finally {
      setReassigning(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={lead.name}
      subtitle={`Prospect record & activity timeline • Assigned to ${lead.callerName}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center text-lg shadow-md shadow-indigo-500/20">
              {lead.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                  S. No. #{lead.serialNumber || 'N/A'}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{lead.name}</h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shadow-sm ${getStatusBadgeStyle(
                    lead.status
                  )}`}
                >
                  {lead.status}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getPriorityBadgeStyle(
                    lead.priority
                  )}`}
                >
                  {lead.priority}
                </span>
                {lead.categoryName && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    📂 {lead.categoryName}
                  </span>
                )}
                {lead.cityName && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    🌆 {lead.cityName}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center">
                <Clock className="w-3 h-3 mr-1 text-slate-400" />
                Last updated {formatTimeAgo(lead.updatedAt)}
              </p>
            </div>
          </div>

          {/* Quick Status Dropdown */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500">Update Status:</span>
            <select
              value={lead.status}
              onChange={(e) => onUpdateStatus(lead._id, e.target.value as LeadStatus)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="New">New</option>
              <option value="Interested">Interested</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Meeting Scheduled">Meeting Scheduled</option>
              <option value="Converted">Converted</option>
              <option value="Not Interested">Not Interested</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Contact Info & Followup Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Contact Details
            </h4>
            <div className="flex items-center text-xs text-slate-700 dark:text-slate-300">
              <Building className="w-4 h-4 mr-2.5 text-slate-400" />
              <span>{lead.company || 'Company not specified'}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2.5 text-slate-400" />
                <span className="font-bold">{lead.phone || 'Phone not provided'}</span>
              </div>
              {lead.phone && <DirectCallButton phone={lead.phone} leadId={lead._id} label="Call Now" />}
            </div>
            <div className="flex items-center text-xs text-slate-700 dark:text-slate-300">
              <Mail className="w-4 h-4 mr-2.5 text-slate-400" />
              <a href={`mailto:${lead.email}`} className="hover:text-indigo-600 truncate">
                {lead.email || 'Email not provided'}
              </a>
            </div>
          </div>

          <div className="bg-amber-500/5 dark:bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center">
                <Calendar className="w-4 h-4 mr-1.5" />
                Follow-up Management
              </h4>
              <span className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full">
                Done: {lead.completedFollowUps}
              </span>
            </div>

            <div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Scheduled Next:{' '}
                <span className={`font-bold ${isDue ? 'text-rose-600 dark:text-rose-400' : ''}`}>
                  {lead.nextFollowUpDate ? formatDate(lead.nextFollowUpDate) : 'None'}
                </span>
              </p>
            </div>

            <div className="pt-2 border-t border-amber-500/20 space-y-2">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Set Next Follow-up (Optional)
              </label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={nextFollowUpDate}
                  onChange={(e) => setNextFollowUpDate(e.target.value)}
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                />
                <button
                  type="button"
                  onClick={handleFollowUpDone}
                  className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-sm transition-all"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Mark Done</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Reassign Lead (Admin) */}
        {user?.role === 'admin' && onAssignLead && callers.length > 0 && (
          <div className="bg-indigo-50/70 dark:bg-indigo-950/40 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <UserPlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Reassign Prospect to Another Caller:
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={selectedCaller}
                onChange={(e) => setSelectedCaller(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <option value="">Select Caller...</option>
                {callers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleReassign}
                disabled={!selectedCaller || reassigning}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
              >
                {reassigning ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        )}

        {/* Add Conversation Update Module */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center">
              <MessageSquare className="w-4 h-4 mr-1.5 text-indigo-500" />
              Log Call Conversation & Outcome
            </h4>
            <span className="text-[10px] text-slate-400 font-medium">Recorded by {user?.name}</span>
          </div>

          {/* Quick Call Presets Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center">
              <Zap className="w-3 h-3 mr-1 text-amber-500" />
              Quick Call Presets:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {presetTemplates.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className="text-[11px] font-medium bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700 transition-all"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleNoteSubmit} className="space-y-3">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={3}
              placeholder="Write what the client said on call (e.g. Discussed budget, requested portfolio on WhatsApp, call back Thursday)..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Change Lead Status */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Updated Lead Status
                </label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value as LeadStatus)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="">Status: Keep Current ({lead.status})</option>
                  <option value="New">New</option>
                  <option value="Interested">Interested</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Meeting Scheduled">Meeting Scheduled</option>
                  <option value="Converted">Converted</option>
                  <option value="Not Interested">Not Interested</option>
                  <option value="Closed">Closed</option>
                  <option value="Not Picked">Not Picked (Orange)</option>
                </select>
              </div>

              {/* Callback Timing */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Callback Date
                </label>
                <input
                  type="date"
                  value={callbackDate}
                  onChange={(e) => setCallbackDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* WhatsApp Message Sent? Mandatory Selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  WhatsApp Message Sent? {isNewLeadCheck ? <span className="text-rose-500">* (Required)</span> : <span className="text-slate-400 font-normal">(Optional)</span>}
                </label>
                <div className="flex items-center space-x-4 pt-1">
                  <label className="inline-flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 cursor-pointer">
                    <input
                      type="radio"
                      name="whatsAppStatus"
                      value="Yes"
                      checked={whatsAppStatus === 'Yes'}
                      onChange={() => {
                        setWhatsAppStatus('Yes');
                        setWhatsAppError('');
                      }}
                      className="form-radio text-emerald-600 focus:ring-emerald-500 mr-1.5"
                    />
                    Yes (Message Sent)
                  </label>
                  <label className="inline-flex items-center text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
                    <input
                      type="radio"
                      name="whatsAppStatus"
                      value="No"
                      checked={whatsAppStatus === 'No'}
                      onChange={() => {
                        setWhatsAppStatus('No');
                        setWhatsAppError('');
                      }}
                      className="form-radio text-slate-600 focus:ring-slate-500 mr-1.5"
                    />
                    No
                  </label>
                </div>
                {whatsAppError && (
                  <p className="text-[11px] font-bold text-rose-500 mt-1">{whatsAppError}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-1">
              {updateStatus === 'Converted' ? (
                <button
                  type="submit"
                  disabled={addingNote || !newNote.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center space-x-2 shadow-md shadow-emerald-500/25 transition-all active:scale-95"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{addingNote ? 'Saving...' : 'Mark Converted & Fill Details'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={addingNote || !newNote.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold px-5 py-2 rounded-xl flex items-center space-x-1.5 shadow-md shadow-indigo-500/20 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{addingNote ? 'Logging Update...' : 'Save Conversation Update'}</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Conversation History Timeline */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
            <Clock className="w-4 h-4 mr-1.5 text-indigo-500" />
            Full Conversation Update Timeline ({lead.notes?.length || 0})
          </h4>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {lead.notes && lead.notes.length > 0 ? (
              lead.notes.map((note, idx) => (
                <div
                  key={note._id || idx}
                  className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {note.createdByName}
                      </span>
                      {note.status && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeStyle(
                            note.status
                          )}`}
                        >
                          {note.status}
                        </span>
                      )}
                      {note.isWhatsApp && (
                        <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold flex items-center">
                          <MessageCircle className="w-3 h-3 mr-1" />
                          WhatsApp Note
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {formatDateTime(note.createdAt)}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {formatTimeAgo(note.createdAt)}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    "{note.content}"
                  </p>

                  {note.followUpDate && (
                    <div className="mt-2 text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      Callback Scheduled: {formatDate(note.followUpDate)}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-6">
                No conversation history logged yet. Use the form above to add your first call update.
              </p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
