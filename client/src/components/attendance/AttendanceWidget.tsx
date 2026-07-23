import React, { useState, useEffect } from 'react';
import { attendanceService } from '../../services/attendanceService';
import { AttendanceRecord } from '../../types';
import { Clock, Play, Square, Coffee } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const AttendanceWidget: React.FC = () => {
  const { toast } = useToast();
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAttendance = async () => {
    try {
      const res = await attendanceService.getTodayAttendance();
      if (res.success) setAttendance(res.attendance);
    } catch (err) {}
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handleClockIn = async () => {
    setLoading(true);
    try {
      const res = await attendanceService.clockIn();
      if (res.success) {
        toast('Clocked In', res.message, 'success');
        setAttendance(res.attendance);
      }
    } catch (err: any) {
      toast('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    try {
      const res = await attendanceService.clockOut();
      if (res.success) {
        toast('Clocked Out', res.message, 'info');
        setAttendance(res.attendance);
      }
    } catch (err: any) {
      toast('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const isClockedIn = attendance && attendance.loginTime && !attendance.logoutTime;

  return (
    <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 px-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
      <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
      <span className="font-bold text-slate-700 dark:text-slate-300 font-mono text-[11px]">
        {isClockedIn ? (
          <span className="text-emerald-600 dark:text-emerald-400">
            Active since {new Date(attendance.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        ) : attendance?.logoutTime ? (
          <span>Shift Done ({attendance.activeHours} hrs)</span>
        ) : (
          <span>Not Clocked In</span>
        )}
      </span>

      {!isClockedIn && !attendance?.logoutTime && (
        <button
          onClick={handleClockIn}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1 rounded-xl text-[10px] flex items-center space-x-1 transition-all"
        >
          <Play className="w-3 h-3" />
          <span>Clock In</span>
        </button>
      )}

      {isClockedIn && (
        <button
          onClick={handleClockOut}
          disabled={loading}
          className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-2.5 py-1 rounded-xl text-[10px] flex items-center space-x-1 transition-all"
        >
          <Square className="w-3 h-3" />
          <span>Clock Out</span>
        </button>
      )}
    </div>
  );
};
