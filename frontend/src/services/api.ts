import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { TOKEN_KEY, clearStoredAuth } from './authStorage';

// Dev falls back to the local API; production builds use VITE_API_URL or a same-origin /v1 proxy.
const baseURL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000/v1' : '/v1');

// Routes whose content requires a session; a 401 elsewhere (landing, download) must not redirect.
const PROTECTED_PATH_PREFIXES = ['/dashboard'];

export const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attaches Bearer token if present
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor: handles 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      clearStoredAuth();

      if (
        typeof window !== 'undefined' &&
        PROTECTED_PATH_PREFIXES.some((prefix) => window.location.pathname.startsWith(prefix))
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
