import { api } from './api';
import { SalaryConfiguration, SalaryProgress, SalaryBonusProgress, User } from '../types';

export const salaryService = {
  configureSalary: async (data: {
    userId: string;
    monthlySalary: number;
    monthlySalesTarget: number;
    minimumEligibleSales: number;
  }): Promise<{ success: boolean; config: SalaryConfiguration; message: string }> => {
    const res = await api.post('/salary/configure', data);
    return res.data;
  },



  getSalaryConfigurations: async (): Promise<{ success: boolean; configs: any[] }> => {
    const res = await api.get('/salary/configurations');
    return res.data;
  },

  getSalaryProgress: async (callerId?: string): Promise<{
    success: boolean;
    user: User;
    salaryProgress: SalaryProgress;
    bonusProgress: SalaryBonusProgress[];
    salaryConfiguration: SalaryConfiguration | null;
  }> => {
    const res = await api.get('/salary/progress', { params: { callerId } });
    return res.data;
  }
};
