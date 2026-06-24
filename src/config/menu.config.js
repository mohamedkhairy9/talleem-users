import { ROUTE_PATHS } from './routes.config';
/**
 * Menu Configuration
 * Centralized menu items configuration
 * Menu items are dynamic based on user roles, permissions, and main_program
 */
/**
 * Memorization Program Menu (main_program.id === 2)
 * For entity managers with memorization program
 */
export const MEMORIZATION_MENU_ITEMS = [
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
    },
    {
        path: ROUTE_PATHS.WARNINGS_MANAGEMENT,
        labelKey: 'menu.warningsManagement',
        icon: 'AlertTriangleIcon',
        roles: ['admin', 'entity_manager']
    },
    {
        path: ROUTE_PATHS.ENTITY_LICENSES,
        labelKey: 'menu.licenses',
        icon: 'BookOpenIcon',
        roles: ['entity_manager']
    },
    {
        path: ROUTE_PATHS.JOIN_REQUESTS,
        labelKey: 'menu.joinRequests',
        icon: 'UsersIcon',
        roles: ['entity_manager']
    },
    {
        path: ROUTE_PATHS.SCHEDULED_EXAMS_CREATE,
        labelKey: 'menu.scheduledExams',
        icon: 'CalendarIcon',
        roles: ['entity_manager']
    }
];
/**
 * Education Program Menu (for other main_program types)
 * Add menu items for education program here
 */
export const EDUCATION_MENU_ITEMS = [
    // Add education program menu items here
    // Example:
    // {
    //     path: ROUTE_PATHS.EDUCATION_CLASSES,
    //     labelKey: 'menu.educationClasses',
    //     icon: 'BookIcon',
    //     roles: ['entity_manager']
    // }
];
/**
 * Teacher Menu Items
 * For users with teacher role
 */
export const TEACHER_MENU_ITEMS = [
    {
        path: ROUTE_PATHS.TEACHER_CALENDAR,
        labelKey: 'menu.calendar',
        icon: 'CalendarIcon',
        roles: ['teacher']
    },
    {
        path: ROUTE_PATHS.TEACHER_HALAQAS,
        labelKey: 'menu.halaqaty',
        icon: 'CircleIcon',
        roles: ['teacher']
    },
    {
        path: ROUTE_PATHS.TEACHER_REQUESTS,
        labelKey: 'menu.teacherRequests',
        icon: 'ClipboardCheckIcon',
        roles: ['teacher']
    },
    {
        path: ROUTE_PATHS.TEACHER_WARNINGS,
        labelKey: 'menu.warnings',
        icon: 'AlertTriangleIcon',
        roles: ['teacher']
    },
    {
        path: ROUTE_PATHS.TEACHER_LEAVES,
        labelKey: 'menu.leaves',
        icon: 'CalendarIcon',
        roles: ['teacher']
    },
    // {
    //     path: ROUTE_PATHS.TEACHER_CERTIFICATES,
    //     labelKey: 'menu.certificates',
    //     icon: 'AwardIcon',
    //     roles: ['teacher']
    // },
    {
        path: ROUTE_PATHS.TEACHER_LICENSES,
        labelKey: 'menu.licenses',
        icon: 'BookOpenIcon',
        roles: ['teacher']
    },
    {
        path: ROUTE_PATHS.TEACHER_EVALUATIONS_RECEIVED,
        labelKey: 'menu.myEvaluations',
        icon: 'StarIcon',
        roles: ['teacher'],
        subItems: [
            {
                path: ROUTE_PATHS.TEACHER_EVALUATIONS_RECEIVED,
                labelKey: 'menu.receivedEvaluations',
                icon: 'StarIcon'
            },
            {
                path: ROUTE_PATHS.TEACHER_EVALUATIONS_GIVEN,
                labelKey: 'menu.givenEvaluations',
                icon: 'StarIcon'
            }
        ]
    },
    {
        path: ROUTE_PATHS.TEACHER_PROFILE,
        labelKey: 'menu.profile',
        icon: 'UserIcon',
        roles: ['teacher']
    }
];
const hasEntityManagerAccess = (userRoles = []) => userRoles.includes('entity_manager') || userRoles.includes('admin');
/**
 * Get menu items based on user's main_program and roles
 */
export const getMenuItems = (mainProgramId, userRoles) => {
    const menuItems = [];
    const canSeeEntityManagerMenu = hasEntityManagerAccess(userRoles || []);
    // Add program-specific menu items
    if (canSeeEntityManagerMenu && (mainProgramId === 2 || mainProgramId == null)) {
        // Memorization program
        menuItems.push(...MEMORIZATION_MENU_ITEMS);
    }
    else if (canSeeEntityManagerMenu && mainProgramId !== undefined && mainProgramId !== 2) {
        // Other programs (education, etc.)
        menuItems.push(...(EDUCATION_MENU_ITEMS.length > 0 ? EDUCATION_MENU_ITEMS : MEMORIZATION_MENU_ITEMS));
    }
    // Add teacher menu items if user has teacher role
    if (userRoles?.includes('teacher')) {
        menuItems.push(...TEACHER_MENU_ITEMS);
    }
    return menuItems;
};
/**
 * Default menu items (for backward compatibility)
 * @deprecated Use getMenuItems instead
 */
export const MENU_ITEMS = MEMORIZATION_MENU_ITEMS;
