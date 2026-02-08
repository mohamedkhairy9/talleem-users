import { RouteConfig } from '@/globals/types';
import { ROUTE_PATHS } from '@/config';
import DashboardPage from '@/pages/DashboardPage';
import TeachersPage from '@/pages/TeachersPage';
import EntityManagersPage from '@/pages/EntityManagersPage';
import HalaqasListPage from '@/pages/HalaqasListPage';
import HalaqaDetailPage from '@/pages/HalaqaDetailPage';
import CreateHalaqaPage from '@/pages/CreateHalaqaPage';
import EditHalaqaPage from '@/pages/EditHalaqaPage';
import WarningsPage from '@/pages/WarningsPage';
import RoleBasedIndexRoute from './RoleBasedIndexRoute';

/**
 * Application Routes Configuration
 * Routes are filtered by role in AppRoutes component
 */
export const routes: RouteConfig[] = [
    // Index route - role-based redirect
    {
        path: ROUTE_PATHS.DASHBOARD,
        element: <RoleBasedIndexRoute />,
        index: true
    },
    // Dashboard (accessible to all authenticated users, but entity_manager will be redirected from index)
    {
        path: ROUTE_PATHS.DASHBOARD,
        element: <DashboardPage />
    },
    // Teachers
    {
        path: ROUTE_PATHS.TEACHERS,
        element: <TeachersPage />,
        roles: ['admin', 'entity_manager']
    },
    // Entity Managers
    {
        path: ROUTE_PATHS.ENTITY_MANAGERS,
        element: <EntityManagersPage />,
        roles: ['admin']
    },
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
    // Warnings Management
    {
        path: ROUTE_PATHS.WARNINGS_MANAGEMENT,
        element: <WarningsPage />,
        roles: ['admin', 'entity_manager']
    }
];
