import { formatDistanceToNow, isPast, isToday } from 'date-fns';
import { LeadStatus, LeadPriority } from '../types';

export const formatDate = (dateStr?: string | Date): string => {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata'
    });
  } catch (e) {
    return 'Invalid Date';
  }
};

export const formatDateTime = (dateStr?: string | Date): string => {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });
  } catch (e) {
    return 'Invalid Date';
  }
};

export const formatTimeAgo = (dateStr?: string | Date): string => {
  if (!dateStr) return 'N/A';
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch (e) {
    return 'Recently';
  }
};

export const isFollowUpDue = (dateStr?: string | Date): boolean => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  return isPast(date) || isToday(date);
};

// Exact Lead Status Badge Styles
export const getStatusBadgeStyle = (status: LeadStatus) => {
  switch (status) {
    case 'Converted':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700';
    case 'Closed':
    case 'Not Interested':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-700';
    case 'Follow-up':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300 dark:border-blue-700';
    case 'Not Picked':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border-orange-300 dark:border-orange-700 font-bold';
    case 'Interested':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-700';
    case 'Meeting Scheduled':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-300 dark:border-purple-700';
    case 'New':
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
  }
};

// Lead Table Row Dynamic Background & Left Accent Border
export const getStatusRowStyle = (status: LeadStatus) => {
  switch (status) {
    case 'Converted':
      return 'bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/30 border-l-4 border-l-emerald-500';
    case 'Closed':
    case 'Not Interested':
      return 'bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-100/60 dark:hover:bg-rose-900/30 border-l-4 border-l-rose-500';
    case 'Not Picked':
      return 'bg-orange-50/40 dark:bg-orange-950/20 hover:bg-orange-100/60 dark:hover:bg-orange-900/30 border-l-4 border-l-orange-500';
    case 'Follow-up':
      return 'bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-100/60 dark:hover:bg-blue-900/30 border-l-4 border-l-blue-500';
    case 'Interested':
      return 'bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-100/60 dark:hover:bg-amber-900/30 border-l-4 border-l-amber-500';
    case 'Meeting Scheduled':
      return 'bg-purple-50/40 dark:bg-purple-950/20 hover:bg-purple-100/60 dark:hover:bg-purple-900/30 border-l-4 border-l-purple-500';
    case 'New':
    default:
      return 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40 border-l-4 border-l-slate-400';
  }
};

// Lead Card Dynamic Container Style
export const getStatusCardStyle = (status: LeadStatus) => {
  switch (status) {
    case 'Converted':
      return 'bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-950/30 dark:to-slate-900 border-emerald-300 dark:border-emerald-800/60 shadow-emerald-500/5 hover:border-emerald-500';
    case 'Closed':
    case 'Not Interested':
      return 'bg-gradient-to-br from-rose-50/80 to-white dark:from-rose-950/30 dark:to-slate-900 border-rose-300 dark:border-rose-800/60 shadow-rose-500/5 hover:border-rose-500';
    case 'Not Picked':
      return 'bg-gradient-to-br from-orange-50/80 to-white dark:from-orange-950/30 dark:to-slate-900 border-orange-300 dark:border-orange-800/60 shadow-orange-500/5 hover:border-orange-500';
    case 'Follow-up':
      return 'bg-gradient-to-br from-blue-50/80 to-white dark:from-blue-950/30 dark:to-slate-900 border-blue-300 dark:border-blue-800/60 shadow-blue-500/5 hover:border-blue-500';
    case 'Interested':
      return 'bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-950/30 dark:to-slate-900 border-amber-300 dark:border-amber-800/60 shadow-amber-500/5 hover:border-amber-500';
    case 'Meeting Scheduled':
      return 'bg-gradient-to-br from-purple-50/80 to-white dark:from-purple-950/30 dark:to-slate-900 border-purple-300 dark:border-purple-800/60 shadow-purple-500/5 hover:border-purple-500';
    case 'New':
    default:
      return 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-500/50';
  }
};

// Hex Colors for Recharts Pie and Bar Charts
export const getStatusColorHex = (status: LeadStatus): string => {
  switch (status) {
    case 'Converted':
      return '#10b981'; // Green
    case 'Closed':
    case 'Not Interested':
      return '#ef4444'; // Red
    case 'Not Picked':
      return '#f97316'; // Orange
    case 'Follow-up':
      return '#3b82f6'; // Blue
    case 'Interested':
      return '#f59e0b'; // Amber/Yellow
    case 'Meeting Scheduled':
      return '#8b5cf6'; // Purple
    case 'New':
    default:
      return '#64748b'; // Gray
  }
};

export const getPriorityBadgeStyle = (priority: LeadPriority) => {
  switch (priority) {
    case 'High':
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    case 'Medium':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    case 'Low':
      return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    default:
      return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
  }
};
