import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { apiFetch } from '../services/api.js';

const AuthContext = createContext(null);

const STORAGE_KEY = 'pulseshield_auth';

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [state, setState] = useState(() => loadStored());

  const token = state?.token ?? null;
  const user = state?.user ?? null;

  const login = useCallback(async (email, password) => {
    const data = await apiFetch('/auth/login', { method: 'POST', body: { email, password } });
    const next = { token: data.token, user: data.user };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setState(next);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await apiFetch('/auth/register', { method: 'POST', body: payload });
    const next = { token: data.token, user: data.user };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setState(next);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      login,
      register,
      logout,
    }),
    [token, user, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
