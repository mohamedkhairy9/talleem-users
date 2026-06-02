import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { teacherRequestsService } from '../services/teacher-requests.service';
import { registrationService } from '@/features/auth/services/registration.service';
const PER_PAGE = 20;
function extractDataList(response) {
    if (!response)
        return [];
    return response?.data ?? [];
}
function transformToSelectOptions(data, currentLang) {
    if (!data)
        return [];
    return data.map((item) => {
        const value = item.id ?? item.value ?? '';
        let label = '';
        if (typeof item.name === 'object' && item.name !== null) {
            label = currentLang === 'ar' && item.name.ar ? item.name.ar : (item.name.en || String(value));
        }
        else if (item.name) {
            label = String(item.name);
        }
        else if (item.label) {
            label = String(item.label);
        }
        else {
            label = String(value);
        }
        return { value, label };
    });
}
/**
 * Get teacher requests list (paginated)
 */
export function useTeacherRequests(params = {}) {
    const query = useQuery({
        queryKey: ['teacher-requests', params],
        queryFn: () => teacherRequestsService.getTeacherRequests(params),
        staleTime: 2 * 60 * 1000
    });
    const responseBody = query.data;
    const list = Array.isArray(responseBody?.data) ? responseBody.data : [];
    const meta = responseBody?.meta;
    return {
        ...query,
        list,
        meta
    };
}
/**
 * Get request types for create form (GET /teacher-requests/request-types)
 */
export function useRequestTypes() {
    return useQuery({
        queryKey: ['teacher-requests', 'request-types'],
        queryFn: () => teacherRequestsService.getRequestTypes(),
        staleTime: 5 * 60 * 1000
    });
}
/**
 * Get join request form for selected request type (GET /join-request-forms/:id).
 * Only runs when id is truthy.
 */
export function useJoinRequestForm(id) {
    return useQuery({
        queryKey: ['join-request-form', id],
        queryFn: () => teacherRequestsService.getJoinRequestForm(id),
        enabled: id != null && id > 0,
        staleTime: 5 * 60 * 1000
    });
}
/**
 * Get teacher request detail (GET /teacher-requests/:id).
 * Only runs when id is truthy.
 */
export function useTeacherRequestDetail(id) {
    return useQuery({
        queryKey: ['teacher-request-detail', id],
        queryFn: () => teacherRequestsService.getTeacherRequestById(id),
        enabled: id != null && id > 0,
        staleTime: 1 * 60 * 1000
    });
}
/**
 * Branches options for dynamic form select (e.g. new_branch_id)
 */
export function useBranchesOptions() {
    const { i18n } = useTranslation();
    const lang = i18n.language || 'ar';
    const query = useQuery({
        queryKey: ['teacher-request-form', 'branches'],
        queryFn: () => registrationService.getBranches(),
        staleTime: 5 * 60 * 1000
    });
    const options = useMemo(() => transformToSelectOptions(extractDataList(query.data), lang), [query.data, lang]);
    return { ...query, options };
}
/**
 * Entities options for dynamic form select (e.g. new_entity_id), filtered by branch_id.
 * Only runs when branchId is set.
 */
export function useEntitiesOptions(branchId) {
    const { i18n } = useTranslation();
    const lang = i18n.language || 'ar';
    const query = useQuery({
        queryKey: ['teacher-request-form', 'entities', branchId],
        queryFn: () => registrationService.getEntities({ branch_id: branchId }),
        enabled: branchId != null && branchId > 0,
        staleTime: 2 * 60 * 1000
    });
    const options = useMemo(() => transformToSelectOptions(extractDataList(query.data), lang), [query.data, lang]);
    return { ...query, options };
}
/**
 * Paginated loadOptions for branches select (FormAsyncPaginate).
 * Sends page, per_page, search to GET /branches.
 */
export function createBranchesLoader(currentLang) {
    return async (search, _loaded, additional) => {
        const page = additional?.page ?? 1;
        const res = await registrationService.getBranches({
            page,
            per_page: PER_PAGE,
            search: search || undefined
        });
        const data = res?.data ?? [];
        const options = transformToSelectOptions(Array.isArray(data) ? data : [], currentLang);
        const meta = res?.meta;
        const hasMore = !!(meta?.current_page != null &&
            meta?.last_page != null &&
            meta.current_page < meta.last_page);
        return { options, hasMore, additional: { page: page + 1 } };
    };
}
/**
 * Paginated loadOptions for entities select (FormAsyncPaginate).
 * Sends branch_id, page, per_page, search to GET /entities. Returns empty until branchId is set.
 */
export function createEntitiesLoader(branchId, currentLang) {
    return async (search, _loaded, additional) => {
        if (branchId == null || branchId === 0) {
            return { options: [], hasMore: false, additional: { page: 1 } };
        }
        const page = additional?.page ?? 1;
        const res = await registrationService.getEntities({
            branch_id: branchId,
            page,
            per_page: PER_PAGE,
            search: search || undefined
        });
        const data = res?.data ?? [];
        const options = transformToSelectOptions(Array.isArray(data) ? data : [], currentLang);
        const meta = res?.meta;
        const hasMore = !!(meta?.current_page != null &&
            meta?.last_page != null &&
            meta.current_page < meta.last_page);
        return { options, hasMore, additional: { page: page + 1 } };
    };
}
/** Infer select options source from field key and depends_on (branches vs entities) */
export function getSelectOptionsSource(field) {
    if (field.type !== 'select')
        return null;
    const key = field.key.toLowerCase();
    if (key.includes('branch') || key === 'new_branch_id')
        return { source: 'branches' };
    if (field.depends_on && (key.includes('entity') || key === 'new_entity_id')) {
        return { source: 'entities', dependsOnField: field.depends_on.field };
    }
    return null;
}
/**
 * Create teacher request mutation
 */
export function useCreateTeacherRequest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => teacherRequestsService.createTeacherRequest(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teacher-requests'] });
        }
    });
}
