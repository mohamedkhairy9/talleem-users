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
export const useApiFormField = <T = any>({
    queryKey,
    queryFn,
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    transform = (data: any) => data
}: {
    queryKey: (string | number | boolean | null | undefined)[];
    queryFn: () => Promise<T>;
    enabled?: boolean;
    staleTime?: number;
    transform?: (data: any) => T;
}) => {
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

