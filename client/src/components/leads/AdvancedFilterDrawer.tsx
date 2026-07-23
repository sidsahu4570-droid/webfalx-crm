import React, { useState } from 'react';
import { User, LeadStatus, LeadPriority } from '../../types';
import { Filter, X, Bookmark, RotateCcw, Check, Sparkles, AlertTriangle, Hash } from 'lucide-react';

export interface AdvancedFilterState {
  name?: string;
  phone?: string;
  email?: string;
  company?: string;
  city?: string;
  status?: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
  followUpStartDate?: string;
  followUpEndDate?: string;
  callerId?: string;
  source?: string;
  leadType?: string;
  duplicateOnly?: boolean;
  serialNumber?: number;
  serialNumberStart?: number;
  serialNumberEnd?: number;
}

interface AdvancedFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: AdvancedFilterState;
  onApplyFilters: (newFilters: AdvancedFilterState) => void;
  onResetFilters: () => void;
  callers?: User[];
  isAdmin?: boolean;
}

export const AdvancedFilterDrawer: React.FC<AdvancedFilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  onResetFilters,
  callers = [],
  isAdmin = false
}) => {
  const [localFilters, setLocalFilters] = useState<AdvancedFilterState>(filters);
  const [presetName, setPresetName] = useState('');
  const [savedPresets, setSavedPresets] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('crm_saved_filter_presets');
      return stored ? JSON.parse(stored) : ['Interested Leads', 'Follow-up Due Today', 'Duplicate Leads'];
    } catch (e) {
      return ['Interested Leads', 'Follow-up Due Today', 'Duplicate Leads'];
    }
  });

  if (!isOpen) return null;

  const handleChange = (key: keyof AdvancedFilterState, value: any) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    setLocalFilters({});
    onResetFilters();
    onClose();
  };

  const applyQuickPreset = (preset: string) => {
    if (preset === 'Follow-up Due Today') {
      const today = new Date().toISOString().split('T')[0];
      setLocalFilters({ followUpStartDate: today, followUpEndDate: today });
    } else if (preset === 'Interested Leads') {
      setLocalFilters({ status: 'Interested' });
    } else if (preset === 'Duplicate Leads') {
      setLocalFilters({ duplicateOnly: true });
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs" />

      {/* Drawer Container */}
      <aside className="fixed top-0 right-0 z-50 w-80 md:w-96 h-screen bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Advanced Multi-Criteria Filters
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Form Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Quick Presets */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Quick Presets
            </span>
            <div className="flex flex-wrap gap-1.5">
              {savedPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => applyQuickPreset(preset)}
                  className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 px-2.5 py-1 rounded-xl text-[11px] font-bold hover:bg-indigo-100 transition-all"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Serial Number Filters */}
          <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
            <label className="block text-slate-800 dark:text-slate-200 font-bold flex items-center">
              <Hash className="w-3.5 h-3.5 mr-1 text-indigo-500" />
              Serial Number (S. No.) Filter
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 block">Exact S. No.</span>
                <input
                  type="number"
                  value={localFilters.serialNumber || ''}
                  onChange={(e) => handleChange('serialNumber', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="e.g. 25"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Range Start</span>
                <input
                  type="number"
                  value={localFilters.serialNumberStart || ''}
                  onChange={(e) => handleChange('serialNumberStart', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Min S. No."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Lead Details Filters */}
          <div className="space-y-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Prospect Name
              </label>
              <input
                type="text"
                value={localFilters.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Filter by name..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Mobile Number
                </label>
                <input
                  type="text"
                  value={localFilters.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="Phone..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={localFilters.company || ''}
                  onChange={(e) => handleChange('company', e.target.value)}
                  placeholder="Company..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Status & Priority */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Lead Status
                </label>
                <select
                  value={localFilters.status || ''}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                >
                  <option value="">All Statuses</option>
                  <option value="New">New</option>
                  <option value="Interested">Interested</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Meeting Scheduled">Meeting Scheduled</option>
                  <option value="Converted">Converted</option>
                  <option value="Not Interested">Not Interested</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Priority
                </label>
                <select
                  value={localFilters.priority || ''}
                  onChange={(e) => handleChange('priority', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                >
                  <option value="">All Priorities</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            {/* Admin Caller Filter */}
            {isAdmin && (
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Assigned Calling Agent
                </label>
                <select
                  value={localFilters.callerId || ''}
                  onChange={(e) => handleChange('callerId', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                >
                  <option value="">All Calling Agents</option>
                  {callers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Follow-up Date Range */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Follow-up Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={localFilters.followUpStartDate || ''}
                  onChange={(e) => handleChange('followUpStartDate', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1 text-xs text-slate-900 dark:text-white"
                />
                <input
                  type="date"
                  value={localFilters.followUpEndDate || ''}
                  onChange={(e) => handleChange('followUpEndDate', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Duplicate Filter Toggle */}
            <div className="pt-2">
              <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  checked={!!localFilters.duplicateOnly}
                  onChange={(e) => handleChange('duplicateOnly', e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mr-1.5" />
                  Show Only Duplicate Leads
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold px-3 py-2 rounded-xl hover:bg-slate-200"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center justify-center space-x-1"
          >
            <Check className="w-4 h-4" />
            <span>Apply Filters</span>
          </button>
        </div>
      </aside>
    </>
  );
};
