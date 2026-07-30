import React from 'react';
import { DirectCallButton } from '../common/DirectCallButton';
import { Lead } from '../../types';
import {
  getStatusBadgeStyle,
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
  CheckSquare,
  Square,
  MessageCircle,
  User
} from 'lucide-react';

interface LeadCardMobileProps {
  lead: Lead;
  sNoDisplay: number;
  isSelected: boolean;
  onToggleSelect: (id: string, e: React.MouseEvent) => void;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onQuickNote: () => void;
  onCompleteFollowUp: () => void;
  onWhatsapp?: () => void;
  showCallerInfo?: boolean;
}

export const LeadCardMobile: React.FC<LeadCardMobileProps> = ({
  lead,
  sNoDisplay,
  isSelected,
  onToggleSelect,
  onSelect,
  onEdit,
  onDelete,
  onQuickNote,
  onCompleteFollowUp,
  onWhatsapp,
  showCallerInfo = false
}) => {
  const isDue = isFollowUpDue(lead.nextFollowUpDate);

  return (
    <div
      onClick={onSelect}
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer space-y-4 ${
        isSelected ? 'ring-2 ring-indigo-600 dark:ring-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/10' : ''
      }`}
    >
      {/* Header Row: Checkbox, SNo, badges */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center space-x-2.5">
          <button
            onClick={(e) => onToggleSelect(lead._id, e)}
            className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            {isSelected ? (
              <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-500" />
            ) : (
              <Square className="w-5 h-5" />
            )}
          </button>
          <span className="font-mono font-extrabold text-indigo-650 dark:text-indigo-400 text-xs">
            #{sNoDisplay}
          </span>
          {lead.isNewLead && (
            <span className="text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-extrabold tracking-wider">
              NEW
            </span>
          )}
        </div>

        {/* Small Status & Priority header badges */}
        <div className="flex items-center space-x-1.5">
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeStyle(lead.status)}`}>
            {lead.status}
          </span>
          <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-semibold border ${getPriorityBadgeStyle(lead.priority)}`}>
            {lead.priority}
          </span>
        </div>
      </div>

      {/* Prospect Information */}
      <div className="space-y-2.5">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-base border border-indigo-100 dark:border-indigo-800 shrink-0">
            {lead.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight break-words">
              {lead.company || lead.name}
            </h4>
            {lead.company && (
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 font-medium flex items-center">
                <User className="w-3.5 h-3.5 mr-1 text-slate-450 shrink-0" />
                Contact: {lead.name}
              </p>
            )}
            
            {/* Category & City Badges */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {lead.categoryName && (
                <span className="inline-flex items-center text-[9px] bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded font-semibold">
                  {lead.categoryName}
                </span>
              )}
              {lead.cityName && (
                <span className="inline-flex items-center text-[9px] bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 border border-indigo-150 dark:border-indigo-900/50 px-2 py-0.5 rounded font-bold">
                  {lead.cityName}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Contact details: Phone, Email */}
        <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl space-y-2 text-xs border border-slate-100/80 dark:border-slate-800/60" onClick={(e) => e.stopPropagation()}>
          {lead.phone && (
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-2 text-slate-600 dark:text-slate-350">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-mono font-semibold">{lead.phone}</span>
              </span>
              <DirectCallButton phone={lead.phone} leadId={lead._id} size="sm" label="Call" />
            </div>
          )}
          {lead.email && (
            <div className="flex items-center space-x-2 text-slate-650 dark:text-slate-355">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate select-all">{lead.email}</span>
            </div>
          )}
        </div>
      </div>

      {/* Caller Info (if admin view & enabled) */}
      {showCallerInfo && (
        <div className="flex items-center space-x-2.5 p-3 bg-indigo-50/30 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100/40 dark:border-indigo-900/20">
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-305 font-extrabold flex items-center justify-center text-xs shrink-0 uppercase">
            {lead.callerName.charAt(0)}
          </div>
          <div className="min-w-0">
            <span className="text-slate-700 dark:text-slate-300 font-bold text-xs block truncate">
              {lead.callerName}
            </span>
            <span className="text-[10px] text-slate-400 font-mono block truncate">
              {lead.callerEmail}
            </span>
          </div>
        </div>
      )}

      {/* Next Follow-up box */}
      <div className="flex items-center space-x-2.5 text-xs">
        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
        {lead.nextFollowUpDate ? (
          <div className="flex items-center space-x-2">
            <span className={`font-bold ${isDue ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
              Follow-up: {formatDate(lead.nextFollowUpDate)}
            </span>
            {isDue && (
              <span className="text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-extrabold animate-pulse">
                DUE NOW
              </span>
            )}
          </div>
        ) : (
          <span className="text-slate-400 italic">No follow-up scheduled</span>
        )}
      </div>

      {/* Latest Note/Update */}
      <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/60">
        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider block mb-1">
          Latest Logged Note
        </span>
        <p className="text-xs text-slate-800 dark:text-slate-200 italic font-medium break-words leading-relaxed">
          "{lead.latestUpdate || 'No updates logged yet'}"
        </p>
        <span className="text-[9px] text-slate-405 block mt-1.5 font-semibold">
          Updated {formatTimeAgo(lead.updatedAt)}
        </span>
      </div>

      {/* Action Buttons Grid */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
        {lead.phone && onWhatsapp && (
          <button
            onClick={onWhatsapp}
            className="w-full py-2.5 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-450 font-bold rounded-xl flex items-center justify-center space-x-1.5 border border-emerald-250 dark:border-emerald-900/30 transition-all text-xs"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>
        )}
        <button
          onClick={onQuickNote}
          className="w-full py-2.5 bg-indigo-50 dark:bg-indigo-950/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-650 dark:text-indigo-400 font-bold rounded-xl flex items-center justify-center space-x-1.5 border border-indigo-200 dark:border-indigo-900/30 transition-all text-xs"
        >
          <MessageSquarePlus className="w-3.5 h-3.5" />
          <span>Add Note</span>
        </button>
        <button
          onClick={onCompleteFollowUp}
          className="w-full py-2.5 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-450 font-bold rounded-xl flex items-center justify-center space-x-1.5 border border-emerald-205 dark:border-emerald-900/30 transition-all text-xs"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Mark Done</span>
        </button>
        <button
          onClick={onEdit}
          className="w-full py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-350 font-bold rounded-xl flex items-center justify-center space-x-1.5 border border-slate-200 dark:border-slate-700 transition-all text-xs"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit</span>
        </button>
        <button
          onClick={onDelete}
          className="w-full col-span-2 py-2.5 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-450 font-bold rounded-xl flex items-center justify-center space-x-1.5 border border-rose-200 dark:border-rose-900/30 transition-all text-xs"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
};
