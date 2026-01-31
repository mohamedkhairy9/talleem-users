import { useMutation, useQuery } from '@tanstack/react-query';
import { halaqasService, CreateHalaqaPayload } from '../services/halaqas.service';
import type {
    HalaqasListParams,
    HalaqasListResponse,
    HalaqaListItem,
    HalaqasListMeta
} from '../types/list.types';

/**
 * Create halaqa mutation hook
 */
export const useCreateHalaqa = () => {
    return useMutation({
        mutationFn: (data: CreateHalaqaPayload) => halaqasService.createHalaqa(data)
    });
};

/**
 * Get halaqas list (paginated, with filters).
 * API response: { data: HalaqaListItem[], meta: { current_page, per_page, total, last_page } }.
 * Pagination is driven by meta; list is the current page only (no appending).
 */
export const useHalaqas = (params: HalaqasListParams = {}) => {
    const query = useQuery({
        queryKey: ['halaqas', params],
        queryFn: () => halaqasService.getHalaqas(params),
        staleTime: 2 * 60 * 1000
    });

    // Axios interceptor returns response.data (API body), so query.data = { data: [], meta: {} }
    const responseBody = query.data as HalaqasListResponse | undefined;
    const list: HalaqaListItem[] = Array.isArray(responseBody?.data) ? responseBody.data : [];
    const meta: HalaqasListMeta | undefined = responseBody?.meta;

    return {
        ...query,
        list,
        meta
    };
};

/**
 * Get halaqa by ID query hook
 */
export const useHalaqa = (id: number | string) => {
    return useQuery({
        queryKey: ['halaqa', id],
        queryFn: () => halaqasService.getHalaqa(id),
        enabled: !!id
    });
};

/**
 * Update halaqa mutation hook
 */
export const useUpdateHalaqa = () => {
    return useMutation({
        mutationFn: ({ id, data }: { id: number | string; data: Partial<CreateHalaqaPayload> }) =>
            halaqasService.updateHalaqa(id, data)
    });
};

/**
 * Delete halaqa mutation hook
 */
export const useDeleteHalaqa = () => {
    return useMutation({
        mutationFn: (id: number | string) => halaqasService.deleteHalaqa(id)
    });
};

