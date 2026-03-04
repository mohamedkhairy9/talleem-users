import { axiosInstance } from '@/api/axiosInstance';
import type {
    TeacherRequestsListResponse,
    TeacherRequestsListParams,
    RequestTypesListResponse,
    CreateTeacherRequestPayload
} from '../types/teacher-requests.types';

/**
 * Teacher Requests Service
 * GET /teacher-requests, POST /teacher-requests, GET /request-types
 */
export const teacherRequestsService = {
    /**
     * Get teacher requests (paginated)
     * GET /teacher-requests
     */
    getTeacherRequests: (params?: TeacherRequestsListParams): Promise<TeacherRequestsListResponse> => {
        return axiosInstance.get('/teacher-requests', { params });
    },

    /**
     * Create a teacher request
     * POST /teacher-requests
     */
    createTeacherRequest: (payload: CreateTeacherRequestPayload): Promise<{ data: unknown }> => {
        return axiosInstance.post('/teacher-requests', payload);
    },

    /**
     * Get request types (for create form dropdown)
     * GET /request-types
     */
    getRequestTypes: (): Promise<RequestTypesListResponse> => {
        return axiosInstance.get('/request-types');
    }
};
