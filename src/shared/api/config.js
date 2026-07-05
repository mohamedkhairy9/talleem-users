/**
 * API Configuration
 *
 * IMPORTANT:
 * - The app should call the shared front API through its real v2 base URL
 * - VITE_API_BASE_URL can still override the default when needed
 *
 * Configuration priority:
 * 1. VITE_API_BASE_URL (if set) - use this value
 * 2. Fallback to the shared v2 front API
 */
export const API_CONFIG = {
    baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api-tallam.vocus-dev2.com/api/v2/front',
    timeout: 30000, // 30 seconds
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};
/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/customer-login',
        LOGOUT: '/logout',
        USER: '/customer',
        REFRESH: '/customer-refresh-token',
        CHANGE_PASSWORD: '/customer/change-password',
    },
    JOIN_REQUESTS: {
        LIST: '/join-requests',
        LIST_PENDING: '/join-requests/pending',
        DETAIL: (id) => `/join-requests/${id}`,
        PROCESS_STEP: (id) => `/join-requests/${id}/process-step`,
    },
};
