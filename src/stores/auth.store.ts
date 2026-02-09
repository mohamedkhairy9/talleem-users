import { create } from 'zustand';
import { cookieService } from '@/utils/cookies';
import { AuthState, User } from '@/globals/types';
import type { CompactEntity } from '@/utils/cookies';

function compactEntityToEntity(compact: CompactEntity | undefined): User['entity'] {
    if (!compact) return undefined;
    return {
        id: compact.id ?? 0,
        ...(compact.memorization_program_entity_type_id != null && {
            memorization_program_entity_type: { id: compact.memorization_program_entity_type_id }
        }),
        ...(compact.session_mode_id != null && { session_mode: { id: compact.session_mode_id } }),
        ...(compact.main_program_id != null && { main_program: { id: compact.main_program_id } }),
        ...(compact.branch_id != null && { branch: { id: compact.branch_id } }),
        ...(compact.program_id != null && { program: { id: compact.program_id } })
    };
}

export const useAuthStore = create<AuthState>((set, get) => {
    // Initialize from cookies on store creation
    const initializeFromCookies = () => {
        const token = cookieService.getToken();
        const userData = cookieService.getUserData();
        
        if (token && userData) {
            const user: User = {
                id: userData.id || 0,
                roles: userData.roles || [],
                permissions: userData.permissions || [],
                entity: compactEntityToEntity(userData.entity)
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
            
            // Store user data in cookie (compact: id, roles, permissions, entity ids)
            if (user) {
                cookieService.setUserData(user);
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
            
            cookieService.setUserData(updatedUser);
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
            const user: User = {
                id: userData.id || 0,
                roles: userData.roles || [],
                permissions: userData.permissions || [],
                entity: compactEntityToEntity(userData.entity)
            };
            set({ user, isAuthenticated: true });
            return token;
        }
        
        return null;
    }
    };
});
