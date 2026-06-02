/**
 * API Configuration
 *
 * PROXY EXPLANATION:
 * - In development, we use Vite's proxy (/api/front) to avoid CORS issues
 * - The proxy (configured in vite.config.ts) forwards /api/* requests to the backend
 * - This makes the browser think requests are same-origin (no CORS needed)
 * - The backend doesn't need to whitelist localhost because requests appear to come from the proxy
 *
 * IMPORTANT:
 * - DO NOT set VITE_API_BASE_URL to localhost in development - it will bypass the proxy and cause CORS errors
 * - In development: use '/api/front' (uses proxy) or leave VITE_API_BASE_URL unset
 * - In production: set VITE_API_BASE_URL to the full backend URL (e.g., 'https://api-tallam.vocus-dev2.com/api/front')
 *
 * Configuration priority:
 * 1. VITE_API_BASE_URL (if set) - use this value
 * 2. Development mode - use '/api/front' (proxy)
 * 3. Production mode - use default production URL
 */
export const API_CONFIG = {
    baseURL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api/v1/front' : 'https://api-tallam.vocus-dev2.com/api/v1/front'),
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
        PROCESS_STEP: (id) => `/join-requests/${id}/process-step`,
    },
};
