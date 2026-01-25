import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { authService } from '../services/auth.service';
import { useAuthStore } from '@/stores';
import { cookieService } from '@/utils/cookies';

interface LoginCredentials {
    email: string;
    password: string;
}

/**
 * Map user_type to role
 */
const mapUserTypeToRole = (userType: string): string => {
    const mapping: Record<string, string> = {
        'entity': 'entity_manager',
        'teacher': 'teacher',
        'admin': 'admin'
    };
    return mapping[userType] || userType;
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
            // Handle new API response structure
            const responseData = response.data || response;
            const token = responseData.front_access_token || responseData.token;
            let user = responseData.user || responseData;
            
            // If user_type exists, map it to role and add to roles array
            if (user.user_type) {
                const mappedRole = mapUserTypeToRole(user.user_type);
                // Add mapped role to roles array if not already present
                if (!user.roles) {
                    user.roles = [];
                }
                if (!user.roles.includes(mappedRole)) {
                    user.roles.push(mappedRole);
                }
            }
            
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
    const logout = useAuthStore(state => state.logout);

    return useMutation({
        mutationFn: () => authService.logout(),
        onSuccess: () => {
            logout();
        },
        onError: () => {
            // Even if API call fails, logout locally
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
            
            // If user_type exists, map it to role and add to roles array
            if (user.user_type) {
                const mappedRole = mapUserTypeToRole(user.user_type);
                // Add mapped role to roles array if not already present
                if (!user.roles) {
                    user.roles = [];
                }
                if (!user.roles.includes(mappedRole)) {
                    user.roles.push(mappedRole);
                }
            }
            
            setUser(user, token || undefined);
        }
    }, [query.isSuccess, query.data, setUser, token]);

    return query;
};
