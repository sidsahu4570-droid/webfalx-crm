import { api } from './api';
import { DeletedRecord } from '../types';

export const deletedRecordService = {
  getDeletedRecords: async (params?: {
    search?: string;
    collectionName?: string;
    projectType?: string;
    callerName?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; records: DeletedRecord[]; pagination: any }> => {
    const res = await api.get('/deleted-records', { params });
    return res.data;
  },

  restoreRecord: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.post(`/deleted-records/${id}/restore`);
    return res.data;
  },

  permanentDeleteRecord: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete(`/deleted-records/${id}`);
    return res.data;
  }
};
