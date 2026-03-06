import { axiosInstance } from '@/api/axiosInstance';
import type {
    TeacherRequestsListResponse,
    TeacherRequestsListParams,
    RequestTypesListResponse,
    CreateTeacherRequestPayload,
    JoinRequestFormResponse,
    TeacherRequestDetailResponse
} from '../types/teacher-requests.types';

/**
 * Teacher Requests Service
 * GET /teacher-requests, POST /teacher-requests, GET /teacher-requests/request-types, GET /join-request-forms/:id
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
     * GET /teacher-requests/request-types
     */
    getRequestTypes: (): Promise<RequestTypesListResponse> => {
        return axiosInstance.get('/teacher-requests/request-types');
    },

    /**
     * Get join request form by id (dynamic form fields for selected request type)
     * GET /join-request-forms/:id
     */
    getJoinRequestForm: (id: number): Promise<JoinRequestFormResponse> => {
        return axiosInstance.get(`/join-request-forms/${id}`);
    },

    /**
     * Get teacher request detail by id
     * GET /teacher-requests/:id
     */
    getTeacherRequestById: (id: number): Promise<TeacherRequestDetailResponse> => {
        return axiosInstance.get(`/teacher-requests/${id}`);
    }
};
