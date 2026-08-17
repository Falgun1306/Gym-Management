import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useLoadingStore } from '@/store/useLoadingStore';

/**
 * Pre-configured Axios instance for all API calls.
 *
 * Features:
 *  - Base URL pointing to the backend API (v1)
 *  - Request interceptor: auto-injects JWT Bearer token from Zustand store + starts global loader
 *  - Response interceptor: unwraps successful ApiResponse.data, stops global loader,
 *    handles 401 (auto-logout), and normalizes error messages for toast consumers
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// ── Request Interceptor: JWT Injection & Loader Trigger ───────────────────────

api.interceptors.request.use(
  (config) => {
    if (!config?.skipGlobalLoader) {
      useLoadingStore.getState().startLoading();
    }

    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    useLoadingStore.getState().stopLoading();
    return Promise.reject(error);
  }
);

// ── Response Interceptor: Unwrap, Loader Finish & Error Handling ──────────────

api.interceptors.response.use(
  (response) => {
    if (!response.config?.skipGlobalLoader) {
      useLoadingStore.getState().stopLoading();
    }

    // Backend wraps all responses in ApiResponse { statusCode, success, message, data, pagination? }
    // We unwrap to make consumers' lives simpler:  response.data → { data, message, pagination }
    return response.data;
  },
  (error) => {
    if (!error.config?.skipGlobalLoader) {
      useLoadingStore.getState().stopLoading();
    }

    const status = error.response?.status;
    const serverMessage =
      error.response?.data?.message || error.message || 'An unexpected error occurred';

    // 401 Unauthorized → force logout
    if (status === 401) {
      const { logout } = useAuthStore.getState();
      logout();

      // Don't reject for 401 during initial page load (avoids console noise)
      if (!window.__isInitialLoad) {
        return Promise.reject(new Error(serverMessage));
      }
    }

    // Normalize the error so all consumers can just do `error.message`
    const normalizedError = new Error(serverMessage);
    normalizedError.status = status;
    normalizedError.data = error.response?.data;
    return Promise.reject(normalizedError);
  }
);

export default api;

