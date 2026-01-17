import { axiosInstance } from '@/api/axiosInstance';
import { API_ENDPOINTS } from '@/api/config';

interface LoginCredentials {
    email: string;
    password: string;
}

interface LoginResponse {
    user: any;
    token: string;
}

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */
export const authService = {
    /**
     * Login user
     */
    login: (credentials: LoginCredentials): Promise<LoginResponse> => {
        return axiosInstance.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
    },

    /**
     * Logout user
     */
    logout: (): Promise<void> => {
        return axiosInstance.post(API_ENDPOINTS.AUTH.LOGOUT);
    },

    /**
     * Get current authenticated user
     */
    getUser: (): Promise<any> => {
        return axiosInstance.get(API_ENDPOINTS.AUTH.USER);
    },

    /**
     * Refresh authentication token
     */
    refreshToken: (): Promise<{ token: string }> => {
        return axiosInstance.post(API_ENDPOINTS.AUTH.REFRESH);
    }
};
