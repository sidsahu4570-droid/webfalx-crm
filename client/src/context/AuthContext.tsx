import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  googleLogin: (email: string, name: string, googleId?: string) => Promise<User>;
  logout: () => void;
  updateCurrentUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('crm_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('crm_token');
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const storedToken = localStorage.getItem('crm_token');
      if (storedToken) {
        try {
          const data = await authService.getMe();
          if (isMounted && data.success && data.user) {
            setUser(data.user);
            localStorage.setItem('crm_user', JSON.stringify(data.user));
          }
        } catch (error: any) {
          console.warn('[Auth Notice] Session refresh check failed:', error?.message || error);
          // Only clear session if server explicitly returns 401 Unauthorized or 403 Forbidden
          if (error?.response && (error.response.status === 401 || error.response.status === 403)) {
            if (isMounted) {
              setUser(null);
              setToken(null);
              localStorage.removeItem('crm_token');
              localStorage.removeItem('crm_user');
            }
          }
          // On transient network error or server restart, retain stored user session from localStorage!
        }
      }
      if (isMounted) {
        setLoading(false);
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await authService.login({ email, password });
    if (res.success && res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('crm_token', res.token);
      localStorage.setItem('crm_user', JSON.stringify(res.user));
      return res.user;
    } else {
      throw new Error(res.message || 'Login failed');
    }
  };

  const googleLogin = async (email: string, name: string, googleId?: string): Promise<User> => {
    const res = await authService.googleLogin({ email, name, googleId });
    if (res.success && res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('crm_token', res.token);
      localStorage.setItem('crm_user', JSON.stringify(res.user));
      return res.user;
    } else {
      throw new Error(res.message || 'Google Login failed');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
  };

  const updateCurrentUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('crm_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user && !!token,
        login,
        googleLogin,
        logout,
        updateCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
