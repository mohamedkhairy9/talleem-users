import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherRequestsService } from '../services/teacher-requests.service';
import type {
    TeacherRequestsListParams,
    TeacherRequestItem,
    CreateTeacherRequestPayload
} from '../types/teacher-requests.types';

/**
 * Get teacher requests list (paginated)
 */
export function useTeacherRequests(params: TeacherRequestsListParams = {}) {
    const query = useQuery({
        queryKey: ['teacher-requests', params],
        queryFn: () => teacherRequestsService.getTeacherRequests(params),
        staleTime: 2 * 60 * 1000
    });

    const responseBody = query.data;
    const list: TeacherRequestItem[] = Array.isArray(responseBody?.data) ? responseBody.data : [];
    const meta = responseBody?.meta;

    return {
        ...query,
        list,
        meta
    };
}

/**
 * Get request types for create form
 */
export function useRequestTypes() {
    return useQuery({
        queryKey: ['request-types'],
        queryFn: () => teacherRequestsService.getRequestTypes(),
        staleTime: 5 * 60 * 1000
    });
}

/**
 * Create teacher request mutation
 */
export function useCreateTeacherRequest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateTeacherRequestPayload) =>
            teacherRequestsService.createTeacherRequest(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teacher-requests'] });
        }
    });
}
