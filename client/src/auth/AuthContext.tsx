import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, PublicUser } from '../api';

interface AuthState {
  user: PublicUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  setUser: (u: PublicUser) => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('diptype_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => localStorage.removeItem('diptype_token'))
      .finally(() => setLoading(false));
  }, []);

  const persist = (token: string, u: PublicUser) => {
    localStorage.setItem('diptype_token', token);
    setUser(u);
  };

  const login = async (email: string, password: string) => {
    const { token, user } = await api.login(email, password);
    persist(token, user);
  };

  const register = async (email: string, password: string, name?: string) => {
    const { token, user } = await api.register(email, password, name);
    persist(token, user);
  };

  const logout = () => {
    localStorage.removeItem('diptype_token');
    setUser(null);
  };

  const refresh = async () => {
    const { user } = await api.me();
    setUser(user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
