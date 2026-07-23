import React from 'react';
import { LeadStatus, LeadPriority, User } from '../../types';
import { Filter, CalendarClock } from 'lucide-react';

interface FilterDropdownProps {
  status: string;
  setStatus: (status: string) => void;
  priority: string;
  setPriority: (priority: string) => void;
  dueOnly: boolean;
  setDueOnly: (dueOnly: boolean) => void;
  callerId?: string;
  setCallerId?: (callerId: string) => void;
  callers?: User[];
  sortBy?: string;
  setSortBy?: (sort: string) => void;
  categoryId?: string;
  setCategoryId?: (categoryId: string) => void;
  categories?: any[];
  onReset?: () => void;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  status,
  setStatus,
  priority,
  setPriority,
  dueOnly,
  setDueOnly,
  callerId,
  setCallerId,
  callers = [],
  sortBy = 'updatedAt',
  setSortBy,
  categoryId,
  setCategoryId,
  categories = [],
  onReset
}) => {
  const statuses: (LeadStatus | 'All')[] = [
    'All',
    'New',
    'Interested',
    'Follow-up',
    'Meeting Scheduled',
    'Converted',
    'Not Interested',
    'Closed'
  ];

  const priorities: (LeadPriority | 'All')[] = ['All', 'High', 'Medium', 'Low'];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Due Followups Quick Filter */}
      <button
        type="button"
        onClick={() => setDueOnly(!dueOnly)}
        className={`flex items-center space-x-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${
          dueOnly
            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 shadow-sm'
            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
        }`}
      >
        <CalendarClock className="w-3.5 h-3.5 text-amber-500" />
        <span>Due Follow-ups Only</span>
      </button>

      {/* Status Select */}
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
      >
        <option value="All">Status: All</option>
        {statuses.filter((s) => s !== 'All').map((st) => (
          <option key={st} value={st}>
            Status: {st}
          </option>
        ))}
      </select>

      {/* Priority Select */}
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
      >
        <option value="All">Priority: All</option>
        {priorities.filter((p) => p !== 'All').map((pr) => (
          <option key={pr} value={pr}>
            Priority: {pr}
          </option>
        ))}
      </select>

      {/* Admin Caller Filter */}
      {setCallerId && callers.length > 0 && (
        <select
          value={callerId || ''}
          onChange={(e) => setCallerId(e.target.value)}
          className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl px-3 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          <option value="">Caller: All Callers</option>
          {callers.map((caller) => (
            <option key={caller.id} value={caller.id}>
              Caller: {caller.name}
            </option>
          ))}
        </select>
      )}

      {/* Category Select */}
      {setCategoryId && categories && categories.length > 0 && (
        <select
          value={categoryId || 'All'}
          onChange={(e) => setCategoryId(e.target.value)}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          <option value="All">Category: All</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              Category: {c.name}
            </option>
          ))}
        </select>
      )}

      {/* Sort By Select */}
      {setSortBy && (
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          <option value="updatedAt">Sort: Recently Updated</option>
          <option value="newest">Sort: Newest First</option>
          <option value="nextFollowUp">Sort: Next Follow-up</option>
          <option value="name">Sort: Prospect Name</option>
        </select>
      )}

      {/* Reset Filter Button */}
      {onReset && (status !== 'All' || priority !== 'All' || dueOnly || callerId) && (
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-1"
        >
          Reset Filters
        </button>
      )}
    </div>
  );
};
