import { useQuery } from '@tanstack/react-query';
/**
 * Generic API form field hook
 * Handles API calls for form field options with caching
 *
 * @param queryKey - React Query key
 * @param queryFn - Function to fetch data
 * @param options - Additional options (enabled, staleTime, etc.)
 * @returns Object with data, isLoading, error, and getOptions function
 */
export const useApiFormField = ({ queryKey, queryFn, enabled = true, staleTime = 5 * 60 * 1000, // 5 minutes
transform = (data) => data }) => {
    const { data, isLoading, error } = useQuery({
        queryKey,
        queryFn: async () => {
            const response = await queryFn();
            return transform(response);
        },
        enabled,
        staleTime
    });
    return {
        data,
        isLoading,
        error
    };
};
