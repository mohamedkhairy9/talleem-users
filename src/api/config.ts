/**
 * API Configuration
 * In development, uses Vite proxy (/api/front) to avoid CORS issues
 * The proxy handles /api/front paths correctly
 * In production, uses the full API URL
 */
export const API_CONFIG = {
    baseURL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api/front' : 'https://api-tallam.vocus-dev2.com/api/front'),
    timeout: 30000, // 30 seconds
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
} as const;

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/customer-login',
        CHANGE_PASSWORD: '/customer-change-password',
    },
    // Add more endpoints as needed
} as const;
