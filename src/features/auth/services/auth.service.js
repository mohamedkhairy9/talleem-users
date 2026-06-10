import { axiosInstance } from '@/shared/api/axiosInstance';
import { API_ENDPOINTS } from '@/shared/api/config';
/**
 * Authentication Service
 * Handles all authentication-related API calls
 */
export const authService = {
    /**
     * Login user
     */
    login: (credentials) => {
        return axiosInstance.post(API_ENDPOINTS.AUTH.LOGIN, credentials, { rawResponse: true });
    },
    /**
     * Logout user
     */
    logout: () => {
        return axiosInstance.post(API_ENDPOINTS.AUTH.LOGOUT);
    },
    /**
     * Get current authenticated user
     */
    getUser: () => {
        return axiosInstance.get(API_ENDPOINTS.AUTH.USER);
    },
    /**
     * Refresh authentication token
     */
    refreshToken: () => {
        return axiosInstance.post(API_ENDPOINTS.AUTH.REFRESH);
    },
    /**
     * Change password (customer/teacher)
     */
    changePassword: (payload) => {
        return axiosInstance.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, payload);
    }
};
