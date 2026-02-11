import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { warningsService, CreateWarningPayload, UpdateWarningPayload, WarningReasonsResponse } from '../services/warnings.service';
import type { WarningsListParams, WarningsListResponse, WarningResponse } from '../services/warnings.service';

/**
 * Get warnings list (paginated, with filters)
 */
export const useWarnings = (params: WarningsListParams = {}) => {
    const query = useQuery({
        queryKey: ['warnings', params],
        queryFn: () => warningsService.getWarnings(params),
        staleTime: 2 * 60 * 1000
    });

    // Axios interceptor returns response.data (API body), so query.data = { data: [], meta: {} }
    const responseBody = query.data as WarningsListResponse | undefined;
    const list: WarningResponse[] = Array.isArray(responseBody?.data) ? responseBody.data : [];
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
export const useWarningReasons = (mainProgramId: number | null | undefined) => {
    return useQuery({
        queryKey: ['warning-reasons', mainProgramId],
        queryFn: () => warningsService.getWarningReasons(mainProgramId!),
        enabled: !!mainProgramId,
        staleTime: 5 * 60 * 1000
    });
};

// Helper to extract warning reasons data
export const useWarningReasonsOptions = (mainProgramId: number | null | undefined) => {
    const { data, isLoading } = useWarningReasons(mainProgramId);
    // Axios interceptor returns response.data directly, so data = { data: [], meta: {} }
    const reasons = data?.data || [];
    return { reasons, isLoading };
};

/**
 * Create warning mutation hook
 */
export const useCreateWarning = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateWarningPayload) => warningsService.createWarning(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['warnings'] });
        }
    });
};

/**
 * Get a single warning by ID
 */
export const useWarning = (id: number | null | undefined) => {
    return useQuery({
        queryKey: ['warning', id],
        queryFn: () => warningsService.getWarning(id!),
        enabled: !!id,
        staleTime: 2 * 60 * 1000
    });
};

/**
 * Update warning mutation hook
 */
export const useUpdateWarning = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateWarningPayload }) =>
            warningsService.updateWarning(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['warnings'] });
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
        mutationFn: (id: number) => warningsService.deleteWarning(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['warnings'] });
        }
    });
};

