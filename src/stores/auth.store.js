import { create } from 'zustand';
import { cookieService } from '@/utils/cookies';
import { customerStorage } from '@/utils/customerStorage';
function compactEntityToEntity(compact) {
    if (!compact)
        return undefined;
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
export const useAuthStore = create((set, get) => {
    // Initialize from cookies + localStorage (full user/teacher from login)
    const initializeFromStorage = () => {
        const hasSession = cookieService.hasSession();
        if (!hasSession)
            return { user: null, teacher: null, isAuthenticated: false };
        const stored = customerStorage.get();
        if (stored?.user) {
            return {
                user: stored.user,
                teacher: stored.teacher ?? null,
                isAuthenticated: true
            };
        }
        const userData = cookieService.getUserData();
        if (userData) {
            const user = {
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
        setUser: (user, token) => {
            if (token) {
                cookieService.setToken(token);
            }
            else if (user) {
                cookieService.setSessionActive();
            }
            if (user) {
                cookieService.setUserData(user);
            }
            else {
                cookieService.setUserData(null);
            }
            set({
                user,
                isAuthenticated: !!user && (!!token || cookieService.hasSession())
            });
        },
        setLoginData: (user, teacher, token) => {
            if (token) {
                cookieService.setToken(token);
            }
            else {
                cookieService.setSessionActive();
            }
            cookieService.setUserData(user);
            customerStorage.set({
                user: user,
                teacher: teacher
            });
            set({
                user,
                teacher: teacher ?? null,
                isAuthenticated: true
            });
        },
        setLoading: (isLoading) => {
            set({ isLoading });
        },
        logout: () => {
            cookieService.removeToken();
            cookieService.removeSession();
            cookieService.removeUserData();
            customerStorage.remove();
            set({
                user: null,
                teacher: null,
                isAuthenticated: false
            });
        },
        updateUser: (updatedFields) => {
            const { user } = get();
            if (user) {
                const updatedUser = { ...user, ...updatedFields };
                set({ user: updatedUser });
                cookieService.setUserData(updatedUser);
            }
        },
        // Check if user has specific role
        hasRole: (role) => {
            const { user } = get();
            return user?.roles?.includes(role) || false;
        },
        // Check if user has any of the specified roles
        hasAnyRole: (roles) => {
            const { user } = get();
            if (!user?.roles)
                return false;
            return roles.some(role => user.roles?.includes(role));
        },
        // Check if user has specific permission
        hasPermission: (permission) => {
            const { user } = get();
            return user?.permissions?.includes(permission) || false;
        },
        // Check if user has any of the specified permissions
        hasAnyPermission: (permissions) => {
            const { user } = get();
            if (!user?.permissions)
                return false;
            return permissions.some(permission => user.permissions?.includes(permission));
        },
        // Initialize auth from token and stored data (localStorage then cookie)
        initializeAuth: () => {
            const { user: currentUser, isAuthenticated } = get();
            if (currentUser && isAuthenticated) {
                return cookieService.getToken() || (cookieService.hasSession() ? '__session__' : null);
            }
            const token = cookieService.getToken();
            if (!cookieService.hasSession())
                return null;
            const stored = customerStorage.get();
            if (stored?.user) {
                set({
                    user: stored.user,
                    teacher: stored.teacher ?? null,
                    isAuthenticated: true
                });
                return token || '__session__';
            }
            const userData = cookieService.getUserData();
            if (userData) {
                const user = {
                    id: userData.id || 0,
                    roles: userData.roles || [],
                    permissions: userData.permissions || [],
                    entity: compactEntityToEntity(userData.entity)
                };
                set({ user, teacher: null, isAuthenticated: true });
                return token || '__session__';
            }
            return null;
        }
    };
});
