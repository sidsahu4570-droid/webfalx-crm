import { api } from './api';
import { LeadCategory } from '../types';

export const categoryService = {
  getCategories: async (): Promise<{ success: boolean; categories: LeadCategory[] }> => {
    const res = await api.get('/categories');
    return res.data;
  },

  createCategory: async (name: string): Promise<{ success: boolean; category: LeadCategory; message: string }> => {
    const res = await api.post('/categories', { name });
    return res.data;
  },

  updateCategory: async (id: string, name: string): Promise<{ success: boolean; category: LeadCategory; message: string }> => {
    const res = await api.put(`/categories/${id}`, { name });
    return res.data;
  },

  toggleCategory: async (id: string, isEnabled: boolean): Promise<{ success: boolean; category: LeadCategory; message: string }> => {
    const res = await api.patch(`/categories/${id}/toggle`, { isEnabled });
    return res.data;
  },

  deleteCategory: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete(`/categories/${id}`);
    return res.data;
  }
};
