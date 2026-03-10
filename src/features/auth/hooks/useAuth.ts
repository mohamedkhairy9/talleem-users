import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { authService } from '../services/auth.service';
import { useAuthStore } from '@/stores';
import { cookieService } from '@/utils/cookies';

interface LoginCredentials {
    email: string;
    password: string;
}

/**
 * Normalize role names from API to match app's expected format
 * Converts "entity manager" -> "entity_manager", etc.
 */
const normalizeRoles = (roles: string[]): string[] => {
    return roles.map(role => {
        // Normalize role names: replace spaces with underscores and convert to lowercase
        const normalized = role.toLowerCase().replace(/\s+/g, '_');
        
        // Map common variations
        const roleMapping: Record<string, string> = {
            'entity_manager': 'entity_manager',
            'entitymanager': 'entity_manager',
            'teacher': 'teacher',
            'admin': 'admin'
        };
        
        return roleMapping[normalized] || normalized;
    });
};

/**
 * Login mutation hook
 */
export const useLoginMutation = () => {
    const setUser = useAuthStore(state => state.setUser);
    const setLoading = useAuthStore(state => state.setLoading);

    return useMutation({
        mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
        onSuccess: (response: any) => {
            // API: { message, data: { front_access_token, token_type, user } }; axios puts body in response.data
            const body = response?.data ?? response;
            const inner = body?.data ?? body;
            const token = inner.front_access_token ?? inner.token ?? body.front_access_token ?? body.token;
            let user = inner.user ?? body.user ?? inner;
            if (typeof user !== 'object' || user === null) user = { id: 0, roles: [], permissions: [] };

            if (user.roles && Array.isArray(user.roles)) {
                user.roles = normalizeRoles(user.roles);
            } else {
                user.roles = user.roles ?? [];
            }
            if (!Array.isArray(user.permissions)) user.permissions = user.permissions ?? [];

            setUser(user, token);
            setLoading(false);
        },
        onError: () => {
            setLoading(false);
        },
        onMutate: () => {
            setLoading(true);
        }
    });
};

/**
 * Logout mutation hook
 */
export const useLogoutMutation = () => {
    const queryClient = useQueryClient();
    const logout = useAuthStore(state => state.logout);

    return useMutation({
        mutationFn: () => authService.logout(),
        onSuccess: () => {
            queryClient.clear();
            logout();
        },
        onError: () => {
            // Even if API call fails, logout locally
            queryClient.clear();
            logout();
        }
    });
};

/**
 * Get current user query hook
 */
export const useUserQuery = () => {
    const setUser = useAuthStore(state => state.setUser);
    const token = cookieService.getToken();

    const query = useQuery({
        queryKey: ['user', 'current'],
        queryFn: () => authService.getUser(),
        enabled: !!token, // Only run if token exists
        retry: false,
        staleTime: Infinity // User data doesn't change often
    });

    // Handle success with useEffect (React Query v5+ removed onSuccess)
    useEffect(() => {
        if (query.isSuccess && query.data) {
            // Handle new API response structure
            const responseData = query.data.data || query.data;
            let user = responseData.user || responseData;
            
            // Use roles array directly from API response
            if (user.roles && Array.isArray(user.roles)) {
                // Normalize role names to match app's expected format
                user.roles = normalizeRoles(user.roles);
            } else {
                // Fallback: if roles array is missing, initialize empty array
                // The app should rely on roles from API, not user_type
                user.roles = [];
            }
            
            setUser(user, token || undefined);
        }
    }, [query.isSuccess, query.data, setUser, token]);

    return query;
};
