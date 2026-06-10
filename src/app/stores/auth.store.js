import { create } from 'zustand';
import { cookieService } from '@/shared/utils/cookies';
import { customerStorage } from '@/shared/utils/customerStorage';
function extractRoleValue(roleLike) {
    if (Array.isArray(roleLike)) {
        return extractRoleValue(roleLike[0]);
    }
    if (typeof roleLike === 'string') {
        return roleLike;
    }
    if (roleLike && typeof roleLike === 'object') {
        return roleLike.name ?? roleLike.slug ?? roleLike.code ?? roleLike.role ?? roleLike.type ?? null;
    }
    return null;
}
function getPrimaryEntity(user) {
    if (Array.isArray(user?.entities)) {
        return user.entities[0] ?? null;
    }
    if (user?.entities && typeof user.entities === 'object') {
        return user.entities;
    }
    if (user?.entity && typeof user.entity === 'object') {
        return user.entity;
    }
    return null;
}
function normalizeEntity(entity) {
    if (!entity || typeof entity !== 'object') {
        return entity ?? null;
    }
    return {
        ...entity,
        ...(entity.memorization_program_entity_type || entity.memorization_program_entity_type_id == null
            ? {}
            : { memorization_program_entity_type: { id: entity.memorization_program_entity_type_id } }),
        ...(entity.education_program_entity_type || entity.education_program_entity_type_id == null
            ? {}
            : { education_program_entity_type: { id: entity.education_program_entity_type_id } }),
        ...(entity.session_mode || entity.session_mode_id == null ? {} : { session_mode: { id: entity.session_mode_id } }),
        ...(entity.main_program || entity.main_program_id == null ? {} : { main_program: { id: entity.main_program_id } }),
        ...(entity.branch || entity.branch_id == null ? {} : { branch: { id: entity.branch_id } }),
        ...(entity.program || entity.program_id == null ? {} : { program: { id: entity.program_id } })
    };
}
function normalizeUserForStore(user) {
    if (!user || typeof user !== 'object') {
        return null;
    }
    const primaryEntity = getPrimaryEntity(user);
    const normalizedEntity = normalizeEntity(primaryEntity ?? user.entity);
    if (normalizedEntity && !user.entity) {
        return {
            ...user,
            entity: normalizedEntity
        };
    }
    if (normalizedEntity && user.entity !== normalizedEntity) {
        return {
            ...user,
            entity: normalizedEntity
        };
    }
    return user;
}
function deriveActingContext(user, fallback = {}) {
    const normalizedUser = normalizeUserForStore(user);
    const primaryEntity = getPrimaryEntity(normalizedUser);
    return {
        actingRole: fallback.actingRole ?? extractRoleValue(primaryEntity?.roles ?? primaryEntity?.role) ?? null,
        actingEntityId: fallback.actingEntityId ?? primaryEntity?.id ?? normalizedUser?.entity?.id ?? null
    };
}
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
    const persistAuthState = ({ user, teacher, actingRole, actingEntityId }, token, options = {}) => {
        const normalizedUser = normalizeUserForStore(user);
        const context = deriveActingContext(normalizedUser, { actingRole, actingEntityId });
        if (token) {
            cookieService.setToken(token);
        }
        else if (normalizedUser) {
            cookieService.setSessionActive();
        }
        if (options.clear) {
            cookieService.setUserData(null);
            cookieService.removeSession();
            customerStorage.remove();
            return { normalizedUser: null, actingRole: null, actingEntityId: null };
        }
        if (normalizedUser) {
            cookieService.setUserData(normalizedUser, context);
            customerStorage.set({
                user: normalizedUser,
                teacher: teacher ?? null,
                actingRole: context.actingRole,
                actingEntityId: context.actingEntityId
            });
        }
        else {
            cookieService.setUserData(null);
            cookieService.removeSession();
            customerStorage.remove();
        }
        return {
            normalizedUser,
            actingRole: context.actingRole,
            actingEntityId: context.actingEntityId
        };
    };
    // Initialize from cookies + localStorage (full user/teacher from login)
    const initializeFromStorage = () => {
        const hasSession = cookieService.hasSession();
        if (!hasSession) {
            return { user: null, teacher: null, isAuthenticated: false, actingRole: null, actingEntityId: null };
        }
        const stored = customerStorage.get();
        if (stored?.user) {
            const normalizedUser = normalizeUserForStore(stored.user);
            const context = deriveActingContext(normalizedUser, {
                actingRole: stored.actingRole,
                actingEntityId: stored.actingEntityId
            });
            return {
                user: normalizedUser,
                teacher: stored.teacher ?? null,
                isAuthenticated: true,
                actingRole: context.actingRole,
                actingEntityId: context.actingEntityId
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
            const context = deriveActingContext(user, {
                actingRole: userData.acting_role,
                actingEntityId: userData.acting_entity_id
            });
            return {
                user,
                teacher: null,
                isAuthenticated: true,
                actingRole: context.actingRole,
                actingEntityId: context.actingEntityId
            };
        }
        return { user: null, teacher: null, isAuthenticated: false, actingRole: null, actingEntityId: null };
    };
    const initialState = initializeFromStorage();
    return {
        // State
        user: initialState.user,
        teacher: initialState.teacher ?? null,
        isAuthenticated: initialState.isAuthenticated,
        isLoading: false,
        actingRole: initialState.actingRole ?? null,
        actingEntityId: initialState.actingEntityId ?? null,
        // Actions
        setUser: (user, token) => {
            const currentTeacher = get().teacher;
            const persisted = persistAuthState({
                user,
                teacher: currentTeacher,
                actingRole: get().actingRole,
                actingEntityId: get().actingEntityId
            }, token, { clear: !user });
            set({
                user: persisted.normalizedUser,
                actingRole: persisted.actingRole,
                actingEntityId: persisted.actingEntityId,
                isAuthenticated: !!persisted.normalizedUser && (!!token || cookieService.hasSession())
            });
        },
        setLoginData: (user, teacher, token) => {
            const persisted = persistAuthState({ user, teacher }, token);
            set({
                user: persisted.normalizedUser,
                teacher: teacher ?? null,
                isAuthenticated: true,
                actingRole: persisted.actingRole,
                actingEntityId: persisted.actingEntityId
            });
        },
        setActingContext: ({ actingRole, actingEntityId }) => {
            const { user, teacher } = get();
            const persisted = persistAuthState({
                user,
                teacher,
                actingRole,
                actingEntityId
            }, null, { clear: !user });
            set({
                actingRole: persisted.actingRole,
                actingEntityId: persisted.actingEntityId
            });
        },
        setLoading: (isLoading) => {
            set({ isLoading });
        },
        logout: () => {
            cookieService.removeToken();
            persistAuthState({ user: null, teacher: null }, null, { clear: true });
            set({
                user: null,
                teacher: null,
                isAuthenticated: false,
                actingRole: null,
                actingEntityId: null
            });
        },
        updateUser: (updatedFields) => {
            const { user, teacher, actingRole, actingEntityId } = get();
            if (user) {
                const updatedUser = { ...user, ...updatedFields };
                const persisted = persistAuthState({
                    user: updatedUser,
                    teacher,
                    actingRole,
                    actingEntityId
                });
                set({
                    user: persisted.normalizedUser,
                    actingRole: persisted.actingRole,
                    actingEntityId: persisted.actingEntityId
                });
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
            if (!cookieService.hasSession()) {
                return null;
            }
            const stored = customerStorage.get();
            if (stored?.user) {
                const normalizedUser = normalizeUserForStore(stored.user);
                const context = deriveActingContext(normalizedUser, {
                    actingRole: stored.actingRole,
                    actingEntityId: stored.actingEntityId
                });
                set({
                    user: normalizedUser,
                    teacher: stored.teacher ?? null,
                    isAuthenticated: true,
                    actingRole: context.actingRole,
                    actingEntityId: context.actingEntityId
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
                const context = deriveActingContext(user, {
                    actingRole: userData.acting_role,
                    actingEntityId: userData.acting_entity_id
                });
                set({
                    user,
                    teacher: null,
                    isAuthenticated: true,
                    actingRole: context.actingRole,
                    actingEntityId: context.actingEntityId
                });
                return token || '__session__';
            }
            return null;
        }
    };
});
