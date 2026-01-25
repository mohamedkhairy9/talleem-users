import { MenuItem } from '@/globals/types';
import { ROUTE_PATHS } from './routes.config';

/**
 * Menu Configuration
 * Centralized menu items configuration
 * Menu items are dynamic based on user roles and permissions
 */
export const MENU_ITEMS: MenuItem[] = [
    {
        path: ROUTE_PATHS.DASHBOARD,
        labelKey: 'menu.home',
        roles: ['admin', 'teacher', 'entity_manager']
    },
    {
        path: ROUTE_PATHS.STUDY_PLAN,
        labelKey: 'menu.studyPlan',
        roles: ['teacher']
    },
    {
        path: ROUTE_PATHS.ABSENCES,
        labelKey: 'menu.absences',
        roles: ['teacher']
    },
    {
        path: ROUTE_PATHS.GRADES,
        labelKey: 'menu.grades',
        roles: ['teacher']
    },
    {
        path: ROUTE_PATHS.CERTIFICATES,
        labelKey: 'menu.certificates',
        roles: ['teacher']
    },
    {
        path: ROUTE_PATHS.WARNINGS,
        labelKey: 'menu.warnings',
        roles: ['teacher']
    },
    {
        path: ROUTE_PATHS.TRANSFERS,
        labelKey: 'menu.transfers',
        roles: ['teacher']
    },
    {
        path: ROUTE_PATHS.EVALUATIONS,
        labelKey: 'menu.evaluations',
        roles: ['teacher']
    },
    {
        path: ROUTE_PATHS.DIARY,
        labelKey: 'menu.diary',
        roles: ['teacher']
    },
    {
        path: ROUTE_PATHS.SETTINGS,
        labelKey: 'menu.settings',
        roles: ['admin', 'teacher', 'entity_manager']
    },
    // Admin/Management menu items
    {
        path: ROUTE_PATHS.TEACHERS,
        labelKey: 'menu.teachers',
        roles: ['admin', 'entity_manager']
    },
    {
        path: ROUTE_PATHS.ENTITY_MANAGERS,
        labelKey: 'menu.entityManagers',
        roles: ['admin']
    },
    {
        path: ROUTE_PATHS.HALAQAS,
        labelKey: 'menu.halaqas',
        roles: ['entity_manager']
    },
    {
        path: ROUTE_PATHS.CREATE_HALAQA,
        labelKey: 'menu.createHalaqa',
        roles: ['entity_manager']
    }
];
