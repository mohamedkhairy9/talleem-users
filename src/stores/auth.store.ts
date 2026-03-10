import { create } from 'zustand';
import { cookieService } from '@/utils/cookies';
import { customerStorage } from '@/utils/customerStorage';
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
    // Initialize from cookies + localStorage (full user/teacher from login)
    const initializeFromStorage = () => {
        const token = cookieService.getToken();
        if (!token) return { user: null, teacher: null, isAuthenticated: false };

        const stored = customerStorage.get();
        if (stored?.user) {
            return {
                user: stored.user as User,
                teacher: stored.teacher ?? null,
                isAuthenticated: true
            };
        }

        const userData = cookieService.getUserData();
        if (userData) {
            const user: User = {
                id: userData.id || 0,
                roles: userData.roles || [],
                permissions: userData.permissions || [],
                entity: compactEntityToEntity(userData.entity)
            };
            return { user, teacher: null, isAuthenticated: true };
        }
        return { user: null, teacher: null, isAuthenticated: false };
    };

    const initialState = initializeFromStorage();

    return {
        // State
        user: initialState.user,
        teacher: initialState.teacher ?? null,
        isAuthenticated: initialState.isAuthenticated,
        isLoading: false,

        // Actions
        setUser: (user: User | null, token?: string) => {
            if (token) {
                cookieService.setToken(token);
            }
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

        setLoginData: (user: User, teacher: AuthState['teacher'], token: string) => {
            cookieService.setToken(token);
            cookieService.setUserData(user);
            customerStorage.set({
                user: user as unknown as Record<string, unknown>,
                teacher: teacher as Record<string, unknown> | null
            });
            set({
                user,
                teacher: teacher ?? null,
                isAuthenticated: true
            });
        },

    setLoading: (isLoading: boolean) => {
        set({ isLoading });
    },

    logout: () => {
        cookieService.removeToken();
        cookieService.removeUserData();
        customerStorage.remove();
        set({
            user: null,
            teacher: null,
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

    // Initialize auth from token and stored data (localStorage then cookie)
    initializeAuth: () => {
        const { user: currentUser, isAuthenticated } = get();
        if (currentUser && isAuthenticated) {
            return cookieService.getToken() || null;
        }
        const token = cookieService.getToken();
        if (!token) return null;
        const stored = customerStorage.get();
        if (stored?.user) {
            set({
                user: stored.user as User,
                teacher: stored.teacher ?? null,
                isAuthenticated: true
            });
            return token;
        }
        const userData = cookieService.getUserData();
        if (userData) {
            const user: User = {
                id: userData.id || 0,
                roles: userData.roles || [],
                permissions: userData.permissions || [],
                entity: compactEntityToEntity(userData.entity)
            };
            set({ user, teacher: null, isAuthenticated: true });
            return token;
        }
        return null;
    }
    };
});
