import { api } from './api';
import { DashboardStats, ActivityLog, Lead } from '../types';

export const adminService = {
  getStats: async (callerId?: string): Promise<{ success: boolean; stats: DashboardStats }> => {
    const res = await api.get<{ success: boolean; stats: DashboardStats }>('/admin/stats', {
      params: { callerId }
    });
    return res.data;
  },

  getActivityLogs: async (params?: { page?: number; limit?: number; action?: string }): Promise<{ success: boolean; logs: ActivityLog[]; pagination: any }> => {
    const res = await api.get('/admin/activity', { params });
    return res.data;
  },

  assignLead: async (leadId: string, targetCallerId: string): Promise<{ success: boolean; lead: Lead; message: string }> => {
    const res = await api.post('/admin/assign-lead', { leadId, targetCallerId });
    return res.data;
  },

  clearDemoData: async (): Promise<{ success: boolean; message: string }> => {
    const res = await api.post('/admin/clear-demo-data');
    return res.data;
  },
};
