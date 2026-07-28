import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { authService } from '../services/authService';

export interface SavedAccount {
  id: string;
  name: string;
  email: string;
  role: Role;
  token: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  googleLogin: (email: string, name: string, googleId?: string) => Promise<User>;
  logout: () => void;
  updateCurrentUser: (user: User) => void;
  accounts: SavedAccount[];
  switchAccount: (email: string) => void;
  logoutCurrent: () => void;
  logoutAll: () => void;
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

  const [accounts, setAccounts] = useState<SavedAccount[]>(() => {
    try {
      const saved = localStorage.getItem('crm_accounts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState<boolean>(true);

  const saveAccountInfo = (user: User, token: string) => {
    const newAccount: SavedAccount = {
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token
    };
    setAccounts((prev) => {
      const updated = [...prev];
      const idx = updated.findIndex((acc) => acc.email === user.email);
      if (idx > -1) {
        updated[idx] = newAccount;
      } else {
        updated.push(newAccount);
      }
      localStorage.setItem('crm_accounts', JSON.stringify(updated));
      return updated;
    });
  };

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
            saveAccountInfo(data.user, storedToken);
          }
        } catch (error: any) {
          console.warn('[Auth Notice] Session refresh check failed:', error?.message || error);
          if (error?.response && (error.response.status === 401 || error.response.status === 403)) {
            if (isMounted) {
              setUser(null);
              setToken(null);
              localStorage.removeItem('crm_token');
              localStorage.removeItem('crm_user');
            }
          }
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
      saveAccountInfo(res.user, res.token);
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
      saveAccountInfo(res.user, res.token);
      return res.user;
    } else {
      throw new Error(res.message || 'Google Login failed');
    }
  };

  const logoutCurrent = () => {
    if (!user) return;
    const remaining = accounts.filter((acc) => acc.email !== user.email);
    localStorage.setItem('crm_accounts', JSON.stringify(remaining));
    setAccounts(remaining);

    if (remaining.length > 0) {
      const next = remaining[0];
      setToken(next.token);
      const nextUser: User = {
        id: next.id,
        _id: next.id,
        name: next.name,
        email: next.email,
        role: next.role,
        isActive: true
      };
      setUser(nextUser);
      localStorage.setItem('crm_token', next.token);
      localStorage.setItem('crm_user', JSON.stringify(nextUser));
    } else {
      setUser(null);
      setToken(null);
      localStorage.removeItem('crm_token');
      localStorage.removeItem('crm_user');
      localStorage.removeItem('crm_accounts');
    }
  };

  const logoutAll = () => {
    setUser(null);
    setToken(null);
    setAccounts([]);
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
    localStorage.removeItem('crm_accounts');
  };

  const switchAccount = (email: string) => {
    const target = accounts.find((acc) => acc.email === email);
    if (target) {
      setToken(target.token);
      const updatedUser: User = {
        id: target.id,
        _id: target.id,
        name: target.name,
        email: target.email,
        role: target.role,
        isActive: true
      };
      setUser(updatedUser);
      localStorage.setItem('crm_token', target.token);
      localStorage.setItem('crm_user', JSON.stringify(updatedUser));
    }
  };

  const logout = () => {
    logoutCurrent();
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
        updateCurrentUser,
        accounts,
        switchAccount,
        logoutCurrent,
        logoutAll
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
