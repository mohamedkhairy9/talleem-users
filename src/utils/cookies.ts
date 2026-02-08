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

/** Compact entity for cookie (ids only for payloads after refresh) */
export interface CompactEntity {
    id?: number;
    memorization_program_entity_type_id?: number;
    session_mode_id?: number;
    main_program_id?: number;
}

export interface CompactUserData {
    id?: number;
    roles?: string[];
    permissions?: string[];
    entity?: CompactEntity;
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
     * Stores id, roles, permissions, and entity ids (for halaqa payloads)
     */
    setUserData: (userData: CompactUserData | { id?: number; roles?: string[]; permissions?: string[]; entity?: { id?: number; memorization_program_entity_type?: { id: number }; session_mode?: { id: number }; main_program?: { id: number } } } | null): void => {
        if (!userData) {
            Cookies.remove(USER_DATA_KEY, { path: '/' });
            return;
        }

        const entity = userData.entity as { id?: number; memorization_program_entity_type?: { id: number }; session_mode?: { id: number }; main_program?: { id: number } } | undefined;
        const compactData: CompactUserData = {
            id: userData.id,
            roles: userData.roles || [],
            permissions: userData.permissions || [],
            entity:
                entity && (entity.id != null || entity.memorization_program_entity_type?.id != null || entity.session_mode?.id != null || entity.main_program?.id != null)
                    ? {
                          id: entity.id,
                          memorization_program_entity_type_id: entity.memorization_program_entity_type?.id,
                          session_mode_id: entity.session_mode?.id,
                          main_program_id: entity.main_program?.id
                      }
                    : undefined
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
