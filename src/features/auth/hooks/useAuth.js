import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { authService } from '../services/auth.service';
import { useAuthStore } from '@/stores';
import { cookieService } from '@/utils/cookies';
/**
 * Normalize role names from API to match app's expected format
 * Converts "entity manager" -> "entity_manager", etc.
 */
const normalizeRoles = (roles) => {
    return roles
        .map(role => {
        const roleValue = typeof role === 'string'
            ? role
            : role?.name ?? role?.slug ?? role?.code ?? role?.role ?? role?.type ?? '';
        if (!roleValue) {
            return null;
        }
        // Normalize role names: replace spaces with underscores and convert to lowercase
        const normalized = roleValue.toLowerCase().replace(/\s+/g, '_');
        // Map common variations
        const roleMapping = {
            'entity_manager': 'entity_manager',
            'entitymanager': 'entity_manager',
            'teacher': 'teacher',
            'admin': 'admin'
        };
        return roleMapping[normalized] || normalized;
    })
        .filter(Boolean);
};
const USER_FIELD_KEYS = ['user', 'customer', 'account', 'front_user', 'current_user'];
const TEACHER_FIELD_KEYS = ['teacher', 'teacher_profile', 'current_teacher'];
const TOKEN_FIELD_KEYS = ['front_access_token', 'access_token', 'accessToken', 'token', 'auth_token', 'bearer_token'];
const isRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const pickFirst = (sources, keys) => {
    for (const source of sources) {
        if (!isRecord(source)) {
            continue;
        }
        for (const key of keys) {
            if (source[key] != null && source[key] !== '') {
                return source[key];
            }
        }
    }
    return undefined;
};
const buildCandidateSources = (response) => {
    const body = response?.data ?? response ?? {};
    const nestedData = body?.data;
    const nestedPayload = body?.payload;
    const nestedResult = body?.result;
    return [body, nestedData, nestedPayload, nestedResult, nestedData?.data, nestedPayload?.data, response?.headers].filter(Boolean);
};
const readHeader = (headers, name) => {
    if (!headers) {
        return undefined;
    }
    if (typeof headers.get === 'function') {
        return headers.get(name);
    }
    return headers[name] ?? headers[name.toLowerCase()] ?? headers[name.toUpperCase()];
};
const extractTokenFromHeaders = (headers) => {
    const authorization = readHeader(headers, 'authorization') || readHeader(headers, 'Authorization');
    if (typeof authorization === 'string' && authorization.toLowerCase().startsWith('bearer ')) {
        return authorization.slice(7).trim();
    }
    return (readHeader(headers, 'x-access-token') ||
        readHeader(headers, 'access-token') ||
        readHeader(headers, 'x-auth-token') ||
        readHeader(headers, 'auth-token'));
};
const findValueDeep = (value, matcher, depth = 0) => {
    if (depth > 4 || !isRecord(value)) {
        return undefined;
    }
    for (const [key, nestedValue] of Object.entries(value)) {
        if (matcher(key, nestedValue)) {
            return nestedValue;
        }
        const nestedResult = findValueDeep(nestedValue, matcher, depth + 1);
        if (nestedResult !== undefined) {
            return nestedResult;
        }
    }
    return undefined;
};
const getPrimaryEntity = (user) => {
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
};
const normalizeEntity = (entity) => {
    if (!isRecord(entity)) {
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
};
const normalizeUser = (rawUser) => {
    if (!isRecord(rawUser)) {
        return null;
    }
    let user = { ...rawUser };
    const primaryEntity = getPrimaryEntity(user);
    const normalizedEntity = normalizeEntity(primaryEntity ?? user.entity);
    if (normalizedEntity) {
        user.entity = normalizedEntity;
    }
    const entityRoles = normalizedEntity?.roles ?? normalizedEntity?.role ?? primaryEntity?.roles ?? primaryEntity?.role;
    const roleSource = Array.isArray(user.roles) && user.roles.length > 0
        ? user.roles
        : Array.isArray(entityRoles)
            ? entityRoles
            : entityRoles
                ? [entityRoles]
                : [];
    user.roles = normalizeRoles(roleSource);
    if (!Array.isArray(user.permissions))
        user.permissions = user.permissions ?? [];
    return user;
};
const extractAuthPayload = (response) => {
    const sources = buildCandidateSources(response);
    const token = pickFirst(sources, TOKEN_FIELD_KEYS) ??
        extractTokenFromHeaders(response?.headers) ??
        findValueDeep(response?.data ?? response, (key, value) => TOKEN_FIELD_KEYS.includes(key) && typeof value === 'string');
    const userCandidate = pickFirst(sources, USER_FIELD_KEYS);
    const teacher = pickFirst(sources, TEACHER_FIELD_KEYS) ?? null;
    const fallbackUser = userCandidate ??
        findValueDeep(response?.data ?? response, (key, value) => USER_FIELD_KEYS.includes(key) && isRecord(value)) ??
        sources.find(source => isRecord(source) && (source.id != null || source.email || source.roles || source.role || source.user_type || source.entities));
    const user = normalizeUser(userCandidate) ?? normalizeUser(fallbackUser);
    return { token, user, teacher };
};
/**
 * Login mutation hook
 */
export const useLoginMutation = () => {
    const setLoginData = useAuthStore(state => state.setLoginData);
    const setUser = useAuthStore(state => state.setUser);
    const setLoading = useAuthStore(state => state.setLoading);
    return useMutation({
        mutationFn: (credentials) => authService.login(credentials),
        onSuccess: async (response) => {
            let { token, user, teacher } = extractAuthPayload(response);
            let sessionVerified = false;
            if (!token || !user) {
                try {
                    const currentUserResponse = await authService.getUser();
                    const extracted = extractAuthPayload(currentUserResponse);
                    user = extracted.user ?? user;
                    teacher = extracted.teacher ?? teacher;
                    token = token ?? extracted.token;
                    sessionVerified = !!extracted.user;
                }
                catch {
                    // Leave verification to route/API guards if follow-up fetch fails.
                }
            }
            if (user && (token || sessionVerified)) {
                setLoginData(user, teacher, token);
            }
            else {
                setUser(null, token);
            }
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
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    const token = cookieService.getToken();
    const hasSession = cookieService.hasSession();
    const query = useQuery({
        queryKey: ['user', 'current'],
        queryFn: () => authService.getUser(),
        enabled: hasSession || isAuthenticated,
        retry: false,
        staleTime: Infinity // User data doesn't change often
    });
    // Handle success with useEffect (React Query v5+ removed onSuccess)
    useEffect(() => {
        if (query.isSuccess && query.data) {
            const { user } = extractAuthPayload(query.data);
            if (user) {
                setUser(user, token || undefined);
            }
        }
    }, [hasSession, isAuthenticated, query.isSuccess, query.data, setUser, token]);
    return query;
};
/**
 * Change password mutation hook
 */
export const useChangePasswordMutation = () => {
    return useMutation({
        mutationFn: (payload) => authService.changePassword(payload),
    });
};
