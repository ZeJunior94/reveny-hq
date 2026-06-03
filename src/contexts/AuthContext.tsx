import React, { createContext, useContext, useEffect, useState } from 'react';
import { signOut, getUser } from '@/lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

interface AuthUser {
  id: string;
  email: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  loginWithGoogle: () => void;
  setSession: (token: string, user: AuthUser) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('hq_token');
    if (!stored) { setLoading(false); return; }
    getUser(stored)
      .then((u) => {
        if (u?.email) {
          setToken(stored);
          setUser({ id: u.id, email: u.email, isAdmin: true });
        } else {
          localStorage.removeItem('hq_token');
        }
      })
      .catch(() => localStorage.removeItem('hq_token'))
      .finally(() => setLoading(false));
  }, []);

  function loginWithGoogle() {
    const callbackUrl = `${window.location.origin}/auth/callback`;
    window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(callbackUrl)}`;
  }

  function setSession(accessToken: string, authUser: AuthUser) {
    localStorage.setItem('hq_token', accessToken);
    setToken(accessToken);
    setUser(authUser);
  }

  async function logout() {
    if (token) await signOut(token).catch(() => {});
    localStorage.removeItem('hq_token');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, loginWithGoogle, setSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
