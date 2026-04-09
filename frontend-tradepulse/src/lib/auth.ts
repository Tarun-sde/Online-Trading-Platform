/**
 * auth.ts
 * Centralised auth helpers. Single source of truth for:
 *  – API base URL
 *  – token read/write/clear in localStorage
 *  – building authenticated fetch headers
 *
 * Import this wherever you need to make authenticated requests.
 */

export const API_BASE = 'http://localhost:5000';

// ── Token storage key ─────────────────────────────────────────────────────────
// One canonical key used everywhere — no more scattered string literals.
const TOKEN_KEY = 'nt_token';     // JWT access token
const USER_KEY  = 'nextradeUser'; // Serialised user object (id, name, email …)

// ── Token ─────────────────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// ── Stored user object ────────────────────────────────────────────────────────

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: StoredUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredUser(): void {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

// ── Auth headers ──────────────────────────────────────────────────────────────

/**
 * Returns headers with Authorization: Bearer <token> for every protected request.
 * Logs the token presence in dev mode to aid debugging.
 */
export function getAuthHeaders(extra: Record<string, string> = {}): HeadersInit {
  const token = getToken();

  if (process.env.NODE_ENV === 'development') {
    console.log('[auth] TOKEN:', token ? `${token.substring(0, 20)}…` : 'MISSING ⚠️');
  }

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

// ── Authenticated fetch wrapper ───────────────────────────────────────────────

/**
 * Thin wrapper around fetch that automatically attaches the Bearer token.
 * Throws a typed error on 401 so callers can redirect to login.
 */
export async function authFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;

  const headers = {
    ...getAuthHeaders(),
    ...(options.headers as Record<string, string> ?? {}),
  };

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    // Token expired or invalid — auto-clear stale session
    clearStoredUser();
    throw new Error('SESSION_EXPIRED');
  }

  return res;
}
