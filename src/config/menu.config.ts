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
        icon: 'HomeIcon',
        roles: ['admin', 'teacher', 'entity_manager']
    },
    {
        path: ROUTE_PATHS.STUDY_PLAN,
        labelKey: 'menu.studyPlan',
        icon: 'BookIcon',
        roles: ['teacher']
    },
    {
        path: ROUTE_PATHS.ABSENCES,
        labelKey: 'menu.absences',
        icon: 'CalendarIcon',
        roles: ['teacher']
    },
    {
        path: ROUTE_PATHS.GRADES,
        labelKey: 'menu.grades',
        icon: 'StarIcon',
        roles: ['teacher']
    },
    {
        path: ROUTE_PATHS.CERTIFICATES,
        labelKey: 'menu.certificates',
        icon: 'AwardIcon',
        roles: ['teacher']
    },
    {
        path: ROUTE_PATHS.WARNINGS,
        labelKey: 'menu.warnings',
        icon: 'AlertTriangleIcon',
        roles: ['teacher']
    },
    {
        path: ROUTE_PATHS.TRANSFERS,
        labelKey: 'menu.transfers',
        icon: 'ArrowRightLeftIcon',
        roles: ['teacher']
    },
    {
        path: ROUTE_PATHS.EVALUATIONS,
        labelKey: 'menu.evaluations',
        icon: 'ClipboardCheckIcon',
        roles: ['teacher']
    },
    {
        path: ROUTE_PATHS.DIARY,
        labelKey: 'menu.diary',
        icon: 'BookOpenIcon',
        roles: ['teacher']
    },
    {
        path: ROUTE_PATHS.SETTINGS,
        labelKey: 'menu.settings',
        icon: 'SettingsIcon',
        roles: ['admin', 'teacher', 'entity_manager']
    },
    // Admin/Management menu items
    {
        path: ROUTE_PATHS.TEACHERS,
        labelKey: 'menu.teachers',
        icon: 'TeacherIcon',
        roles: ['admin', 'entity_manager']
    },
    {
        path: ROUTE_PATHS.ENTITY_MANAGERS,
        labelKey: 'menu.entityManagers',
        icon: 'UsersIcon',
        roles: ['admin']
    },
    {
        path: ROUTE_PATHS.HALAQAS,
        labelKey: 'menu.halaqas',
        icon: 'CircleIcon',
        roles: ['entity_manager'],
        subItems: [
            {
                path: ROUTE_PATHS.HALAQAS,
                labelKey: 'menu.halaqas',
                icon: 'CircleIcon'
            },
            {
                path: ROUTE_PATHS.CREATE_HALAQA,
                labelKey: 'menu.createHalaqa',
                icon: 'PlusIcon'
            }
        ]
    }
];
