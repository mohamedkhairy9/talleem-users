/**
 * Routes Configuration
 * Centralized route paths and route metadata
 * Note: Paths without language prefix are used for route definitions
 * Language prefix is added automatically in routing
 */

export const ROUTE_PATHS = {
    LOGIN: 'login',
    REGISTER: 'register',
    DASHBOARD: '',
    TEACHERS: 'teachers',
    ENTITY_MANAGERS: 'entity-managers',
    UNAUTHORIZED: 'unauthorized',
    HALAQAS: 'halaqas',
    CREATE_HALAQA: 'create-halaqa',
    HALAQA_DETAIL: 'halaqas/:id',
    EDIT_HALAQA: 'halaqas/:id/edit',
    WARNINGS_MANAGEMENT: 'warnings-management',
    // Teacher menu items
    TEACHER_HALAQAS: 'halaqaty',
    TEACHER_HALAQA_DETAIL: 'halaqaty/:id',
    SETTINGS: 'settings'
} as const;

export const ROUTE_LABELS = {
    DASHBOARD: 'Dashboard',
    TEACHERS: 'Teachers',
    ENTITY_MANAGERS: 'Entity Managers',
    STUDY_PLAN: 'My Study Plan',
    ABSENCES: 'My Absences',
    GRADES: 'My Grades',
    CERTIFICATES: 'My Certificates',
    WARNINGS: 'My Warnings',
    TRANSFERS: 'My Transfers',
    EVALUATIONS: 'My Evaluations',
    DIARY: 'My Diary',
    SETTINGS: 'Settings'
} as const;
