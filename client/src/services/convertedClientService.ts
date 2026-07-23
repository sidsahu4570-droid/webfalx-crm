import { api } from './api';
import {
  ConvertedClient,
  WebsiteUpdate,
  PaymentHistory,
  RevenueStats,
  DomainCharge,
  OtherExpense,
  ClientExpenseHistoryRecord
} from '../types';

export const convertedClientService = {
  getClients: async (params?: {
    callerId?: string;
    websiteStatus?: string;
    paymentStatus?: string;
    approvalStatus?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
    projectType?: string;
  }): Promise<{ success: boolean; clients: ConvertedClient[]; pagination: any }> => {
    const res = await api.get('/converted-clients', { params });
    return res.data;
  },

  getClientById: async (
    id: string
  ): Promise<{
    success: boolean;
    client: ConvertedClient;
    websiteUpdates: WebsiteUpdate[];
    paymentHistory: PaymentHistory[];
  }> => {
    const res = await api.get(`/converted-clients/${id}`);
    return res.data;
  },

  createClient: async (
    data: Partial<ConvertedClient> & { targetUserId?: string }
  ): Promise<{ success: boolean; client: ConvertedClient; message: string }> => {
    const res = await api.post('/converted-clients', data);
    return res.data;
  },

  updateClient: async (
    id: string,
    data: Partial<ConvertedClient>
  ): Promise<{ success: boolean; client: ConvertedClient; message: string }> => {
    const res = await api.put(`/converted-clients/${id}`, data);
    return res.data;
  },

  approveClient: async (
    id: string,
    status: 'Approved' | 'Rejected'
  ): Promise<{ success: boolean; client: ConvertedClient; message: string }> => {
    const res = await api.post(`/converted-clients/${id}/approve`, { status, approvalStatus: status });
    return res.data;
  },

  deleteClient: async (
    id: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete(`/converted-clients/${id}`, { data: { reason } });
    return res.data;
  },

  toggleLock: async (
    id: string,
    fieldName: string,
    isLocked: boolean
  ): Promise<{ success: boolean; client: ConvertedClient; message: string }> => {
    const res = await api.post(`/converted-clients/${id}/toggle-lock`, { fieldName, isLocked });
    return res.data;
  },

  addWebsiteUpdate: async (
    id: string,
    updateText: string,
    websiteStatus?: string,
    websiteDeliveryDate?: string,
    websiteCompletedDate?: string
  ): Promise<{ success: boolean; client: ConvertedClient; websiteUpdate: WebsiteUpdate; message: string }> => {
    const res = await api.post(`/converted-clients/${id}/website-update`, {
      updateText,
      websiteStatus,
      websiteDeliveryDate,
      websiteCompletedDate
    });
    return res.data;
  },

  addPaymentRecord: async (
    id: string,
    data: {
      paymentType: string;
      amount: number;
      paymentMode?: string;
      note?: string;
    }
  ): Promise<{ success: boolean; client: ConvertedClient; paymentRecord: PaymentHistory; message: string }> => {
    const res = await api.post(`/converted-clients/${id}/payment`, data);
    return res.data;
  },

  addClientExpense: async (
    id: string,
    data: {
      expenseType: string;
      amount: number;
      notes?: string;
    }
  ): Promise<{ success: boolean; client: ConvertedClient; expense: ClientExpenseHistoryRecord; message: string }> => {
    const res = await api.post(`/converted-clients/${id}/expenses`, data);
    return res.data;
  },

  getClientExpenseHistory: async (
    id: string
  ): Promise<{ success: boolean; history: ClientExpenseHistoryRecord[] }> => {
    const res = await api.get(`/converted-clients/${id}/expenses`);
    return res.data;
  },

  getMeetings: async (filter = 'upcoming', callerId?: string): Promise<{ success: boolean; meetings: ConvertedClient[] }> => {
    const res = await api.get('/converted-clients/meetings', { params: { filter, callerId } });
    return res.data;
  },

  getRevenueStats: async (callerId?: string): Promise<{ success: boolean; stats: RevenueStats }> => {
    const res = await api.get('/converted-clients/revenue', { params: { callerId } });
    return res.data;
  },

  // Admin Expense API
  createDomainCharge: async (amount: number, notes?: string, chargeDate?: string): Promise<{ success: boolean; charge: DomainCharge }> => {
    const res = await api.post('/converted-clients/domain-charges', { amount, notes, chargeDate });
    return res.data;
  },

  getDomainCharges: async (): Promise<{ success: boolean; charges: DomainCharge[] }> => {
    const res = await api.get('/converted-clients/domain-charges');
    return res.data;
  },

  createOtherExpense: async (amount: number, expenseType?: string, notes?: string, expenseDate?: string): Promise<{ success: boolean; expense: OtherExpense }> => {
    const res = await api.post('/converted-clients/other-expenses', { amount, expenseType, notes, expenseDate });
    return res.data;
  },

  getOtherExpenses: async (): Promise<{ success: boolean; expenses: OtherExpense[] }> => {
    const res = await api.get('/converted-clients/other-expenses');
    return res.data;
  }
};
