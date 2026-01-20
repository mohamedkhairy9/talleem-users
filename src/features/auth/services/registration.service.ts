import { JoinRequestFormResponse, UserRoleType } from '../types/registration.types';
import axiosInstance from '@/api/axiosInstance';

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
    submitJoinRequest: async (userType: UserRoleType, data: FormData): Promise<any> => {
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
    }
};

