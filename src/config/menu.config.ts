import { MenuItem } from '@/globals/types';
import { ROUTE_PATHS } from './routes.config';

/**
 * Menu Configuration
 * Centralized menu items configuration
 * Menu items are dynamic based on user roles and permissions
 * Users can have multiple roles (e.g., teacher and student)
 */
export const MENU_ITEMS: MenuItem[] = [
    {
        path: ROUTE_PATHS.DASHBOARD,
        labelKey: 'menu.home',
        roles: ['admin', 'teacher', 'entity_manager', 'student']
    },
    {
        path: ROUTE_PATHS.STUDY_PLAN,
        labelKey: 'menu.studyPlan',
        roles: ['student', 'teacher'] // Teachers can view student study plans
    },
    {
        path: ROUTE_PATHS.ABSENCES,
        labelKey: 'menu.absences',
        roles: ['student', 'teacher'] // Teachers track their own absences too
    },
    {
        path: ROUTE_PATHS.GRADES,
        labelKey: 'menu.grades',
        roles: ['student', 'teacher']
    },
    {
        path: ROUTE_PATHS.CERTIFICATES,
        labelKey: 'menu.certificates',
        roles: ['student', 'teacher']
    },
    {
        path: ROUTE_PATHS.WARNINGS,
        labelKey: 'menu.warnings',
        roles: ['student', 'teacher']
    },
    {
        path: ROUTE_PATHS.TRANSFERS,
        labelKey: 'menu.transfers',
        roles: ['student', 'teacher']
    },
    {
        path: ROUTE_PATHS.EVALUATIONS,
        labelKey: 'menu.evaluations',
        roles: ['student', 'teacher']
    },
    {
        path: ROUTE_PATHS.DIARY,
        labelKey: 'menu.diary',
        roles: ['student', 'teacher']
    },
    {
        path: ROUTE_PATHS.SETTINGS,
        labelKey: 'menu.settings',
        roles: ['admin', 'teacher', 'entity_manager', 'student']
    },
    // Admin/Management menu items
    {
        path: ROUTE_PATHS.STUDENTS,
        labelKey: 'menu.students',
        roles: ['admin', 'teacher', 'entity_manager']
    },
    {
        path: ROUTE_PATHS.TEACHERS,
        labelKey: 'menu.teachers',
        roles: ['admin', 'entity_manager']
    },
    {
        path: ROUTE_PATHS.ENTITY_MANAGERS,
        labelKey: 'menu.entityManagers',
        roles: ['admin']
    }
];
