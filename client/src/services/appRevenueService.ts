import { api } from './api';

export interface AppRevenueRecord {
  _id: string;
  clientName: string;
  company?: string;
  email?: string;
  phone?: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  revenueType: 'Mobile Apps' | 'Web Apps' | 'Maintenance' | 'Subscription Revenue' | 'Other Revenue';
  paymentStatus: 'Not Paid' | 'Partially Paid' | 'Fully Paid';
  notes?: string;
  createdAt: string;
}

export interface AppExpenseRecord {
  _id: string;
  expenseType: string;
  amount: number;
  notes?: string;
  expenseDate: string;
  createdBy: string;
  createdAt: string;
}

export interface AppRevenueStats {
  totalExpectedAmount: number;
  totalReceivedAmount: number;
  totalPendingAmount: number;
  totalExpenses: number;
  netProfit: number;
  totalAppDevelopmentCost: number;
  totalPlayStoreCost: number;
}

export interface OverallRevenueStats {
  websiteRevenue: number;
  websiteExpected: number;
  websitePending: number;
  websiteExpenses: number;
  websiteProfit: number;

  appRevenue: number;
  appExpected: number;
  appPending: number;
  appExpenses: number;
  appProfit: number;

  combinedRevenue: number;
  combinedExpected: number;
  combinedPending: number;
  combinedExpenses: number;
  overallProfit: number;

  totalSalaryPaid?: number;
  totalBonusPaid?: number;
  totalEmployeeCost?: number;

  comparisons: {
    category: string;
    Website: number;
    App: number;
    Combined: number;
  }[];
}

export const appRevenueService = {
  getAppRevenues: async (): Promise<{ success: boolean; revenues: AppRevenueRecord[] }> => {
    const res = await api.get('/app-revenue/revenues');
    return res.data;
  },

  createAppRevenue: async (data: Partial<AppRevenueRecord>): Promise<{ success: boolean; revenue: AppRevenueRecord }> => {
    const res = await api.post('/app-revenue/revenues', data);
    return res.data;
  },

  addAppPayment: async (id: string, data: { amount: number; paymentMode?: string; notes?: string }): Promise<{ success: boolean; revenue: AppRevenueRecord }> => {
    const res = await api.post(`/app-revenue/revenues/${id}/payments`, data);
    return res.data;
  },

  getAppExpenses: async (): Promise<{ success: boolean; expenses: AppExpenseRecord[] }> => {
    const res = await api.get('/app-revenue/expenses');
    return res.data;
  },

  createAppExpense: async (data: Partial<AppExpenseRecord>): Promise<{ success: boolean; expense: AppExpenseRecord }> => {
    const res = await api.post('/app-revenue/expenses', data);
    return res.data;
  },

  getAppRevenueStats: async (): Promise<{ success: boolean; stats: AppRevenueStats }> => {
    const res = await api.get('/app-revenue/stats');
    return res.data;
  },

  getOverallRevenueStats: async (): Promise<{ success: boolean; stats: OverallRevenueStats }> => {
    const res = await api.get('/app-revenue/overall-stats');
    return res.data;
  }
};
