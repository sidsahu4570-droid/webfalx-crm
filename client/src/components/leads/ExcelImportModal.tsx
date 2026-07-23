import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { User, ImportHistoryRecord, LeadCategory, City } from '../../types';
import { leadService } from '../../services/leadService';
import { categoryService } from '../../services/categoryService';
import { cityService } from '../../services/cityService';
import { useToast } from '../../context/ToastContext';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, UserCheck, ArrowRight, RefreshCw, Layers, Folder, MapPin } from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  callers: User[];
  onImportComplete: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  callers,
  onImportComplete
}) => {
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [assignedCallerId, setAssignedCallerId] = useState('');
  const [duplicateAction, setDuplicateAction] = useState<'skip' | 'update'>('skip');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<LeadCategory[]>([]);
  const [cityId, setCityId] = useState('');
  const [cities, setCities] = useState<City[]>([]);

  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportHistoryRecord | null>(null);

  useEffect(() => {
    if (isOpen) {
      categoryService.getCategories().then((res) => {
        if (res.success) {
          setCategories(res.categories);
        }
      });
      cityService.getCities().then((res) => {
        if (res.success) {
          setCities(res.cities);
        }
      });
    }
  }, [isOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const fileExt = file.name.split('.').pop()?.toLowerCase();

    if (fileExt === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setParsedRows(results.data);
          setStep(2);
        },
        error: (err) => {
          toast('Parse Error', err.message, 'error');
        }
      });
    } else if (fileExt === 'xlsx' || fileExt === 'xls') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const workbook = XLSX.read(bstr, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const data = XLSX.utils.sheet_to_json(worksheet);
          setParsedRows(data);
          setStep(2);
        } catch (err: any) {
          toast('Excel Read Error', err.message, 'error');
        }
      };
      reader.readAsBinaryString(file);
    } else {
      toast('Unsupported File', 'Please upload a valid .xlsx, .xls or .csv file', 'error');
    }
  };

  const handleExecuteImport = async () => {
    if (!assignedCallerId) {
      toast('Select Caller', 'Please select a caller to assign the imported leads', 'error');
      return;
    }
    if (!categoryId) {
      toast('Select Category', 'Please select a lead category for imported leads', 'error');
      return;
    }
    if (!cityId) {
      toast('Select City', 'Please select a city for imported leads', 'error');
      return;
    }

    setImporting(true);
    setProgress(30);

    try {
      setProgress(60);
      const res = await leadService.importExcelLeads({
        fileName,
        assignedCallerId,
        duplicateAction,
        leads: parsedRows,
        categoryId,
        cityId
      });

      setProgress(100);
      if (res.success) {
        setImportResult(res.history);
        setStep(6);
        onImportComplete();
      }
    } catch (err: any) {
      toast('Import Error', err.response?.data?.message || err.message, 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setFileName('');
    setParsedRows([]);
    setAssignedCallerId('');
    setCategoryId('');
    setCityId('');
    setImportResult(null);
    setProgress(0);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleReset}
      title="Excel & CSV Lead Import System"
      subtitle="Import leads, assign categories, and route automatically to New Leads queue"
      maxWidth="max-w-3xl"
    >
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div className={`flex items-center space-x-2 text-xs font-bold ${step >= 1 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
          <span>Upload</span>
        </div>
        <div className="w-4 h-0.5 bg-slate-200 dark:bg-slate-700" />
        <div className={`flex items-center space-x-2 text-xs font-bold ${step >= 2 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
          <span>Preview</span>
        </div>
        <div className="w-4 h-0.5 bg-slate-200 dark:bg-slate-700" />
        <div className={`flex items-center space-x-2 text-xs font-bold ${step >= 3 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>3</div>
          <span>Caller</span>
        </div>
        <div className="w-4 h-0.5 bg-slate-200 dark:bg-slate-700" />
        <div className={`flex items-center space-x-2 text-xs font-bold ${step >= 4 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${step >= 4 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>4</div>
          <span>Category</span>
        </div>
        <div className="w-4 h-0.5 bg-slate-200 dark:bg-slate-700" />
        <div className={`flex items-center space-x-2 text-xs font-bold ${step >= 5 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${step >= 5 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>5</div>
          <span>City</span>
        </div>
        <div className="w-4 h-0.5 bg-slate-200 dark:bg-slate-700" />
        <div className={`flex items-center space-x-2 text-xs font-bold ${step === 6 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${step === 6 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>6</div>
          <span>Summary</span>
        </div>
      </div>

      {/* Step 1: Upload File */}
      {step === 1 && (
        <div className="space-y-4 text-center py-6">
          <div className="border-2 border-dashed border-indigo-300 dark:border-indigo-800 rounded-3xl p-8 bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-955 transition-all cursor-pointer relative">
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <FileSpreadsheet className="w-12 h-12 text-indigo-600 dark:text-indigo-400 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Click to Upload or Drag & Drop Excel / CSV
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Supports .xlsx, .xls, and .csv files
            </p>
          </div>
        </div>
      )}

      {/* Step 2: Preview Data */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900 dark:text-white">📄 {fileName}</span>
            <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-95 dark:text-indigo-300 px-2.5 py-0.5 rounded-full font-bold">
              {parsedRows.length} Rows Detected
            </span>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Data Preview (First 5 Rows)
            </h4>
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl max-h-56">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="p-2 w-16">S. No.</th>
                    <th className="p-2">Name</th>
                    <th className="p-2">Phone</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Company</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {parsedRows.slice(0, 5).map((row, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-bold text-indigo-600 dark:text-indigo-400">
                        #{row['S. No.'] || row['S.No.'] || row['S.No'] || row.SNo || row['Serial Number'] || idx + 1}
                      </td>
                      <td className="p-2 font-bold text-slate-900 dark:text-white">
                        {row.name || row.Name || row['Prospect Name'] || row.company || row.Company || row['Company Name'] || 'N/A'}
                      </td>
                      <td className="p-2 text-slate-600 dark:text-slate-300">
                        {row.phone || row.Phone || row['Phone Number'] || 'N/A'}
                      </td>
                      <td className="p-2 text-slate-600 dark:text-slate-300">
                        {row.email || row.Email || 'N/A'}
                      </td>
                      <td className="p-2 text-slate-500">
                        {row.company || row.Company || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold px-4 py-2 rounded-xl"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2 rounded-xl shadow-md flex items-center space-x-1.5"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Select Caller */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Assign Leads To Caller *
              </label>
              <select
                value={assignedCallerId}
                onChange={(e) => setAssignedCallerId(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white"
              >
                <option value="">Select Caller...</option>
                {callers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Duplicate Handling Option
              </label>
              <select
                value={duplicateAction}
                onChange={(e) => setDuplicateAction(e.target.value as 'skip' | 'update')}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white"
              >
                <option value="skip">Skip Duplicates (Recommended)</option>
                <option value="update">Update & Reassign Duplicates</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold px-4 py-2 rounded-xl"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => {
                if (!assignedCallerId) {
                  toast('Select Caller', 'Please select a caller to assign leads', 'error');
                  return;
                }
                setStep(4);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2 rounded-xl shadow-md flex items-center space-x-1.5"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Select Lead Category */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="py-4 space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Select Lead Category * (Every imported lead inherits this category)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white"
              >
                <option value="">Select Category...</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-900 text-xs text-indigo-700 dark:text-indigo-300 flex items-start space-x-2">
                <Folder className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                <span>Assigning a category groups leads for easy searching, filtering, and team-wise reporting logs.</span>
              </div>
            </div>
          </div>

          {importing && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-indigo-600 font-bold">
                <span>Importing leads into New Leads...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              disabled={importing}
              onClick={() => setStep(3)}
              className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold px-4 py-2 rounded-xl"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => {
                if (!categoryId) {
                  toast('Select Category', 'Please select a lead category', 'error');
                  return;
                }
                setStep(5);
              }}
              disabled={!categoryId}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold px-5 py-2 rounded-xl shadow-md flex items-center space-x-1.5"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Select City */}
      {step === 5 && (
        <div className="space-y-4">
          <div className="py-4 space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Select City / Coverage Area * (Every imported lead inherits this city)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white"
              >
                <option value="">Select City...</option>
                {cities.map((city) => (
                  <option key={city._id} value={city._id}>
                    {city.name}
                  </option>
                ))}
              </select>
              <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-900 text-xs text-indigo-700 dark:text-indigo-300 flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                <span>Assigning a city groups leads for geographical mapping, region filters, and localized performance tracking.</span>
              </div>
            </div>
          </div>

          {importing && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-indigo-600 font-bold">
                <span>Importing leads into New Leads...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              disabled={importing}
              onClick={() => setStep(4)}
              className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold px-4 py-2 rounded-xl"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={importing || !cityId}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md flex items-center space-x-1.5"
            >
              <span>{importing ? 'Importing...' : 'Execute Import'}</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 6: Summary */}
      {step === 6 && importResult && (
        <div className="space-y-5 text-center py-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Lead Import Completed!
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              All imported leads assigned to <strong className="text-indigo-600">{importResult.assignedCallerName}</strong> and routed to <strong>New Leads</strong>.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs text-left">
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl">
              <span className="text-slate-400 text-[10px] block font-sans">Total Rows</span>
              <span className="text-base font-extrabold text-slate-900 dark:text-white">{importResult.totalRows}</span>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-2xl">
              <span className="text-emerald-700 dark:text-emerald-400 text-[10px] block font-sans">Successful Imports</span>
              <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{importResult.successfulImports}</span>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-2xl">
              <span className="text-amber-700 dark:text-amber-400 text-[10px] block font-sans">Duplicates ({importResult.duplicateAction})</span>
              <span className="text-base font-extrabold text-amber-600 dark:text-amber-400">{importResult.duplicateCount}</span>
            </div>
            <div className="bg-rose-50 dark:bg-rose-950/40 p-3 rounded-2xl">
              <span className="text-rose-700 dark:text-rose-400 text-[10px] block font-sans">Skipped / Failed</span>
              <span className="text-base font-extrabold text-rose-600 dark:text-rose-400">{importResult.failedImports}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md"
          >
            Done
          </button>
        </div>
      )}
    </Modal>
  );
};
