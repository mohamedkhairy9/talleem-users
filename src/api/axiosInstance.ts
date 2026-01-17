import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_CONFIG } from './config';
import { cookieService } from '@/utils/cookies';
import { useAuthStore } from '@/stores';
import i18n from '@/i18n';
import { ApiError } from '@/globals/types';
import { ROUTE_PATHS } from '@/config';

/**
 * Axios instance with interceptors
 * Handles authentication tokens, language headers, and error responses
 */
export const axiosInstance = axios.create({
    baseURL: API_CONFIG.baseURL,
    timeout: API_CONFIG.timeout,
    headers: API_CONFIG.headers,
    withCredentials: true // Important for cookie-based auth
});

/**
 * Request Interceptor
 * - Attaches token from cookies to Authorization header
 * - Sets Accept-Language header based on current language
 * - Cleans empty parameters from GET requests
 */
axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Get token from cookies
        const token = cookieService.getToken();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Set Accept-Language header based on current i18n language
        const currentLanguage = i18n.language || 'en';
        if (config.headers) {
            config.headers['Accept-Language'] = currentLanguage;
        }

        // Clean empty parameters from GET requests
        if (config.params) {
            const cleanedParams: Record<string, any> = {};
            
            Object.keys(config.params).forEach(key => {
                const value = config.params[key];
                
                // Only include non-empty values
                if (
                    value !== null && 
                    value !== undefined && 
                    value !== '' &&
                    !(Array.isArray(value) && value.length === 0)
                ) {
                    cleanedParams[key] = value;
                }
            });
            
            config.params = cleanedParams;
        }

        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

/**
 * Response Interceptor
 * - Normalizes response data
 * - Handles 401 errors (unauthorized) by clearing auth
 * - Handles token refresh if needed
 */
axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
        // Return data directly for cleaner API calls
        return response.data;
    },
    async (error: AxiosError): Promise<never> => {
        const normalizedError: ApiError = {
            status: error.response?.status,
            message: (error.response?.data as any)?.message || error.message,
            data: error.response?.data,
            errors: (error.response?.data as any)?.errors || {}
        };

        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
            const authStore = useAuthStore.getState();
            authStore.logout();
            
            // Redirect to login if not already there
            if (window.location.pathname !== ROUTE_PATHS.LOGIN) {
                window.location.href = ROUTE_PATHS.LOGIN;
            }
        }

        // Handle 403 Forbidden
        if (error.response?.status === 403) {
            // Could show a permission denied message
            console.warn('Access forbidden');
        }

        // Handle 500+ Server Errors
        if (error.response && error.response.status >= 500) {
            console.error('Server error:', normalizedError);
        }

        return Promise.reject(normalizedError);
    }
);

export default axiosInstance;
