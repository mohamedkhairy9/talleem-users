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
    CREATE_HALAQA: 'create-halaqa',
    // Teacher menu items
    STUDY_PLAN: 'study-plan',
    ABSENCES: 'absences',
    GRADES: 'grades',
    CERTIFICATES: 'certificates',
    WARNINGS: 'warnings',
    TRANSFERS: 'transfers',
    EVALUATIONS: 'evaluations',
    DIARY: 'diary',
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
