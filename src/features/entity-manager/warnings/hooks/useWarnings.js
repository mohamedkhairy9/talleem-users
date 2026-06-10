import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { warningsService } from '../services/warnings.service';
/**
 * Get warnings list (paginated, with filters)
 */
export const useWarnings = (params = {}, options = {}) => {
    const query = useQuery({
        queryKey: ['warnings', params],
        queryFn: () => warningsService.getWarnings(params),
        enabled: options.enabled ?? true,
        staleTime: 2 * 60 * 1000
    });
    // Axios interceptor returns response.data (API body), so query.data = { data: [], meta: {} }
    const responseBody = query.data;
    const list = Array.isArray(responseBody?.data) ? responseBody.data : [];
    const meta = responseBody?.meta;
    return {
        ...query,
        list,
        meta
    };
};
/**
 * Get incoming warnings list from the dedicated entity-manager endpoint.
 */
export const useIncomingWarnings = (params = {}, options = {}) => {
    const query = useQuery({
        queryKey: ['incoming-warnings', params],
        queryFn: () => warningsService.getIncomingWarnings(params),
        enabled: options.enabled ?? true,
        staleTime: 2 * 60 * 1000
    });
    const responseBody = query.data;
    const list = Array.isArray(responseBody?.data) ? responseBody.data : Array.isArray(responseBody) ? responseBody : [];
    const meta = responseBody?.meta;
    return {
        ...query,
        list,
        meta
    };
};
/**
 * Get issued warnings list from the dedicated entity-manager endpoint.
 */
export const useIssuedWarnings = (params = {}, options = {}) => {
    const query = useQuery({
        queryKey: ['issued-warnings', params],
        queryFn: () => warningsService.getIssuedWarnings(params),
        enabled: options.enabled ?? true,
        staleTime: 2 * 60 * 1000
    });
    const responseBody = query.data;
    const list = Array.isArray(responseBody?.data) ? responseBody.data : Array.isArray(responseBody) ? responseBody : [];
    const meta = responseBody?.meta;
    return {
        ...query,
        list,
        meta
    };
};
/**
 * Get warning reasons by main_program_id
 */
export const useWarningReasons = () => {
    return useQuery({
        queryKey: ['warning-reasons'],
        queryFn: () => warningsService.getWarningReasons(),
        staleTime: 5 * 60 * 1000
    });
};
// Helper to extract warning reasons data
export const useWarningReasonsOptions = () => {
    const { data, isLoading } = useWarningReasons();

    const reasons =
        Array.isArray(data?.data?.data)
            ? data.data.data
            : Array.isArray(data?.data)
                ? data.data
                : Array.isArray(data)
                    ? data
                    : [];

    return { reasons, isLoading };
};
/**
 * Create warning mutation hook
 */
export const useCreateWarning = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => warningsService.createIssuedWarning(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['warnings'] });
            queryClient.invalidateQueries({ queryKey: ['incoming-warnings'] });
            queryClient.invalidateQueries({ queryKey: ['issued-warnings'] });
        }
    });
};
/**
 * Get a single warning by ID
 */
export const useWarning = (id, options = {}) => {
    return useQuery({
        queryKey: ['warning', id],
        queryFn: () => warningsService.getWarning(id),
        enabled: options.enabled ?? !!id,
        staleTime: 2 * 60 * 1000
    });
};
/**
 * Update warning mutation hook
 */
export const useUpdateWarning = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => warningsService.updateWarning(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['warnings'] });
            queryClient.invalidateQueries({ queryKey: ['incoming-warnings'] });
            queryClient.invalidateQueries({ queryKey: ['issued-warnings'] });
            queryClient.invalidateQueries({ queryKey: ['warning', variables.id] });
        }
    });
};
/**
 * Delete warning mutation hook
 */
export const useDeleteWarning = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => warningsService.deleteIssuedWarning(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['warnings'] });
            queryClient.invalidateQueries({ queryKey: ['incoming-warnings'] });
            queryClient.invalidateQueries({ queryKey: ['issued-warnings'] });
        }
    });
};
