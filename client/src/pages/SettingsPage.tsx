import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { userService } from '../services/userService';
import { authService } from '../services/authService';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/formatters';
import { User, Calendar, Moon, Sun, CheckCircle2, Lock, AlertCircle, Clock } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const [joiningDateInput, setJoiningDateInput] = useState(
    user?.joiningDate ? new Date(user.joiningDate).toISOString().split('T')[0] : ''
  );
  const [submittingDate, setSubmittingDate] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(user?.joiningDateStatus || 'Pending Approval');
  const [currentDate, setCurrentDate] = useState(user?.joiningDate);

  // Fetch fresh caller profile on page load
  useEffect(() => {
    authService.getMe().then((res) => {
      if (res.success && res.user) {
        if (res.user.joiningDate) {
          setCurrentDate(res.user.joiningDate);
          setJoiningDateInput(new Date(res.user.joiningDate).toISOString().split('T')[0]);
        }
        if (res.user.joiningDateStatus) {
          setCurrentStatus(res.user.joiningDateStatus);
        }
      }
    }).catch(() => {});
  }, []);

  if (!user) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate 2-day edit lock for caller
  const isCaller = user.role === 'caller';
  const submittedAt = user.joiningDateSubmittedAt ? new Date(user.joiningDateSubmittedAt).getTime() : null;
  const now = new Date().getTime();
  const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
  const isLocked = isCaller && submittedAt ? (now - submittedAt) > twoDaysMs : false;

  const handleJoiningDateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joiningDateInput) return;
    setSubmittingDate(true);
    try {
      const res = await userService.submitJoiningDate(joiningDateInput);
      if (res.success) {
        toast('Joining Date Submitted', res.message, 'success');
        setCurrentDate(res.joiningDate);
        setCurrentStatus(res.joiningDateStatus as any);
      }
    } catch (err: any) {
      toast('Submission Error', err.response?.data?.message || err.message, 'error');
    } finally {
      setSubmittingDate(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Account Settings & Profile
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Manage your profile details, official joining date, and application preferences
        </p>
      </div>

      {/* User Profile Summary Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
          <User className="w-4 h-4 mr-2 text-indigo-500" />
          Caller Profile Summary
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 font-medium block">Caller Name</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">{user.name}</span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 font-medium block">Login Email</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">{user.email}</span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 font-medium block">Assigned Role</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm capitalize">
              {user.role} Account
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 font-medium block">Account Status</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm flex items-center mt-0.5">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Active & Verified
            </span>
          </div>
        </div>
      </div>

      {/* 📅 Joining Date Management Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-indigo-500" />
            Official Joining Date Management
          </h3>

          <span
            className={`px-3 py-1 rounded-full text-[10px] font-extrabold border ${
              currentStatus === 'Approved'
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                : currentStatus === 'Rejected'
                ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                : 'bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold'
            }`}
          >
            Status: {currentStatus}
          </span>
        </div>

        {currentDate && (
          <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 block">Submitted Joining Date</span>
              <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                {formatDate(currentDate)}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              {currentStatus === 'Approved'
                ? 'Verified by Admin'
                : 'Awaiting Admin Review'}
            </span>
          </div>
        )}

        {currentStatus === 'Approved' ? (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 flex items-center space-x-3 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
            <div>
              <span>Joining Date Verified & Approved by Admin</span>
              <p className="text-[10px] font-normal text-emerald-600/80 mt-0.5">
                Your official joining date has been approved and locked. Contact Admin for any future updates.
              </p>
            </div>
          </div>
        ) : isLocked ? (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/60 flex items-center space-x-3 text-amber-700 dark:text-amber-300 text-xs font-bold">
            <Lock className="w-5 h-5 shrink-0 text-amber-600" />
            <div>
              <span>Joining Date Locked. Contact Admin for changes.</span>
              <p className="text-[10px] font-normal text-amber-600/80 mt-0.5">
                Callers can only edit joining date within 2 days of initial submission.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleJoiningDateSubmit} className="space-y-3 pt-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Select Joining Date * {isCaller && '(Today or Future Date only)'}
            </label>

            <div className="flex items-center space-x-3">
              <input
                type="date"
                required
                min={isCaller ? todayStr : undefined} // Callers cannot pick backdated dates!
                value={joiningDateInput}
                onChange={(e) => setJoiningDateInput(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-white"
              />

              <button
                type="submit"
                disabled={submittingDate}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-md transition-all shrink-0"
              >
                {submittingDate ? 'Submitting...' : 'Submit Joining Date'}
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              Note: Submitted date will be sent to Admin for approval. Editable for 2 days after submission.
            </p>
          </form>
        )}
      </div>

      {/* Interface Theme Customization */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
          {theme === 'dark' ? <Moon className="w-4 h-4 mr-2 text-amber-400" /> : <Sun className="w-4 h-4 mr-2 text-amber-500" />}
          Interface Theme Preference
        </h3>

        <div className="flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200 block">
              {theme === 'dark' ? 'Dark Mode Active' : 'Light Mode Active'}
            </span>
            <span className="text-slate-400">Toggle visual theme palette</span>
          </div>

          <button
            onClick={toggleTheme}
            className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold px-4 py-2 rounded-xl hover:bg-slate-200 transition-all"
          >
            Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </button>
        </div>
      </div>
    </div>
  );
};
