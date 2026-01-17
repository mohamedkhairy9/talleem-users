/**
 * Routes Configuration
 * Centralized route paths and route metadata
 */

export const ROUTE_PATHS = {
    LOGIN: '/login',
    DASHBOARD: '/',
    STUDENTS: '/students',
    TEACHERS: '/teachers',
    ENTITY_MANAGERS: '/entity-managers',
    UNAUTHORIZED: '/unauthorized'
} as const;

export const ROUTE_LABELS = {
    DASHBOARD: 'Dashboard',
    STUDENTS: 'Students',
    TEACHERS: 'Teachers',
    ENTITY_MANAGERS: 'Entity Managers'
} as const;
