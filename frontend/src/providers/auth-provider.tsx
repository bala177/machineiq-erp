'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/api';
import { getSocket, disconnectSocket } from '@/lib/socket';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; role?: string }) => Promise<void>;
  setup: (data: { organizationName: string; machineSegment?: string; email: string; password: string; firstName: string; lastName: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('machineiq_token');
    const storedUser = localStorage.getItem('machineiq_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      getSocket(JSON.parse(storedUser).id);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ access_token: string; user: User }>('/auth/login', { email, password });
    localStorage.setItem('machineiq_token', res.access_token);
    localStorage.setItem('machineiq_user', JSON.stringify(res.user));
    setToken(res.access_token);
    setUser(res.user);
    getSocket(res.user.id);
  };

  const register = async (data: { email: string; password: string; firstName: string; lastName: string; role?: string }) => {
    const res = await api.post<{ access_token: string; user: User }>('/auth/register', data);
    localStorage.setItem('machineiq_token', res.access_token);
    localStorage.setItem('machineiq_user', JSON.stringify(res.user));
    setToken(res.access_token);
    setUser(res.user);
    getSocket(res.user.id);
  };

  const setup = async (data: { organizationName: string; machineSegment?: string; email: string; password: string; firstName: string; lastName: string }) => {
    const res = await api.post<{ access_token: string; user: User }>('/auth/setup', data);
    localStorage.setItem('machineiq_token', res.access_token);
    localStorage.setItem('machineiq_user', JSON.stringify(res.user));
    setToken(res.access_token);
    setUser(res.user);
    getSocket(res.user.id);
  };

  const logout = () => {
    localStorage.removeItem('machineiq_token');
    localStorage.removeItem('machineiq_user');
    disconnectSocket();
    setToken(null);
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, token, isLoading, login, register, setup, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
