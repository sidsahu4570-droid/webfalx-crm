import React, { useState, useEffect } from 'react';
import { attendanceService } from '../services/attendanceService';
import { AttendanceRecord } from '../types';
import { LoadingSpinner } from '../components/common/SkeletonLoader';
import { useToast } from '../context/ToastContext';
import { formatDate, formatDateTime } from '../utils/formatters';
import { Clock, Calendar, Download, UserCheck, ShieldAlert } from 'lucide-react';
import { exportCustomDataToCSV } from '../utils/csv';

export const AttendancePage: React.FC = () => {
  const { toast } = useToast();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await attendanceService.getReport({
        status: statusFilter || undefined
      });
      if (res.success) setRecords(res.records);
    } catch (err: any) {
      toast('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [statusFilter]);

  const handleExport = () => {
    const dataToExport = records.map((r) => ({
      Date: r.date,
      Caller: r.callerName,
      Email: r.callerEmail,
      Status: r.status,
      'Login Time': new Date(r.loginTime).toLocaleTimeString(),
      'Logout Time': r.logoutTime ? new Date(r.logoutTime).toLocaleTimeString() : 'Active',
      'Active Hours': r.activeHours,
      'Break Mins': r.breakTime,
      'Total Working Hours': r.totalWorkingHours
    }));
    exportCustomDataToCSV(dataToExport, `Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-wider bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-500/30">
            Attendance & Working Hours Analytics
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2 flex items-center">
            <Clock className="w-7 h-7 mr-2 text-blue-400" />
            Caller Attendance Management
          </h2>
          <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-xl">
            Track daily login/logout times, active working hours, break durations, and late logins.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-md transition-all shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Excel / CSV</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <label className="font-bold text-slate-700 dark:text-slate-300">Filter Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-800 dark:text-slate-200 font-bold"
          >
            <option value="">All Attendance Statuses</option>
            <option value="Present">Present</option>
            <option value="Late">Late Login</option>
            <option value="Half Day">Half Day</option>
          </select>
        </div>
      </div>

      {/* Attendance Table */}
      {loading ? (
        <LoadingSpinner text="Fetching attendance records..." />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
               <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Caller Name</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Login Time</th>
                  <th className="py-3 px-4">Logout Time</th>
                  <th className="py-3 px-4">Sessions</th>
                  <th className="py-3 px-4">Active Hours</th>
                  <th className="py-3 px-4">Break (Mins)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-mono">
                {records.length > 0 ? (
                  records.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-sans font-bold text-slate-900 dark:text-white">
                        {r.date}
                      </td>
                      <td className="py-3.5 px-4 font-sans font-semibold text-slate-800 dark:text-slate-200">
                        {r.callerName}
                        <span className="text-[10px] text-slate-400 block font-normal">{r.callerEmail}</span>
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
                          : 'Currently Active'}
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
                            <span className="text-[10px] text-slate-400">1 Session</span>
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
                    <td colSpan={8} className="py-6 text-center text-xs text-slate-400 italic font-sans">
                      No attendance records logged yet.
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
