import { api } from './api';
import { AttendanceRecord } from '../types';

export const attendanceService = {
  clockIn: async (): Promise<{ success: boolean; message: string; attendance: AttendanceRecord }> => {
    const res = await api.post('/attendance/clock-in');
    return res.data;
  },

  clockOut: async (): Promise<{ success: boolean; message: string; attendance: AttendanceRecord }> => {
    const res = await api.post('/attendance/clock-out');
    return res.data;
  },

  recordBreak: async (breakMinutes: number): Promise<{ success: boolean; attendance: AttendanceRecord }> => {
    const res = await api.post('/attendance/break', { breakMinutes });
    return res.data;
  },

  getTodayAttendance: async (): Promise<{ success: boolean; attendance: any | null; sessions: any[] }> => {
    const res = await api.get('/attendance/today');
    return res.data;
  },

  getReport: async (params?: {
    callerId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<{ success: boolean; records: any[] }> => {
    const res = await api.get('/attendance/report', { params });
    return res.data;
  }
};
