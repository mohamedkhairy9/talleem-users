import { create } from 'zustand';
import { cookieService } from '@/utils/cookies';
import { AuthState, User } from '@/globals/types';

export const useAuthStore = create<AuthState>((set, get) => {
    // Initialize from cookies on store creation
    const initializeFromCookies = () => {
        const token = cookieService.getToken();
        const userData = cookieService.getUserData();
        
        if (token && userData) {
            // Reconstruct minimal user object from cookie data
            const user: User = {
                id: userData.id || 0,
                roles: userData.roles || [],
                permissions: userData.permissions || []
            };
            return { user, isAuthenticated: true };
        }
        return { user: null, isAuthenticated: false };
    };

    const initialState = initializeFromCookies();

    return {
        // State
        user: initialState.user,
        isAuthenticated: initialState.isAuthenticated,
        isLoading: false,

        // Actions
        setUser: (user: User | null, token?: string) => {
            if (token) {
                cookieService.setToken(token);
            }
            
            // Store user data in cookie (compact format)
            if (user) {
                cookieService.setUserData({
                    id: user.id,
                    roles: user.roles || [],
                    permissions: user.permissions || []
                });
            } else {
                cookieService.setUserData(null);
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
        cookieService.removeUserData();
        set({
            user: null,
            isAuthenticated: false
        });
    },

    updateUser: (updatedFields: Partial<User>) => {
        const { user } = get();
        if (user) {
            const updatedUser = { ...user, ...updatedFields };
            set({ user: updatedUser });
            
            // Update cookie with new user data
            cookieService.setUserData({
                id: updatedUser.id,
                roles: updatedUser.roles || [],
                permissions: updatedUser.permissions || []
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

    // Initialize auth from token and user data in cookies
    initializeAuth: () => {
        const { user: currentUser, isAuthenticated } = get();
        
        // If already initialized, don't re-initialize
        if (currentUser && isAuthenticated) {
            return cookieService.getToken() || null;
        }
        
        const token = cookieService.getToken();
        const userData = cookieService.getUserData();
        
        if (token && userData) {
            // Reconstruct user object from cookie data
            const user: User = {
                id: userData.id || 0,
                roles: userData.roles || [],
                permissions: userData.permissions || []
            };
            
            set({
                user,
                isAuthenticated: true
            });
            return token;
        }
        
        return null;
    }
    };
});
