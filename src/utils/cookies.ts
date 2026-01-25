import Cookies from 'js-cookie';

/**
 * Cookie Keys
 * Meaningful names specific to tallem-users-dashboard application
 */
const TOKEN_KEY = 'tallem_users_dashboard_auth_token';
const USER_DATA_KEY = 'tallem_users_dashboard_user_data';

const COOKIE_OPTIONS = {
    expires: 7, // 7 days
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict' as const, // CSRF protection
    path: '/'
};

interface CompactUserData {
    id?: number;
    roles?: string[];
    permissions?: string[];
}

/**
 * Cookie Service
 * Handles authentication token and user data storage in cookies
 * Note: Cookies have a 4KB size limit, so we store only essential data
 */
export const cookieService = {
    setToken: (token: string): void => {
        Cookies.set(TOKEN_KEY, token, COOKIE_OPTIONS);
    },

    getToken: (): string | undefined => {
        return Cookies.get(TOKEN_KEY);
    },

    removeToken: (): void => {
        Cookies.remove(TOKEN_KEY, { path: '/' });
    },

    hasToken: (): boolean => {
        return !!Cookies.get(TOKEN_KEY);
    },

    /**
     * Store user data in cookie (compact format to respect 4KB limit)
     * Only stores essential data: id, roles, permissions
     */
    setUserData: (userData: CompactUserData | null): void => {
        if (!userData) {
            Cookies.remove(USER_DATA_KEY, { path: '/' });
            return;
        }

        // Create compact user data object (only essential fields)
        const compactData: CompactUserData = {
            id: userData.id,
            roles: userData.roles || [],
            permissions: userData.permissions || []
        };

        // Convert to JSON string
        const jsonString = JSON.stringify(compactData);
        
        // Check size (cookie limit is ~4KB, leave some buffer)
        if (jsonString.length > 3500) {
            console.warn('User data cookie size exceeds recommended limit. Consider reducing data.');
        }

        Cookies.set(USER_DATA_KEY, jsonString, COOKIE_OPTIONS);
    },

    /**
     * Get user data from cookie
     */
    getUserData: (): CompactUserData | null => {
        const data = Cookies.get(USER_DATA_KEY);
        if (!data) {
            return null;
        }

        try {
            return JSON.parse(data) as CompactUserData;
        } catch (error) {
            console.error('Error parsing user data from cookie:', error);
            // Remove invalid cookie
            Cookies.remove(USER_DATA_KEY, { path: '/' });
            return null;
        }
    },

    /**
     * Remove user data cookie
     */
    removeUserData: (): void => {
        Cookies.remove(USER_DATA_KEY, { path: '/' });
    }
};
