import { MenuItem } from '@/globals/types';
import { ROUTE_PATHS } from './routes.config';

/**
 * Menu Configuration
 * Centralized menu items configuration
 * Menu items are dynamic based on user roles and permissions
 */
export const MENU_ITEMS: MenuItem[] = [
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
