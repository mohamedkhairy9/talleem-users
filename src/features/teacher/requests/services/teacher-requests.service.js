import { axiosInstance } from '@/shared/api/axiosInstance';
/**
 * Teacher Requests Service
 * GET /teacher-requests, POST /teacher-requests, GET /teacher-requests/request-types, GET /join-request-forms/:id
 */
export const teacherRequestsService = {
    /**
     * Get teacher requests (paginated)
     * GET /teacher-requests
     */
    getTeacherRequests: (params) => {
        return axiosInstance.get('/teacher-requests', { params });
    },
    /**
     * Create a teacher request
     * POST /teacher-requests
     */
    createTeacherRequest: (payload) => {
        return axiosInstance.post('/teacher-requests', payload);
    },
    /**
     * Get request types (for create form dropdown)
     * GET /teacher-requests/request-types
     */
    getRequestTypes: () => {
        return axiosInstance.get('/teacher-requests/request-types');
    },
    /**
     * Get join request form by id (dynamic form fields for selected request type)
     * GET /join-request-forms/:id
     */
    getJoinRequestForm: (id) => {
        return axiosInstance.get(`/join-request-forms/${id}`);
    },
    /**
     * Get teacher request detail by id
     * GET /teacher-requests/:id
     */
    getTeacherRequestById: (id) => {
        return axiosInstance.get(`/teacher-requests/${id}`);
    }
};
