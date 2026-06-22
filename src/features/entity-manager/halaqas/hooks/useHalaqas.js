import { useMutation, useQuery } from '@tanstack/react-query';
import { halaqasService } from '../services/halaqas.service';
/**
 * Create halaqa mutation hook
 */
export const useCreateHalaqa = () => {
    return useMutation({
        mutationFn: (data) => halaqasService.createHalaqa(data)
    });
};
/**
 * Get halaqas list (paginated, with filters).
 * API response: { data: HalaqaListItem[], meta: { current_page, per_page, total, last_page } }.
 * Pagination is driven by meta; list is the current page only (no appending).
 */
export const useHalaqas = (params = {}) => {
    const query = useQuery({
        queryKey: ['halaqas', params],
        queryFn: () => halaqasService.getHalaqas(params),
        staleTime: 2 * 60 * 1000
    });
    // Axios interceptor returns response.data (API body). Some responses may wrap list/meta one level deeper.
    const responseBody = query.data;
    const nestedResponseBody = responseBody?.data && !Array.isArray(responseBody.data)
        ? responseBody.data
        : null;
    const list = Array.isArray(responseBody?.data)
        ? responseBody.data
        : Array.isArray(nestedResponseBody?.data)
            ? nestedResponseBody.data
            : [];
    const meta = responseBody?.meta ??
        nestedResponseBody?.meta ??
        responseBody?.pagination ??
        nestedResponseBody?.pagination ??
        null;
    console.log('Halaqa list response debug:', {
        params,
        responseBody,
        resolvedMeta: meta,
        listLength: list.length
    });
    return {
        ...query,
        list,
        meta
    };
};
/**
 * Get halaqa by ID query hook
 */
export const useHalaqa = (id) => {
    return useQuery({
        queryKey: ['halaqa', id],
        queryFn: () => halaqasService.getHalaqa(id),
        enabled: !!id
    });
};
/**
 * Update halaqa mutation hook
 * Only allows updating: name, teacher_id, period, start_date, end_date, activities, student_ids
 */
export const useUpdateHalaqa = () => {
    return useMutation({
        mutationFn: ({ id, data }) => halaqasService.updateHalaqa(id, data)
    });
};
/**
 * Delete halaqa mutation hook
 */
export const useDeleteHalaqa = () => {
    return useMutation({
        mutationFn: (id) => halaqasService.deleteHalaqa(id)
    });
};
/**
 * Create plan mutation hook
 */
export const useCreatePlan = () => {
    return useMutation({
        mutationFn: ({ halaqaId, data }) => halaqasService.createPlan(halaqaId, data)
    });
};
/**
 * Join a student to an existing halaqa after start
 */
export const useJoinHalaqaStudent = () => {
    return useMutation({
        mutationFn: ({ halaqaId, data }) => halaqasService.joinStudent(halaqaId, data)
    });
};
/**
 * Check availability mutation hook
 * Must be triggered manually via mutate()
 */
export const useCheckAvailability = () => {
    return useMutation({
        mutationFn: (payload) => halaqasService.checkAvailability(payload)
    });
};
