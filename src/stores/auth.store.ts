import { create } from 'zustand';
import { cookieService } from '@/utils/cookies';
import { AuthState, User } from '@/globals/types';

export const useAuthStore = create<AuthState>((set, get) => ({
    // State
    user: null,
    isAuthenticated: false,
    isLoading: false,

    // Actions
    setUser: (user: User | null, token?: string) => {
        if (token) {
            cookieService.setToken(token);
        }
        set({
            user,
            isAuthenticated: !!token && !!user
        });
    },

    setLoading: (isLoading: boolean) => {
        set({ isLoading });
    },

    logout: () => {
        cookieService.removeToken();
        set({
            user: null,
            isAuthenticated: false
        });
    },

    updateUser: (updatedFields: Partial<User>) => {
        const { user } = get();
        if (user) {
            set({
                user: { ...user, ...updatedFields }
            });
        }
    },

    // Check if user has specific role
    hasRole: (role: string) => {
        const { user } = get();
        return user?.roles?.includes(role) || false;
    },

    // Check if user has any of the specified roles
    hasAnyRole: (roles: string[]) => {
        const { user } = get();
        if (!user?.roles) return false;
        return roles.some(role => user.roles?.includes(role));
    },

    // Check if user has specific permission
    hasPermission: (permission: string) => {
        const { user } = get();
        return user?.permissions?.includes(permission) || false;
    },

    // Check if user has any of the specified permissions
    hasAnyPermission: (permissions: string[]) => {
        const { user } = get();
        if (!user?.permissions) return false;
        return permissions.some(permission => user.permissions?.includes(permission));
    },

    // Initialize auth from token in cookies
    initializeAuth: () => {
        const token = cookieService.getToken();
        if (token) {
            set({ isAuthenticated: true });
            return token;
        }
        return null;
    }
}));
