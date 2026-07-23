import React, { useState, useEffect } from 'react';
import { deletedRecordService } from '../services/deletedRecordService';
import { DeletedRecord } from '../types';
import { LoadingSpinner } from '../components/common/SkeletonLoader';
import { useToast } from '../context/ToastContext';
import { formatDate, formatDateTime } from '../utils/formatters';
import { exportCustomDataToCSV } from '../utils/csv';
import { Trash2, RotateCcw, Search, Filter, ShieldAlert, Download, Calendar, DollarSign, UserCheck } from 'lucide-react';

export const DeletedHistoryPage: React.FC = () => {
  const { toast } = useToast();
  const [records, setRecords] = useState<DeletedRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [collectionName, setCollectionName] = useState('');
  const [projectType, setProjectType] = useState('');
  const [callerName, setCallerName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await deletedRecordService.getDeletedRecords({
        search: search || undefined,
        collectionName: collectionName || undefined,
        projectType: projectType || undefined,
        callerName: callerName || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      });
      if (res.success) setRecords(res.records);
    } catch (err: any) {
      toast('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [collectionName, projectType, startDate, endDate]);

  const handleRestore = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to restore '${name}' back to active CRM modules?`)) return;
    try {
      const res = await deletedRecordService.restoreRecord(id);
      if (res.success) {
        toast('Restored', res.message, 'success');
        fetchRecords();
      }
    } catch (err: any) {
      toast('Error', err.message, 'error');
    }
  };

  const handlePermanentDelete = async (id: string, name: string) => {
    if (!window.confirm(`⚠️ PERMANENT DELETE WARNING: This action CANNOT be undone!\nAre you sure you want to permanently purge '${name}' and all associated references?`)) return;
    try {
      const res = await deletedRecordService.permanentDeleteRecord(id);
      if (res.success) {
        toast('Permanently Purged', res.message, 'info');
        fetchRecords();
      }
    } catch (err: any) {
      toast('Error', err.message, 'error');
    }
  };

  const handleExport = () => {
    const dataToExport = records.map((r) => ({
      'Client Name': r.clientName,
      'Company': r.company || 'N/A',
      'Phone': r.phone || 'N/A',
      'Email': r.email || 'N/A',
      'Project Type': r.projectType || 'N/A',
      'Total Amount': r.totalAmount || 0,
      'Paid Amount': r.paidAmount || 0,
      'Pending Amount': r.pendingAmount || 0,
      'Original Caller': r.callerName || 'N/A',
      'Collection': r.collectionName,
      'Deletion Date': formatDateTime(r.deletionDate),
      'Deleted By': r.deletedBy,
      'Deleted By Role': r.deletedByRole,
      'Deletion Reason': r.deletionReason || 'N/A'
    }));

    exportCustomDataToCSV(dataToExport, `Deleted_Clients_Archive_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const formatINR = (val: number = 0) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-slate-950 text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-wider bg-rose-500/20 text-rose-300 px-3 py-1 rounded-full border border-rose-500/30">
            Admin Portal • Soft Delete Vault & Archive
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2 flex items-center">
            <Trash2 className="w-7 h-7 mr-2 text-rose-400" />
            Deleted Clients History & Trash Archive
          </h2>
          <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-xl">
            Deleted clients are safely preserved here without breaking live CRM calculations. Admin can restore records anytime with automatic real-time recalculation.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-lg transition-all shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export Archive (CSV)</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchRecords()}
              placeholder="Search by client name, company, phone, email..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white"
            />
            <button
              onClick={fetchRecords}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3.5 py-1.5 rounded-xl shrink-0"
            >
              Search
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-800 dark:text-slate-200 font-bold"
            >
              <option value="">All Collections</option>
              <option value="ConvertedClient">Converted Clients</option>
              <option value="Lead">Leads</option>
            </select>

            <select
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-800 dark:text-slate-200 font-bold"
            >
              <option value="">All Project Types</option>
              <option value="website">Website Project</option>
              <option value="app">App Project</option>
            </select>
          </div>
        </div>

        {/* Second Filter Row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-1.5">
            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={callerName}
              onChange={(e) => setCallerName(e.target.value)}
              placeholder="Filter caller..."
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1 text-slate-900 dark:text-white w-32"
            />
          </div>

          <div className="flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 text-[11px]">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1 text-slate-900 dark:text-white"
            />
            <span className="text-slate-500 text-[11px]">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1 text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Records Table */}
      {loading ? (
        <LoadingSpinner text="Fetching deleted client archive..." />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Client Name & Details</th>
                  <th className="py-3 px-4">Project Type</th>
                  <th className="py-3 px-4">Deal Amount (₹)</th>
                  <th className="py-3 px-4">Caller</th>
                  <th className="py-3 px-4">Deletion Date</th>
                  <th className="py-3 px-4">Deleted By</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-mono">
                {records.length > 0 ? (
                  records.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-sans font-bold text-slate-900 dark:text-white">
                        {r.clientName}
                        <span className="text-[10px] text-slate-400 block font-normal">
                          {r.company || 'N/A'} • {r.phone || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-sans">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          r.projectType === 'app'
                            ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                            : 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
                        }`}>
                          {r.projectType === 'app' ? 'App Project' : 'Website Project'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white font-mono">
                        {formatINR(r.totalAmount)}
                        <span className="text-[10px] text-emerald-600 block font-normal">
                          Paid: {formatINR(r.paidAmount)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-sans text-slate-700 dark:text-slate-300 font-semibold">
                        {r.callerName || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 font-sans text-slate-500 text-[11px]">
                        {formatDateTime(r.deletionDate)}
                      </td>
                      <td className="py-3.5 px-4 font-sans text-slate-700 dark:text-slate-300 font-semibold">
                        {r.deletedBy} ({r.deletedByRole})
                      </td>
                      <td className="py-3.5 px-4 font-sans text-slate-500 italic">
                        {r.deletionReason || 'Soft deleted'}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5 font-sans">
                        <button
                          onClick={() => handleRestore(r._id, r.clientName)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-xl shadow-sm inline-flex items-center space-x-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restore Client</span>
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(r._id, r.clientName)}
                          className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-xl shadow-sm inline-flex items-center space-x-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Purge</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-xs text-slate-400 italic font-sans">
                      No deleted clients found in Trash Archive.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
