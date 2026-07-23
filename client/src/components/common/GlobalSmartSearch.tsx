import React, { useState, useEffect, useRef } from 'react';
import { leadService } from '../../services/leadService';
import { Lead } from '../../types';
import { Search, X, User, Building, Phone, ArrowRight, Sparkles } from 'lucide-react';
import { getStatusBadgeStyle } from '../../utils/formatters';
import { DirectCallButton } from './DirectCallButton';

interface GlobalSmartSearchProps {
  onSelectLead: (lead: Lead) => void;
}

export const GlobalSmartSearch: React.FC<GlobalSmartSearchProps> = ({ onSelectLead }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await leadService.getLeads({ search: searchTerm.trim(), limit: 8 });
        if (res.success && res.leads) {
          setResults(res.leads);
          setOpen(true);
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md">
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Global Smart Search (Name, Phone, Email, Company, Status)..."
          className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl pl-9 pr-8 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
        />
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm('');
              setResults([]);
              setOpen(false);
            }}
            className="absolute right-2.5 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Instant Search Dropdown Results */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          <div className="p-2 bg-slate-50 dark:bg-slate-800/40 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Smart Search Results ({results.length})</span>
            {loading && <span>Searching...</span>}
          </div>

          {results.length > 0 ? (
            results.map((lead) => (
              <div
                key={lead._id}
                onClick={() => {
                  onSelectLead(lead);
                  setOpen(false);
                }}
                className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      {lead.name}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getStatusBadgeStyle(lead.status)}`}>
                      {lead.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center space-x-2 font-mono">
                    {lead.company && (
                      <span className="flex items-center">
                        <Building className="w-3 h-3 mr-1" />
                        {lead.company}
                      </span>
                    )}
                    {lead.phone && (
                      <span className="flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{lead.phone}</span>
                        <DirectCallButton phone={lead.phone} leadId={lead._id} size="xs" label="Call" />
                      </span>
                    )}
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-slate-400 italic">
              No matching prospects found for "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};
