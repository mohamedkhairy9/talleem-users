import { JoinRequestFormResponse, UserRoleType } from '../types/registration.types';
import axiosInstance from '@/api/axiosInstance';

export interface SelectOption {
    id: number | string;
    name?: string | { ar?: string; en?: string };
    label?: string;
    value?: number | string;
    [key: string]: any;
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
     * Get cities
     */
    getCities: async (): Promise<{ data: SelectOption[] }> => {
        return axiosInstance.get('/cities');
    },

    /**
     * Get neighborhoods (with optional city_id filter)
     */
    getNeighborhoods: async (params?: { city_id?: number | string }): Promise<{ data: SelectOption[] }> => {
        return axiosInstance.get('/neighborhoods', { params });
    },

    /**
     * Get branches
     */
    getBranches: async (): Promise<{ data: SelectOption[] }> => {
        return axiosInstance.get('/branches');
    },

    /**
     * Get session modes
     */
    getSessionModes: async (): Promise<{ data: SelectOption[] }> => {
        return axiosInstance.get('/session-modes');
    },

    /**
     * Get nationalities
     */
    getNationalities: async (): Promise<{ data: SelectOption[] }> => {
        return axiosInstance.get('/nationalities');
    },

    /**
     * Get majors
     */
    getMajors: async (): Promise<{ data: SelectOption[] }> => {
        return axiosInstance.get('/majors');
    },

    /**
     * Get academic qualifications
     */
    getAcademicQualifications: async (): Promise<{ data: SelectOption[] }> => {
        return axiosInstance.get('/academic-qualifications');
    },

    /**
     * Get remotely attendance platforms
     */
    getRemotelyAttendancePlatforms: async (): Promise<{ data: SelectOption[] }> => {
        return axiosInstance.get('/remotely-attendance-platforms');
    },

    /**
     * Get memorization program entity types
     */
    getMemorizationProgramEntityTypes: async (): Promise<{ data: SelectOption[] }> => {
        return axiosInstance.get('/memorization-program-entity-types');
    },

    /**
     * Get main programs
     */
    getMainPrograms: async (): Promise<{ data: SelectOption[] }> => {
        return axiosInstance.get('/main-programs');
    }
};

