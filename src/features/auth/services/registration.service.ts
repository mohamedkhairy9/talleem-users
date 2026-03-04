import { JoinRequestFormResponse, UserRoleType } from '../types/registration.types';
import axiosInstance from '@/api/axiosInstance';

export interface SelectOption {
    id: number | string;
    name?: string | { ar?: string; en?: string };
    label?: string;
    value?: number | string;
    [key: string]: any;
}

/** Pagination params for async-paginate selects */
export interface ListParams {
    page?: number;
    per_page?: number;
    search?: string;
}

/**
 * Registration Service
 * Uses /api/front/join-request-forms endpoints
 */
export const registrationService = {
    /**
     * Get join request form structure for a user type
     */
    getJoinRequestForm: async (userType: UserRoleType): Promise<JoinRequestFormResponse> => {
        return axiosInstance.get(`/join-request-forms/${userType}`);
    },

    /**
     * Submit join request
     */
    submitJoinRequest: async (_userType: UserRoleType, data: FormData): Promise<any> => {
        return axiosInstance.post(`/join-requests`, data, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },

    /**
     * Check join request status by email or national_id (phone)
     */
    checkJoinRequestStatus: async (data: { email?: string; national_id?: string }): Promise<any> => {
        return axiosInstance.post('/join-request/status', data);
    },

    /**
     * Submit a join request step (e.g. upload documents)
     */
    submitJoinRequestStep: async (joinRequestId: number, formData: FormData): Promise<any> => {
        return axiosInstance.post(`/join-request/${joinRequestId}/submit-step`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },

    /**
     * Get cities (paginated)
     */
    getCities: async (params?: ListParams & Record<string, unknown>): Promise<{ data: SelectOption[]; meta?: { current_page?: number; last_page?: number } }> => {
        return axiosInstance.get('/cities', { params });
    },

    /**
     * Get neighborhoods (with optional city_id filter, paginated)
     */
    getNeighborhoods: async (params?: { city_id?: number | string } & ListParams): Promise<{ data: SelectOption[]; meta?: { current_page?: number; last_page?: number } }> => {
        return axiosInstance.get('/neighborhoods', { params });
    },

    /**
     * Get branches (paginated)
     */
    getBranches: async (params?: ListParams): Promise<{ data: SelectOption[]; meta?: { current_page?: number; last_page?: number } }> => {
        return axiosInstance.get('/branches', { params });
    },

    /**
     * Get session modes (paginated)
     */
    getSessionModes: async (params?: ListParams): Promise<{ data: SelectOption[]; meta?: { current_page?: number; last_page?: number } }> => {
        return axiosInstance.get('/session-modes', { params });
    },

    /**
     * Get nationalities (paginated)
     */
    getNationalities: async (params?: ListParams): Promise<{ data: SelectOption[]; meta?: { current_page?: number; last_page?: number } }> => {
        return axiosInstance.get('/nationalities', { params });
    },

    /**
     * Get majors (paginated)
     */
    getMajors: async (params?: ListParams): Promise<{ data: SelectOption[]; meta?: { current_page?: number; last_page?: number } }> => {
        return axiosInstance.get('/majors', { params });
    },

    /**
     * Get academic qualifications (paginated)
     */
    getAcademicQualifications: async (params?: ListParams): Promise<{ data: SelectOption[]; meta?: { current_page?: number; last_page?: number } }> => {
        return axiosInstance.get('/academic-qualifications', { params });
    },

    /**
     * Get remotely attendance platforms (paginated)
     */
    getRemotelyAttendancePlatforms: async (params?: ListParams): Promise<{ data: SelectOption[]; meta?: { current_page?: number; last_page?: number } }> => {
        return axiosInstance.get('/remotely-attendance-platforms', { params });
    },

    /**
     * Get memorization program entity types (paginated)
     */
    getMemorizationProgramEntityTypes: async (params?: ListParams): Promise<{ data: SelectOption[]; meta?: { current_page?: number; last_page?: number } }> => {
        return axiosInstance.get('/memorization-program-entity-types', { params });
    },

    /**
     * Get main programs (paginated)
     */
    getMainPrograms: async (params?: ListParams): Promise<{ data: SelectOption[]; meta?: { current_page?: number; last_page?: number } }> => {
        return axiosInstance.get('/main-programs', { params });
    },

    /**
     * Get entities (filtered by branch_id and main_program_id, paginated)
     */
    getEntities: async (params?: { branch_id?: number | string; main_program_id?: number | string } & ListParams): Promise<{ data: SelectOption[]; meta?: { current_page?: number; last_page?: number } }> => {
        return axiosInstance.get('/entities', { params });
    }
};

