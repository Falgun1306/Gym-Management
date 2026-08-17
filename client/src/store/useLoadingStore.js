import { create } from 'zustand';

/**
 * Global Loading State Store
 * Tracks active API requests and provides centralized loading feedback.
 */
export const useLoadingStore = create((set) => ({
  activeRequests: 0,
  isLoading: false,

  startLoading: () =>
    set((state) => {
      const activeRequests = state.activeRequests + 1;
      return { activeRequests, isLoading: activeRequests > 0 };
    }),

  stopLoading: () =>
    set((state) => {
      const activeRequests = Math.max(0, state.activeRequests - 1);
      return { activeRequests, isLoading: activeRequests > 0 };
    }),

  resetLoading: () =>
    set({ activeRequests: 0, isLoading: false }),
}));
