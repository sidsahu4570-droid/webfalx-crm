import { api } from './api';
import { AuditLogRecord } from '../types';

export const auditLogService = {
  getLogs: async (params?: {
    module?: string;
    action?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; logs: AuditLogRecord[]; pagination: any }> => {
    const res = await api.get('/audit-logs', { params });
    return res.data;
  }
};
