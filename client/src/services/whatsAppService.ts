import { api } from './api';
import { WhatsAppLog } from '../types';

export const whatsAppService = {
  logMessage: async (data: {
    leadId?: string;
    clientId?: string;
    phone: string;
    message: string;
    templateName?: string;
    status?: string;
  }): Promise<{ success: boolean; log: WhatsAppLog; message: string }> => {
    const res = await api.post('/whatsapp/log', data);
    return res.data;
  },

  getLogs: async (params?: {
    leadId?: string;
    clientId?: string;
    phone?: string;
  }): Promise<{ success: boolean; logs: WhatsAppLog[] }> => {
    const res = await api.get('/whatsapp/logs', { params });
    return res.data;
  },

  updateStatus: async (id: string, status: string): Promise<{ success: boolean; log: WhatsAppLog }> => {
    const res = await api.put(`/whatsapp/logs/${id}/status`, { status });
    return res.data;
  }
};
