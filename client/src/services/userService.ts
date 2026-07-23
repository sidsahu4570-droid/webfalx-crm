import { api } from './api';
import { User } from '../types';

export const userService = {
  getUsers: async (): Promise<{ success: boolean; users: User[] }> => {
    const res = await api.get<{ success: boolean; users: User[] }>('/users');
    return res.data;
  },

  createUser: async (data: { name: string; email: string; password: string; role?: string }): Promise<{ success: boolean; user: User; message: string }> => {
    const res = await api.post('/users', data);
    return res.data;
  },

  updateUser: async (id: string, data: Partial<User> & { password?: string }): Promise<{ success: boolean; user: User; message: string }> => {
    const res = await api.put(`/users/${id}`, data);
    return res.data;
  },

  deleteUser: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete(`/users/${id}`);
    return res.data;
  },

  submitJoiningDate: async (joiningDate: string): Promise<{ success: boolean; message: string; joiningDate: string; joiningDateStatus: string }> => {
    const res = await api.post('/users/joining-date', { joiningDate });
    return res.data;
  },

  approveJoiningDate: async (userId: string, data: { status?: string; joiningDate?: string }): Promise<{ success: boolean; message: string; user: any }> => {
    const res = await api.post(`/users/${userId}/approve-joining-date`, data);
    return res.data;
  }
};
