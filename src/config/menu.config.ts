import { MenuItem } from '@/globals/types';
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
export const MEMORIZATION_MENU_ITEMS: MenuItem[] = [
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
    }
];

/**
 * Education Program Menu (for other main_program types)
 * Add menu items for education program here
 */
export const EDUCATION_MENU_ITEMS: MenuItem[] = [
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
export const TEACHER_MENU_ITEMS: MenuItem[] = [
    {
        path: ROUTE_PATHS.TEACHER_HALAQAS,
        labelKey: 'menu.halaqaty',
        icon: 'CircleIcon',
        roles: ['teacher']
    }
];

/**
 * Get menu items based on user's main_program and roles
 */
export const getMenuItems = (mainProgramId?: number, userRoles?: string[]): MenuItem[] => {
    const menuItems: MenuItem[] = [];
    
    // Add program-specific menu items
    if (mainProgramId === 2) {
        // Memorization program
        menuItems.push(...MEMORIZATION_MENU_ITEMS);
    } else if (mainProgramId !== undefined && mainProgramId !== 2) {
        // Other programs (education, etc.)
        menuItems.push(...EDUCATION_MENU_ITEMS);
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
export const MENU_ITEMS: MenuItem[] = MEMORIZATION_MENU_ITEMS;
