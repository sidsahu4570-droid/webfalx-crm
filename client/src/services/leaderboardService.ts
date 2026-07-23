import { api } from './api';
import { LeaderboardItem } from '../types';

export const leaderboardService = {
  getLeaderboard: async (
    timeframe: 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'all_time' = 'monthly'
  ): Promise<{
    success: boolean;
    timeframe: string;
    topCallerOfWeek: string;
    leaderboard: LeaderboardItem[];
  }> => {
    const res = await api.get('/leaderboard', { params: { timeframe } });
    return res.data;
  }
};
