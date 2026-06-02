import axios from 'axios';
import { API_CONFIG } from './config';
import { cookieService } from '@/utils/cookies';
import { useAuthStore } from '@/stores';
import i18n, { DEFAULT_LANG } from '@/i18n';
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
axiosInstance.interceptors.request.use((config) => {
    // Get token from cookies
    const token = cookieService.getToken();
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    // Set Accept-Language header based on current i18n language
    const currentLanguage = i18n.language || DEFAULT_LANG;
    if (config.headers) {
        config.headers['Accept-Language'] = currentLanguage;
    }
    // Clean empty parameters from GET requests
    if (config.params) {
        const cleanedParams = {};
        Object.keys(config.params).forEach(key => {
            const value = config.params[key];
            // Only include non-empty values
            if (value !== null &&
                value !== undefined &&
                value !== '' &&
                !(Array.isArray(value) && value.length === 0)) {
                cleanedParams[key] = value;
            }
        });
        config.params = cleanedParams;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});
/**
 * Response Interceptor
 * - Normalizes response data
 * - Handles 401 errors (unauthorized) by clearing auth
 * - Handles token refresh if needed
 */
axiosInstance.interceptors.response.use((response) => {
    // Return data directly for cleaner API calls
    return response.data;
}, async (error) => {
    const normalizedError = {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        data: error.response?.data,
        errors: error.response?.data?.errors || {}
    };
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
        const authStore = useAuthStore.getState();
        authStore.logout();
        // Redirect to login with current language (or default to Arabic)
        const currentPath = window.location.pathname;
        const lang = currentPath.split('/')[1] || DEFAULT_LANG;
        const loginPath = `/${lang}/login`;
        if (!currentPath.includes('/login')) {
            window.location.href = loginPath;
        }
    }
    // Handle 403 Forbidden
    if (error.response?.status === 403) {
        // Redirect to unauthorized page with current language
        const currentPath = window.location.pathname;
        const lang = currentPath.split('/')[1] || DEFAULT_LANG;
        const unauthorizedPath = `/${lang}/unauthorized`;
        // Only redirect if not already on unauthorized page
        if (!currentPath.includes('/unauthorized')) {
            window.location.href = unauthorizedPath;
        }
    }
    // Handle 500+ Server Errors
    if (error.response && error.response.status >= 500) {
        console.error('Server error:', normalizedError);
    }
    return Promise.reject(normalizedError);
});
export default axiosInstance;
