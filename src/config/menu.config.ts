import { MenuItem } from '@/globals/types';
import { ROUTE_PATHS, ROUTE_LABELS } from './routes.config';

/**
 * Menu Configuration
 * Centralized menu items configuration
 */
export const MENU_ITEMS: MenuItem[] = [
    {
        path: ROUTE_PATHS.DASHBOARD,
        label: ROUTE_LABELS.DASHBOARD,
        roles: ['admin', 'teacher', 'entity_manager', 'student']
    },
    {
        path: ROUTE_PATHS.STUDENTS,
        label: ROUTE_LABELS.STUDENTS,
        roles: ['admin', 'teacher', 'entity_manager']
    },
    {
        path: ROUTE_PATHS.TEACHERS,
        label: ROUTE_LABELS.TEACHERS,
        roles: ['admin', 'entity_manager']
    },
    {
        path: ROUTE_PATHS.ENTITY_MANAGERS,
        label: ROUTE_LABELS.ENTITY_MANAGERS,
        roles: ['admin']
    }
];
