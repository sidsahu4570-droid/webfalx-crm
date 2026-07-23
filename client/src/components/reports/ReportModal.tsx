import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { DailyReport, User } from '../../types';
import { formatDate } from '../../utils/formatters';
import {
  FileText,
  PhoneCall,
  PhoneOff,
  CheckCircle2,
  Calendar,
  Clock,
  MessageCircle,
  AlertCircle,
  Lock,
  Unlock,
  Send
} from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<DailyReport>) => Promise<void>;
  initialReport?: DailyReport | null;
  isAdmin?: boolean;
  callers?: User[];
  loading?: boolean;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialReport,
  isAdmin = false,
  callers = [],
  loading = false
}) => {
  const [reportDate, setReportDate] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [targetUserId, setTargetUserId] = useState('');
  const [totalCalls, setTotalCalls] = useState(0);
  const [connectedCalls, setConnectedCalls] = useState(0);
  const [notPickedCalls, setNotPickedCalls] = useState(0);
  const [followUpsDone, setFollowUpsDone] = useState(0);
  const [followUpsPending, setFollowUpsPending] = useState(0);
  const [interestedClients, setInterestedClients] = useState(0);
  const [convertedClients, setConvertedClients] = useState(0);
  const [notInterestedClients, setNotInterestedClients] = useState(0);
  const [meetingsScheduled, setMeetingsScheduled] = useState(0);
  const [whatsappMessagesSent, setWhatsappMessagesSent] = useState(0);
  const [remarks, setRemarks] = useState('');

  // Timer logic for Admin Unlock
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  useEffect(() => {
    if (initialReport) {
      setReportDate(
        new Date(initialReport.reportDate).toISOString().substring(0, 10)
      );
      setTargetUserId(initialReport.userId);
      setTotalCalls(initialReport.totalCalls || 0);
      setConnectedCalls(initialReport.connectedCalls || 0);
      setNotPickedCalls(initialReport.notPickedCalls || 0);
      setFollowUpsDone(initialReport.followUpsDone || 0);
      setFollowUpsPending(initialReport.followUpsPending || 0);
      setInterestedClients(initialReport.interestedClients || 0);
      setConvertedClients(initialReport.convertedClients || 0);
      setNotInterestedClients(initialReport.notInterestedClients || 0);
      setMeetingsScheduled(initialReport.meetingsScheduled || 0);
      setWhatsappMessagesSent(initialReport.whatsappMessagesSent || 0);
      setRemarks(initialReport.remarks || '');

      if (initialReport.editState?.remainingSeconds) {
        setSecondsRemaining(initialReport.editState.remainingSeconds);
      }
    } else {
      setReportDate(new Date().toISOString().substring(0, 10));
      setTargetUserId('');
      setTotalCalls(0);
      setConnectedCalls(0);
      setNotPickedCalls(0);
      setFollowUpsDone(0);
      setFollowUpsPending(0);
      setInterestedClients(0);
      setConvertedClients(0);
      setNotInterestedClients(0);
      setMeetingsScheduled(0);
      setWhatsappMessagesSent(0);
      setRemarks('');
      setSecondsRemaining(0);
    }
  }, [initialReport, isOpen]);

  // Live Timer Countdown tick
  useEffect(() => {
    if (!initialReport?.editState?.adminUnlockActive || secondsRemaining <= 0) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [initialReport, secondsRemaining]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      reportDate,
      totalCalls: Number(totalCalls),
      connectedCalls: Number(connectedCalls),
      notPickedCalls: Number(notPickedCalls),
      followUpsDone: Number(followUpsDone),
      followUpsPending: Number(followUpsPending),
      interestedClients: Number(interestedClients),
      convertedClients: Number(convertedClients),
      notInterestedClients: Number(notInterestedClients),
      meetingsScheduled: Number(meetingsScheduled),
      whatsappMessagesSent: Number(whatsappMessagesSent),
      remarks,
      targetUserId: isAdmin && targetUserId ? targetUserId : undefined
    } as any);
  };

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const editState = initialReport?.editState;
  const isLockedForCaller = !isAdmin && editState && !editState.canEdit;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialReport ? 'Update Daily Work Report' : 'Submit Daily Work Report'}
      subtitle="Record your daily call metrics, conversion numbers, and summary remarks"
      maxWidth="max-w-2xl"
    >
      {/* Lock Notice Banner */}
      {isLockedForCaller && (
        <div className="mb-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-3.5 rounded-2xl flex items-center space-x-3 text-rose-700 dark:text-rose-300 text-xs">
          <Lock className="w-5 h-5 shrink-0 text-rose-500" />
          <div>
            <span className="font-bold block">Editing Locked</span>
            <span>{editState?.reason || 'Editing locked. Please contact admin to unlock this report.'}</span>
          </div>
        </div>
      )}

      {/* Admin Unlock Active Timer Banner */}
      {!isAdmin && editState?.adminUnlockActive && secondsRemaining > 0 && (
        <div className="mb-4 bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl flex items-center justify-between text-amber-700 dark:text-amber-400 text-xs">
          <div className="flex items-center space-x-2">
            <Unlock className="w-4 h-4 text-amber-500 animate-pulse" />
            <span className="font-bold">Temporary Admin Edit Access Active</span>
          </div>
          <span className="font-extrabold font-mono bg-amber-500/20 px-2.5 py-1 rounded-lg">
            Admin edit access expires in {formatTimer(secondsRemaining)}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date & Caller Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Report Date
            </label>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              disabled={isLockedForCaller}
              required
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white"
            />
          </div>

          {isAdmin && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Caller (Admin Override)
              </label>
              <select
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white"
              >
                <option value="">Current Admin / Default Caller</option>
                {callers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Total Calls Done
            </label>
            <input
              type="number"
              min="0"
              value={totalCalls}
              onChange={(e) => setTotalCalls(Number(e.target.value))}
              disabled={isLockedForCaller}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Connected Calls
            </label>
            <input
              type="number"
              min="0"
              value={connectedCalls}
              onChange={(e) => setConnectedCalls(Number(e.target.value))}
              disabled={isLockedForCaller}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-900 dark:text-white"
            />
          </div>

          {/* Not Picked Calls (Placed right after Connected Calls) */}
          <div className="bg-rose-50/40 dark:bg-rose-950/20 p-3 rounded-2xl border border-rose-200 dark:border-rose-800/60">
            <label className="block text-[11px] font-bold text-rose-700 dark:text-rose-400 mb-1 flex items-center">
              <PhoneOff className="w-3 h-3 mr-1 text-rose-500" />
              Not Picked Calls
            </label>
            <input
              type="number"
              min="0"
              value={notPickedCalls}
              onChange={(e) => setNotPickedCalls(Number(e.target.value))}
              disabled={isLockedForCaller}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-sm font-bold text-rose-600 dark:text-rose-400"
            />
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Follow-ups Done
            </label>
            <input
              type="number"
              min="0"
              value={followUpsDone}
              onChange={(e) => setFollowUpsDone(Number(e.target.value))}
              disabled={isLockedForCaller}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Follow-ups Pending
            </label>
            <input
              type="number"
              min="0"
              value={followUpsPending}
              onChange={(e) => setFollowUpsPending(Number(e.target.value))}
              disabled={isLockedForCaller}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div className="bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-2xl border border-amber-200 dark:border-amber-800">
            <label className="block text-[11px] font-bold text-amber-700 dark:text-amber-400 mb-1">
              Interested Clients
            </label>
            <input
              type="number"
              min="0"
              value={interestedClients}
              onChange={(e) => setInterestedClients(Number(e.target.value))}
              disabled={isLockedForCaller}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-sm font-bold text-amber-600 dark:text-amber-400"
            />
          </div>

          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800">
            <label className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mb-1">
              Converted Clients
            </label>
            <input
              type="number"
              min="0"
              value={convertedClients}
              onChange={(e) => setConvertedClients(Number(e.target.value))}
              disabled={isLockedForCaller}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-sm font-bold text-emerald-600 dark:text-emerald-400"
            />
          </div>

          <div className="bg-rose-50/50 dark:bg-rose-950/20 p-3 rounded-2xl border border-rose-200 dark:border-rose-800">
            <label className="block text-[11px] font-bold text-rose-700 dark:text-rose-400 mb-1">
              Not Interested
            </label>
            <input
              type="number"
              min="0"
              value={notInterestedClients}
              onChange={(e) => setNotInterestedClients(Number(e.target.value))}
              disabled={isLockedForCaller}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-sm font-bold text-rose-600 dark:text-rose-400"
            />
          </div>

          <div className="bg-purple-50/50 dark:bg-purple-950/20 p-3 rounded-2xl border border-purple-200 dark:border-purple-800">
            <label className="block text-[11px] font-bold text-purple-700 dark:text-purple-400 mb-1">
              Meetings Scheduled
            </label>
            <input
              type="number"
              min="0"
              value={meetingsScheduled}
              onChange={(e) => setMeetingsScheduled(Number(e.target.value))}
              disabled={isLockedForCaller}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-sm font-bold text-purple-600 dark:text-purple-400"
            />
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              WhatsApp Messages
            </label>
            <input
              type="number"
              min="0"
              value={whatsappMessagesSent}
              onChange={(e) => setWhatsappMessagesSent(Number(e.target.value))}
              disabled={isLockedForCaller}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Remarks / Summary */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Daily Remarks & Key Highlights
          </label>
          <textarea
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            disabled={isLockedForCaller}
            placeholder="Write key challenges, client responses, or highlights from today's calling session..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Form Action Buttons */}
        <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
          >
            Cancel
          </button>
          {!isLockedForCaller && (
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center space-x-1.5 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Saving Report...' : 'Submit Report'}</span>
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
};
