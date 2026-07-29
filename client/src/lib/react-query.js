import { QueryClient } from '@tanstack/react-query';

/**
 * Global React Query client with sensible defaults for our gym app.
 *
 * - staleTime: 2 minutes – server data stays "fresh" for 2m before refetching
 * - gcTime: 10 minutes – unused cache entries are garbage-collected after 10m
 * - retry: 1 attempt on failure (except 401/403 which we don't retry)
 * - refetchOnWindowFocus: true – ensures data is fresh when user tabs back
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,         // 2 minutes
      gcTime: 10 * 60 * 1000,            // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry auth errors
        if (error?.status === 401 || error?.status === 403) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
});
