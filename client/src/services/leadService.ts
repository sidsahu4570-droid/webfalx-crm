import { api } from './api';
import { Lead, FilterParams, PaginatedResponse, ImportHistoryRecord } from '../types';

export const leadService = {
  getLeads: async (params?: FilterParams): Promise<PaginatedResponse<Lead>> => {
    const res = await api.get<PaginatedResponse<Lead>>('/leads', { params });
    return res.data;
  },

  getLeadById: async (id: string): Promise<{ success: boolean; lead: Lead }> => {
    const res = await api.get<{ success: boolean; lead: Lead }>(`/leads/${id}`);
    return res.data;
  },

  createLead: async (data: Partial<Lead> & { initialNote?: string; assignedUserId?: string }): Promise<{ success: boolean; lead: Lead; message: string }> => {
    const res = await api.post('/leads', data);
    return res.data;
  },

  updateLead: async (id: string, data: Partial<Lead>): Promise<{ success: boolean; lead: Lead; message: string }> => {
    const res = await api.put(`/leads/${id}`, data);
    return res.data;
  },

  deleteLead: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete(`/leads/${id}`);
    return res.data;
  },

  addNote: async (
    id: string,
    content: string,
    options?: { status?: string; nextFollowUpDate?: string; isWhatsApp?: boolean }
  ): Promise<{ success: boolean; lead: Lead; message: string }> => {
    const res = await api.post(`/leads/${id}/notes`, { content, ...options });
    return res.data;
  },

  completeFollowUp: async (id: string, nextFollowUpDate?: string): Promise<{ success: boolean; lead: Lead; message: string }> => {
    const res = await api.patch(`/leads/${id}/complete-followup`, { nextFollowUpDate });
    return res.data;
  },

  importLeads: async (leads: any[]): Promise<{ success: boolean; message: string; count: number }> => {
    const res = await api.post('/leads/import', { leads });
    return res.data;
  },

  importExcelLeads: async (data: {
    fileName: string;
    assignedCallerId: string;
    duplicateAction: 'skip' | 'update';
    leads: any[];
    categoryId: string;
    cityId: string;
  }): Promise<{ success: boolean; message: string; history: ImportHistoryRecord }> => {
    const res = await api.post('/leads/import-excel', data);
    return res.data;
  },

  getImportHistory: async (): Promise<{ success: boolean; history: ImportHistoryRecord[] }> => {
    const res = await api.get('/leads/import-history');
    return res.data;
  },

  logCallAttempt: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.post(`/leads/${id}/call-log`);
    return res.data;
  }
};
