'use client';

/**
 * AuthContext.tsx — REAL backend authentication
 *
 * Calls POST /api/auth/login and POST /api/auth/register.
 * Stores JWT in localStorage via the centralised auth helper.
 * NO more mock login — any real account works.
 */

import React, {
  createContext, useContext, useState, useEffect, useCallback, ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  API_BASE,
  getToken, setToken, getStoredUser, setStoredUser, clearStoredUser,
  StoredUser,
} from '@/lib/auth';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthContextType {
  user: StoredUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser]       = useState<StoredUser | null>(null);
  const [loading, setLoading] = useState(true);       // true on first mount while we restore session
  const [error, setError]     = useState<string | null>(null);
  const router = useRouter();

  // ── Restore session from localStorage on mount ────────────────────────────
  useEffect(() => {
    const storedUser = getStoredUser();
    const token      = getToken();

    if (storedUser && token) {
      setUser(storedUser);
      console.log('[auth] Session restored for:', storedUser.email);
    }

    setLoading(false);
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed. Check your credentials.');
      }

      // Backend returns: { _id, firstName, lastName, email, role, token, refreshToken }
      const storedUser: StoredUser = {
        id:    data._id,
        name:  `${data.firstName} ${data.lastName}`.trim(),
        email: data.email,
        role:  data.role ?? 'user',
      };

      setToken(data.token);
      setStoredUser(storedUser);
      setUser(storedUser);

      console.log('[auth] Login successful. Token stored.');
      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // ── Register ──────────────────────────────────────────────────────────────
  const register = useCallback(async (name: string, email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      // Split "John Doe" → firstName: "John", lastName: "Doe"
      const parts     = name.trim().split(/\s+/);
      const firstName = parts[0] ?? name;
      const lastName  = parts.slice(1).join(' ') || firstName; // backend requires lastName

      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed.');
      }

      // Auto-login after successful registration (backend returns token immediately)
      const storedUser: StoredUser = {
        id:    data._id,
        name:  `${data.firstName ?? firstName} ${data.lastName ?? lastName}`.trim(),
        email: data.email,
        role:  data.role ?? 'user',
      };

      setToken(data.token);
      setStoredUser(storedUser);
      setUser(storedUser);

      console.log('[auth] Registration successful. Auto-logged in.');
      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    clearStoredUser();
    setUser(null);
    console.log('[auth] Logged out. Token cleared.');
    router.push('/');
  }, [router]);

  // ── Forgot password (real endpoint) ───────────────────────────────────────
  const forgotPassword = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to send reset email.');
      }

      router.push('/auth/login?reset=requested');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, forgotPassword, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};