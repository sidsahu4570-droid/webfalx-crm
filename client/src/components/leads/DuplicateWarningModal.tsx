import React from 'react';
import { Modal } from '../common/Modal';
import { Lead } from '../../types';
import { DuplicateConfidence } from '../../utils/duplicateDetector';
import { AlertTriangle, User, Building, Phone, Mail, ShieldAlert, ArrowRight } from 'lucide-react';

interface DuplicateWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  confidence: DuplicateConfidence;
  matchedLead: Lead | null;
  reason: string;
  onSkip: () => void;
  onUpdateExisting?: () => void;
  onSaveAnyway: () => void;
}

export const DuplicateWarningModal: React.FC<DuplicateWarningModalProps> = ({
  isOpen,
  onClose,
  confidence,
  matchedLead,
  reason,
  onSkip,
  onUpdateExisting,
  onSaveAnyway
}) => {
  if (!matchedLead) return null;

  const getConfidenceBadge = () => {
    switch (confidence) {
      case 'Strong':
      case 'High':
        return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'Possible':
      default:
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Possible Duplicate Lead Detected"
      subtitle="An existing prospect record matching these details was found in your CRM."
    >
      <div className="space-y-4">
        {/* Warning Banner */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 p-4 rounded-2xl flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className={`inline-block px-2 py-0.5 rounded-full font-extrabold text-[10px] border mb-1 ${getConfidenceBadge()}`}>
              {confidence.toUpperCase()} CONFIDENCE MATCH
            </span>
            <p className="font-semibold text-slate-800 dark:text-slate-200">{reason}</p>
          </div>
        </div>

        {/* Existing Lead Details Box */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl space-y-2 text-xs">
          <h4 className="font-bold text-slate-900 dark:text-white flex items-center">
            <User className="w-4 h-4 mr-1.5 text-indigo-500" />
            Existing Lead Profile: {matchedLead.name}
          </h4>

          <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300 font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">Company</span>
              <span className="font-bold">{matchedLead.company || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">Mobile Number</span>
              <span className="font-bold">{matchedLead.phone || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">Email</span>
              <span>{matchedLead.email || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">Assigned Caller</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{matchedLead.callerName}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onSkip}
            className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-slate-200 transition-all"
          >
            Skip Duplicate
          </button>

          {onUpdateExisting && (
            <button
              type="button"
              onClick={onUpdateExisting}
              className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md transition-all"
            >
              Update Existing Lead
            </button>
          )}

          <button
            type="button"
            onClick={onSaveAnyway}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition-all"
          >
            Save / Import Anyway
          </button>
        </div>
      </div>
    </Modal>
  );
};
