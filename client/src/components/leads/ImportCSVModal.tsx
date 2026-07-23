import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { parseCSVFile } from '../../utils/csv';
import { FileSpreadsheet, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

interface ImportCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (leads: any[]) => Promise<void>;
}

export const ImportCSVModal: React.FC<ImportCSVModalProps> = ({
  isOpen,
  onClose,
  onImport
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      try {
        const data = await parseCSVFile(selectedFile);
        if (!data || data.length === 0) {
          setError('CSV file is empty or invalid format.');
          return;
        }
        setParsedData(data);
      } catch (err: any) {
        setError('Failed to parse CSV file. Ensure valid comma-separated format.');
      }
    }
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;
    setLoading(true);
    try {
      // Normalize columns
      const normalizedLeads = parsedData.map((row) => ({
        name: row['Prospect Name'] || row['name'] || row['Name'] || row['Prospect'],
        company: row['Company'] || row['company'] || '',
        email: row['Email'] || row['email'] || '',
        phone: row['Phone'] || row['phone'] || '',
        address: row['Address'] || row['address'] || '',
        source: row['Source'] || row['source'] || 'CSV Import',
        status: row['Status'] || row['status'] || 'New',
        priority: row['Priority'] || row['priority'] || 'Medium',
        note: row['Latest Update'] || row['Note'] || row['note'] || ''
      }));

      await onImport(normalizedLeads);
      setFile(null);
      setParsedData([]);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Import failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Prospects from CSV"
      subtitle="Upload a CSV file containing columns like Name, Company, Email, Phone, Status"
      maxWidth="max-w-xl"
    >
      <div className="space-y-5">
        {/* Upload Zone */}
        <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center bg-slate-50/50 dark:bg-slate-900/50">
          <FileSpreadsheet className="w-10 h-10 text-indigo-500 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {file ? file.name : 'Select or drag your CSV file here'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Supports standard CSV spreadsheets</p>

          <label className="mt-4 inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md shadow-indigo-500/20 cursor-pointer transition-all">
            <Upload className="w-4 h-4" />
            <span>Choose CSV File</span>
            <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
          </label>
        </div>

        {error && (
          <div className="flex items-center space-x-2 p-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* CSV Preview */}
        {parsedData.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Preview Data ({parsedData.length} records ready)
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Valid CSV Structure
              </span>
            </div>

            <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl p-2 bg-white dark:bg-slate-900 text-[11px]">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                    <th className="p-1.5">Name</th>
                    <th className="p-1.5">Company</th>
                    <th className="p-1.5">Email</th>
                    <th className="p-1.5">Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {parsedData.slice(0, 5).map((row, idx) => (
                    <tr key={idx}>
                      <td className="p-1.5 font-semibold text-slate-800 dark:text-slate-200">
                        {row['Prospect Name'] || row['name'] || row['Name'] || 'N/A'}
                      </td>
                      <td className="p-1.5 text-slate-500">{row['Company'] || row['company'] || '-'}</td>
                      <td className="p-1.5 text-slate-500">{row['Email'] || row['email'] || '-'}</td>
                      <td className="p-1.5 text-slate-500">{row['Phone'] || row['phone'] || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedData.length > 5 && (
                <p className="text-[10px] text-slate-400 text-center py-1">
                  ...and {parsedData.length - 5} more records
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={parsedData.length === 0 || loading}
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-md transition-all"
          >
            {loading ? 'Importing...' : `Import ${parsedData.length} Prospects`}
          </button>
        </div>
      </div>
    </Modal>
  );
};
