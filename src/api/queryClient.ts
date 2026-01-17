import { QueryClient } from '@tanstack/react-query';

/**
 * React Query Client Configuration
 * Optimized for production with 70,000+ users
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
            gcTime: 10 * 60 * 1000, // 10 minutes - cache retention (gcTime replaces cacheTime in v5)
            retry: 1, // Only retry once on failure
            refetchOnWindowFocus: false, // Don't refetch on window focus for better performance
            refetchOnReconnect: true, // Refetch on reconnect
            refetchOnMount: true, // Refetch on component mount
        },
        mutations: {
            retry: 0, // Don't retry mutations
        },
    },
});
