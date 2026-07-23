import { api } from './api';
import { City } from '../types';

export const cityService = {
  getCities: async (): Promise<{ success: boolean; cities: City[] }> => {
    const res = await api.get('/cities');
    return res.data;
  },

  createCity: async (name: string): Promise<{ success: boolean; city: City; message: string }> => {
    const res = await api.post('/cities', { name });
    return res.data;
  },

  updateCity: async (id: string, name: string): Promise<{ success: boolean; city: City; message: string }> => {
    const res = await api.put(`/cities/${id}`, { name });
    return res.data;
  },

  toggleCity: async (id: string, isEnabled: boolean): Promise<{ success: boolean; city: City; message: string }> => {
    const res = await api.patch(`/cities/${id}/toggle`, { isEnabled });
    return res.data;
  },

  deleteCity: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete(`/cities/${id}`);
    return res.data;
  }
};
