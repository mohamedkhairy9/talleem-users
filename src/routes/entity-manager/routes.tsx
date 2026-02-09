import { RouteConfig } from '@/globals/types';
import { ROUTE_PATHS } from '@/config';
import {
    HalaqasListPage,
    HalaqaDetailPage,
    CreateHalaqaPage,
    EditHalaqaPage,
    WarningsPage
} from '@/pages/entity-manager';

/**
 * Entity Manager Routes Configuration
 * All routes specific to entity managers
 */
export const entityManagerRoutes: RouteConfig[] = [
    // Halaqas (index for entity_manager)
    {
        path: ROUTE_PATHS.HALAQAS,
        element: <HalaqasListPage />,
        roles: ['entity_manager']
    },
    // Halaqa Detail
    {
        path: ROUTE_PATHS.HALAQA_DETAIL,
        element: <HalaqaDetailPage />,
        roles: ['entity_manager']
    },
    // Edit Halaqa
    {
        path: ROUTE_PATHS.EDIT_HALAQA,
        element: <EditHalaqaPage />,
        roles: ['entity_manager']
    },
    // Create Halaqa
    {
        path: ROUTE_PATHS.CREATE_HALAQA,
        element: <CreateHalaqaPage />,
        roles: ['entity_manager']
    },
    // Warnings Management (also accessible to admin)
    {
        path: ROUTE_PATHS.WARNINGS_MANAGEMENT,
        element: <WarningsPage />,
        roles: ['admin', 'entity_manager']
    }
];


