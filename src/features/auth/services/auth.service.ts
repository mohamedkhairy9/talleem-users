import { axiosInstance } from '@/api/axiosInstance';
import { API_ENDPOINTS } from '@/api/config';

interface LoginCredentials {
    email: string;
    password: string;
}

interface LoginResponse {
    message: string;
    data: {
        front_access_token: string;
        token_type: string;
        user: {
            id: number;
            guid: string | null;
            name: { en: string; ar: string };
            email: string;
            phone: string;
            status: boolean;
            locale: string;
            current_app_locale: string;
            user_type: string;
            entity?: import('@/globals/types').Entity;
            email_verified_at: string | null;
            created_at: string;
            updated_at: string;
            roles: string[];
            permissions: string[];
        };
    };
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
    },

    /**
     * Change password (customer/teacher)
     */
    changePassword: (payload: { new_password: string; new_password_confirmation: string }): Promise<{ message?: string }> => {
        return axiosInstance.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, payload);
    }
};
