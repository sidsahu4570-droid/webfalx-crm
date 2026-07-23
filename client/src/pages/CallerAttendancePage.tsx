import React, { useState, useEffect } from 'react';
import { attendanceService } from '../services/attendanceService';
import { AttendanceRecord } from '../types';
import { LoadingSpinner } from '../components/common/SkeletonLoader';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/formatters';
import { Clock, Play, Square, Coffee, Calendar, CheckCircle2 } from 'lucide-react';

export const CallerAttendancePage: React.FC = () => {
  const { toast } = useToast();
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [todaySessions, setTodaySessions] = useState<any[]>([]);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [breakInput, setBreakInput] = useState<number | ''>('');
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  const fetchData = async () => {
    try {
      const [todayRes, reportRes] = await Promise.all([
        attendanceService.getTodayAttendance(),
        attendanceService.getReport()
      ]);
      if (todayRes.success) {
        setTodayRecord(todayRes.attendance);
        setTodaySessions(todayRes.sessions || []);
      }
      if (reportRes.success) setHistory(reportRes.records);
    } catch (err: any) {
      toast('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleClockIn = async () => {
    setActionLoading(true);
    try {
      const res = await attendanceService.clockIn();
      if (res.success) {
        toast('Clocked In', res.message, 'success');
        setTodayRecord(res.attendance);
        fetchData();
      }
    } catch (err: any) {
      toast('Error', err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    setActionLoading(true);
    try {
      const res = await attendanceService.clockOut();
      if (res.success) {
        toast('Clocked Out', res.message, 'info');
        setTodayRecord(res.attendance);
        fetchData();
      }
    } catch (err: any) {
      toast('Error', err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordBreak = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!breakInput || Number(breakInput) <= 0) return;
    setActionLoading(true);
    try {
      const res = await attendanceService.recordBreak(Number(breakInput));
      if (res.success) {
        toast('Break Logged', `Logged ${breakInput} mins break`, 'success');
        setBreakInput('');
        fetchData();
      }
    } catch (err: any) {
      toast('Error', err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading Attendance Dashboard..." />;
  }

  const isClockedIn = todaySessions.some(s => !s.logoutTime);

  // Filter history based on timeframe
  const filteredHistory = history.filter((r) => {
    if (timeframe === 'daily') {
      return r.date === new Date().toISOString().split('T')[0];
    }
    if (timeframe === 'weekly') {
      const date = new Date(r.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    }
    return true; // Monthly / All
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-wider bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-500/30">
            Caller Workspace • Daily Attendance
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2 flex items-center">
            <Clock className="w-7 h-7 mr-2 text-blue-400" />
            My Attendance & Working Hours
          </h2>
          <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-xl">
            Clock in when starting your shift, log break times, and track your active working hours.
          </p>
        </div>

        {/* Punch Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          {!isClockedIn ? (
            <button
              onClick={handleClockIn}
              disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 transition-all hover:scale-105"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Punch Clock In</span>
            </button>
          ) : (
            <button
              onClick={handleClockOut}
              disabled={actionLoading}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 transition-all hover:scale-105"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Punch Clock Out</span>
            </button>
          )}
        </div>
      </div>

      {/* Dashboard KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Today's Login</span>
          <span className="text-xl font-extrabold text-slate-900 dark:text-white block font-mono">
            {todayRecord?.loginTime
              ? new Date(todayRecord.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '--:--'}
          </span>
          <span className="text-[10px] text-emerald-600 font-bold block">
            {todayRecord?.status || 'Not Started'}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Today's Logout</span>
          <span className="text-xl font-extrabold text-slate-900 dark:text-white block font-mono">
            {todayRecord?.logoutTime
              ? new Date(todayRecord.logoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : isClockedIn
              ? 'Shift Active'
              : '--:--'}
          </span>
          <span className="text-[10px] text-slate-500 block">End of Shift</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Active Hours</span>
          <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 block font-mono">
            {todayRecord?.activeHours || 0} hrs
          </span>
          <span className="text-[10px] text-slate-500 block">Working Time</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-[11px] font-bold text-amber-600 uppercase">Break Time</span>
          <span className="text-xl font-extrabold text-amber-600 block font-mono">
            {todayRecord?.breakTime || 0} mins
          </span>
          <span className="text-[10px] text-slate-500 block">Lunch / Tea Break</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-[11px] font-bold text-purple-600 uppercase">Total Shift Hours</span>
          <span className="text-xl font-extrabold text-purple-600 block font-mono">
            {todayRecord?.totalWorkingHours || 0} hrs
          </span>
          <span className="text-[10px] text-slate-500 block">Span (Login to Logout)</span>
        </div>
      </div>

      {/* Today's Sessions List (Up to 3) */}
      {todaySessions.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Today's Logged Sessions ({todaySessions.length} / 3)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {todaySessions.map((session) => (
              <div key={session._id} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-indigo-600 dark:text-indigo-400">Session #{session.sessionIndex}</span>
                  <span className="text-slate-500 font-semibold">{session.workingHours || 0} hrs active</span>
                </div>
                <div className="space-y-1 font-mono text-[11px] text-slate-500">
                  <div>Login: {new Date(session.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                  <div>Logout: {session.logoutTime ? new Date(session.logoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Active Now'}</div>
                </div>
                <div className="flex space-x-1">
                  {session.isLateLogin && (
                    <span className="bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[9px] font-extrabold px-2 py-0.5 rounded-full">Late Login</span>
                  )}
                  {session.isEarlyLogout && (
                    <span className="bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[9px] font-extrabold px-2 py-0.5 rounded-full">Early Logout</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Break Form (If Clocked In) */}
      {isClockedIn && (
        <form onSubmit={handleRecordBreak} className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <Coffee className="w-4 h-4 text-amber-500" />
            <span className="font-bold text-slate-800 dark:text-slate-200">Log Break Duration</span>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="1"
              required
              value={breakInput}
              onChange={(e) => setBreakInput(e.target.value ? Number(e.target.value) : '')}
              placeholder="e.g. 15 mins"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white w-32"
            />
            <button
              type="submit"
              disabled={actionLoading}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-xl shadow-sm"
            >
              Add Break
            </button>
          </div>
        </form>
      )}

      {/* Attendance History Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-indigo-500" />
            Attendance Timeline & Logs
          </h3>

          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            {(['daily', 'weekly', 'monthly'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded-lg capitalize transition-all ${
                  timeframe === tf ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Login Time</th>
                <th className="py-3 px-4">Logout Time</th>
                <th className="py-3 px-4">Sessions</th>
                <th className="py-3 px-4">Active Working Hours</th>
                <th className="py-3 px-4">Break (Mins)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-mono">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-sans font-bold text-slate-900 dark:text-white">
                      {r.date}
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          r.status === 'Present'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-sans text-slate-700 dark:text-slate-300">
                      {new Date(r.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 font-sans text-slate-700 dark:text-slate-300">
                      {r.logoutTime
                        ? new Date(r.logoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Shift Active'}
                    </td>
                    <td className="py-3.5 px-4 font-sans text-slate-700 dark:text-slate-300">
                      <div className="flex flex-wrap gap-1">
                        {(r as any).sessions && (r as any).sessions.length > 0 ? (
                          (r as any).sessions.map((s: any, idx: number) => (
                            <span key={idx} className="bg-slate-100 dark:bg-slate-800 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold" title={`Login: ${new Date(s.loginTime).toLocaleTimeString()} - Logout: ${s.logoutTime ? new Date(s.logoutTime).toLocaleTimeString() : 'Active'}`}>
                              S{s.sessionIndex}: {s.workingHours}h
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-405">1 Session</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-indigo-600 font-bold font-sans">
                      {r.activeHours} hrs
                    </td>
                    <td className="py-3.5 px-4 font-sans text-slate-500">
                      {r.breakTime} mins
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-xs text-slate-400 italic font-sans">
                    No attendance logs recorded for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
