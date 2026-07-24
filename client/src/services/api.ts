import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://webfalx-crm.onrender.com/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('crm_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Unauthorized / Invalid Token explicitly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only purge session if server explicitly returns 401 with token invalid error
    if (error.response && error.response.status === 401) {
      const isAuthEndpoint = error.config.url?.includes('/auth/login') || error.config.url?.includes('/auth/register');
      const isTokenError = error.response.data?.message?.toLowerCase().includes('token') ||
                           error.response.data?.message?.toLowerCase().includes('authorized') ||
                           error.response.data?.message?.toLowerCase().includes('expired');

      if (!isAuthEndpoint && isTokenError) {
        localStorage.removeItem('crm_token');
        localStorage.removeItem('crm_user');
      }
    }
    return Promise.reject(error);
  }
);
