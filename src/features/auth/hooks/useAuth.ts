import { useMutation, useQuery } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { useAuthStore } from '@/stores';
import { cookieService } from '@/utils/cookies';

interface LoginCredentials {
    email: string;
    password: string;
}

/**
 * Login mutation hook
 */
export const useLoginMutation = () => {
    const setUser = useAuthStore(state => state.setUser);
    const setLoading = useAuthStore(state => state.setLoading);

    return useMutation({
        mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
        onSuccess: (response: any) => {
            const { user, token } = response.data || response;
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

    return useQuery({
        queryKey: ['user', 'current'],
        queryFn: () => authService.getUser(),
        enabled: !!token, // Only run if token exists
        onSuccess: (response: any) => {
            const user = response.data || response;
            setUser(user, token || undefined);
        },
        retry: false,
        staleTime: Infinity // User data doesn't change often
    });
};
