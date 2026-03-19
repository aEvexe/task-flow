import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User } from '../types';
import * as authApi from '../api/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<string>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  googleCallback: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, check if there's an existing session via cookie
  useEffect(() => {
    authApi.getMe()
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await authApi.login(email, password);
    const u = await authApi.getMe();
    setUser(u);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<string> => {
    const response = await authApi.register(name, email, password);
    return response.email;
  }, []);

  const verifyEmail = useCallback(async (email: string, otp: string) => {
    await authApi.verifyEmail(email, otp);
    const u = await authApi.getMe();
    setUser(u);
  }, []);

  const googleCallback = useCallback(async () => {
    // Cookie is already set by the backend redirect — just fetch user
    const u = await authApi.getMe();
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, verifyEmail, googleCallback, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
