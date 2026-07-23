import { api } from './api';
import { BonusSlabRecord, BonusProgress } from '../types';

export const bonusService = {
  getBonusSlabs: async (): Promise<{ success: boolean; slabs: BonusSlabRecord[] }> => {
    const res = await api.get('/bonuses/slabs');
    return res.data;
  },

  createBonusSlab: async (data: {
    title: string;
    targetSales: number;
    bonusAmount: number;
    applicableCallers?: string[];
  }): Promise<{ success: boolean; slab: BonusSlabRecord }> => {
    const res = await api.post('/bonuses/slabs', data);
    return res.data;
  },

  toggleBonusSlab: async (id: string, isActive: boolean): Promise<{ success: boolean; slab: BonusSlabRecord }> => {
    const res = await api.put(`/bonuses/slabs/${id}/toggle`, { isActive });
    return res.data;
  },

  deleteBonusSlab: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete(`/bonuses/slabs/${id}`);
    return res.data;
  },

  getCallerBonusProgress: async (callerId?: string): Promise<{
    success: boolean;
    approvedSalesCount: number;
    currentSlab: BonusSlabRecord | null;
    nextSlab: BonusSlabRecord | null;
    salesNeeded: number;
    bannerText: string;
    allSlabs: BonusSlabRecord[];
  }> => {
    const res = await api.get('/bonuses/progress', { params: { callerId } });
    return res.data;
  }
};
