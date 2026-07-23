import { api } from './api';
import { User } from '../types';

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

export const authService = {
  login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/login', credentials);
    return res.data;
  },

  signup: async (data: { name: string; email: string; password: string }): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/signup', data);
    return res.data;
  },

  googleLogin: async (data: { email: string; name: string; googleId?: string }): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/google', data);
    return res.data;
  },

  forgotPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  getMe: async (): Promise<{ success: boolean; user: User }> => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};
