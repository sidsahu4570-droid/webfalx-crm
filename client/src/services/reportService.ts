import { api } from './api';
import { DailyReport, ReportEditHistory } from '../types';

export interface ReportFilterParams {
  callerId?: string;
  filterRange?: string; // 'today' | 'yesterday' | 'last7days' | 'last15days' | 'last30days' | 'thisMonth' | 'custom'
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const reportService = {
  getMyReports: async (page = 1, limit = 20): Promise<{ success: boolean; reports: DailyReport[]; pagination: any }> => {
    const res = await api.get('/reports/my-reports', { params: { page, limit } });
    return res.data;
  },

  getAllReports: async (params?: ReportFilterParams): Promise<{ success: boolean; reports: DailyReport[]; pagination: any }> => {
    const res = await api.get('/reports/all', { params });
    return res.data;
  },

  // 📌 Separated Report API Calls
  getNewLeadReports: async (params?: ReportFilterParams): Promise<{ success: boolean; reports: any[]; pagination: any }> => {
    const res = await api.get('/reports/new-leads', { params });
    return res.data;
  },

  getExistingLeadReports: async (params?: ReportFilterParams): Promise<{ success: boolean; reports: any[]; pagination: any }> => {
    const res = await api.get('/reports/existing-leads', { params });
    return res.data;
  },

  getNewLeadReportAudits: async (params?: { callerId?: string; date?: string; page?: number; limit?: number }): Promise<{ success: boolean; audits: any[]; pagination: any }> => {
    const res = await api.get('/reports/new-leads/audit', { params });
    return res.data;
  },

  getExistingLeadReportAudits: async (params?: { callerId?: string; date?: string; page?: number; limit?: number }): Promise<{ success: boolean; audits: any[]; pagination: any }> => {
    const res = await api.get('/reports/existing-leads/audit', { params });
    return res.data;
  },

  submitReport: async (reportData: Partial<DailyReport>): Promise<{ success: boolean; report: DailyReport; message: string }> => {
    const res = await api.post('/reports/submit', reportData);
    return res.data;
  },

  unlockReport: async (reportId: string): Promise<{ success: boolean; report: DailyReport; message: string }> => {
    const res = await api.post(`/reports/${reportId}/unlock`);
    return res.data;
  },

  lockReport: async (reportId: string): Promise<{ success: boolean; report: DailyReport; message: string }> => {
    const res = await api.post(`/reports/${reportId}/lock`);
    return res.data;
  },

  deleteReport: async (reportId: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete(`/reports/${reportId}`);
    return res.data;
  },

  getEditHistory: async (reportId: string): Promise<{ success: boolean; history: ReportEditHistory[] }> => {
    const res = await api.get(`/reports/${reportId}/history`);
    return res.data;
  }
};
