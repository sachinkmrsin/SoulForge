import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useGetMe, User } from '@workspace/api-client-react';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('soulforge_token');
    }
    return null;
  });

  const { data: user, isLoading: isUserLoading, error } = useGetMe({
    query: {
      enabled: !!token,
      retry: false
    }
  });

  useEffect(() => {
    if (error && (error as any).status === 401) {
      logout();
    }
  }, [error]);

  const login = useCallback((newToken: string, user: User) => {
    localStorage.setItem('soulforge_token', newToken);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('soulforge_token');
    setToken(null);
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider value={{ user: user || null, token, isLoading: isUserLoading && !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
