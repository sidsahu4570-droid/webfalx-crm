import React from 'react';
import { DirectCallButton } from '../common/DirectCallButton';
import { Lead } from '../../types';
import {
  getStatusBadgeStyle,
  getStatusCardStyle,
  getPriorityBadgeStyle,
  formatDate,
  formatTimeAgo,
  isFollowUpDue
} from '../../utils/formatters';
import {
  Building,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  MessageSquarePlus,
  Edit2,
  Trash2,
  UserCheck,
  PlusCircle
} from 'lucide-react';

interface LeadCardProps {
  lead: Lead;
  onSelectLead: (lead: Lead) => void;
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (lead: Lead) => void;
  onQuickNote: (lead: Lead) => void;
  onCompleteFollowUp: (lead: Lead) => void;
  showCallerInfo?: boolean;
}

export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  onSelectLead,
  onEditLead,
  onDeleteLead,
  onQuickNote,
  onCompleteFollowUp,
  showCallerInfo = false
}) => {
  const isDue = isFollowUpDue(lead.nextFollowUpDate);
  const cardStyle = getStatusCardStyle(lead.status);

  return (
    <div
      onClick={() => onSelectLead(lead)}
      className={`group ${cardStyle} p-5 rounded-3xl shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between border`}
    >
      <div>
        {/* Top Header & Badges */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-sm border border-indigo-100 dark:border-indigo-800 shrink-0">
              {lead.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {lead.name}
              </h4>
              {lead.company && (
                <div className="flex items-center text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                  <Building className="w-3 h-3 mr-1 text-slate-400" />
                  <span>{lead.company}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end space-y-1">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border shadow-sm ${getStatusBadgeStyle(
                lead.status
              )}`}
            >
              {lead.status}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-semibold border ${getPriorityBadgeStyle(
                lead.priority
              )}`}
            >
              {lead.priority}
            </span>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-1 my-3 text-xs text-slate-600 dark:text-slate-300">
          {lead.phone && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Phone className="w-3.5 h-3.5 mr-2 text-slate-400" />
                <span>{lead.phone}</span>
              </div>
              <DirectCallButton phone={lead.phone} leadId={lead._id} size="xs" label="Call" />
            </div>
          )}
          {lead.email && (
            <div className="flex items-center">
              <Mail className="w-3.5 h-3.5 mr-2 text-slate-400" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
        </div>

        {/* Caller Info (if admin) */}
        {showCallerInfo && (
          <div className="flex items-center space-x-2 my-2 py-1.5 px-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl text-[11px] text-indigo-700 dark:text-indigo-300">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Caller: {lead.callerName}</span>
          </div>
        )}

        {/* Latest Update Box */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 my-3 shadow-2xs">
          <p className="text-[11px] text-slate-700 dark:text-slate-300 italic line-clamp-2 font-medium">
            "{lead.latestUpdate || 'No updates logged yet'}"
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Updated {formatTimeAgo(lead.updatedAt)}
          </span>
        </div>
      </div>

      {/* Footer Info & Actions */}
      <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onQuickNote(lead)}
          className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold px-3 py-1.5 rounded-xl shadow-sm transition-all"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Add Update</span>
        </button>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => onCompleteFollowUp(lead)}
            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
            title="Complete Follow-up"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEditLead(lead)}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDeleteLead(lead)}
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
