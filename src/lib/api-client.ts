import axios, { AxiosError } from 'axios';

const TOKEN_KEY = 'pe_token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable: session only */
  }
}

/**
 * Backend origin from VITE_API_URL (e.g. http://localhost:8000 or the backend's ngrok URL), without a trailing slash.
 * Empty = same origin: the Vite dev server forwards /api to the backend.
 */
export const API_URL = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');

/** Swagger UI of the backend the app talks to. */
export const DOCS_URL = `${API_URL}/docs`;

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  // ngrok's free plan answers browser requests with an HTML warning page unless this header is sent.
  headers: API_URL ? { 'ngrok-skip-browser-warning': 'true' } : undefined,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err: AxiosError) => {
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/login')) {
      setToken(null);
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

/** Human readable message from a FastAPI error response. */
export function errorText(err: unknown): string {
  const e = err as AxiosError<{ detail?: unknown; error?: { message?: string } }>;
  const detail = e?.response?.data?.detail;
  const envelope = e?.response?.data?.error?.message;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d: { loc?: (string | number)[]; msg?: string }) => `${(d.loc || []).filter((x) => x !== 'body').join('.')}: ${d.msg}`)
      .join('; ');
  }
  if (detail && typeof detail === 'object' && 'message' in detail) return String((detail as { message: string }).message);
  if (envelope) return envelope;
  return e?.message || 'Unexpected error';
}

export function errorDetail<T = unknown>(err: unknown): T | undefined {
  return (err as AxiosError<{ detail?: T }>)?.response?.data?.detail;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}
