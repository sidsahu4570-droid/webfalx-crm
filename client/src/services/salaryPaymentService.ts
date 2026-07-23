import { api } from './api';

export interface SalaryPaymentRecord {
  _id: string;
  callerId: string;
  callerName: string;
  month: string;
  monthlySalary: number;
  salaryPaid: number;
  bonusPaid: number;
  deduction: number;
  netPaid: number;
  paymentMethod: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Other';
  notes: string;
  paidBy: {
    _id: string;
    name: string;
    email: string;
  };
  paidAt: string;
  createdAt: string;
}

export interface SalarySummaryData {
  month: string;
  monthlySalary: number;
  salaryPaid: number;
  salaryRemaining: number;
  bonusPaid: number;
  deduction: number;
  netReceived: number;
  lastPaymentDate: string | null;
  paymentStatus: string;
}

export const salaryPaymentService = {
  recordPayment: async (data: {
    callerId: string;
    month: string;
    salaryPaid: number;
    bonusPaid: number;
    deduction: number;
    paymentMethod: string;
    notes?: string;
    paidAt?: string;
  }): Promise<{ success: boolean; message: string; payment: SalaryPaymentRecord }> => {
    const res = await api.post('/salary-payments', data);
    return res.data;
  },

  getCallerPayments: async (callerId?: string): Promise<{ success: boolean; payments: SalaryPaymentRecord[] }> => {
    const res = await api.get('/salary-payments/caller', { params: { callerId } });
    return res.data;
  },

  getCallerSummary: async (params?: { callerId?: string; month?: string }): Promise<{ success: boolean; summary: SalarySummaryData }> => {
    const res = await api.get('/salary-payments/summary', { params });
    return res.data;
  },

  getAllPayments: async (): Promise<{ success: boolean; payments: SalaryPaymentRecord[] }> => {
    const res = await api.get('/salary-payments/all');
    return res.data;
  }
};
