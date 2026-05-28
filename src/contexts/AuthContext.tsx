import React, { createContext, useContext, useEffect, useState } from 'react';
import { signIn, signOut, getUser } from '@/lib/supabase';

const ADMINS = ['juniormarquess1994@gmail.com'];

interface AuthUser {
  id: string;
  email: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
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
          setUser({ id: u.id, email: u.email, isAdmin: ADMINS.includes(u.email) });
        } else {
          localStorage.removeItem('hq_token');
        }
      })
      .catch(() => localStorage.removeItem('hq_token'))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const data = await signIn(email, password);
    const accessToken: string = data.access_token;
    const userEmail: string = data.user?.email ?? '';
    if (!ADMINS.includes(userEmail)) {
      throw new Error('Acesso restrito à equipe Reveny.');
    }
    localStorage.setItem('hq_token', accessToken);
    setToken(accessToken);
    setUser({ id: data.user.id, email: userEmail, isAdmin: true });
  }

  async function logout() {
    if (token) await signOut(token).catch(() => {});
    localStorage.removeItem('hq_token');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
