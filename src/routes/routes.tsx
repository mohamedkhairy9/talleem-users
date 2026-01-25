import { RouteConfig } from '@/globals/types';
import { ROUTE_PATHS } from '@/config';
import DashboardPage from '@/pages/DashboardPage';
import TeachersPage from '@/pages/TeachersPage';
import EntityManagersPage from '@/pages/EntityManagersPage';
import HalaqasListPage from '@/pages/HalaqasListPage';
import HalaqaDetailPage from '@/pages/HalaqaDetailPage';
import CreateHalaqaPage from '@/pages/CreateHalaqaPage';

/**
 * Application Routes Configuration
 */
export const routes: RouteConfig[] = [
    {
        path: ROUTE_PATHS.DASHBOARD,
        element: <DashboardPage />,
        index: true
    },
    {
        path: ROUTE_PATHS.TEACHERS,
        element: <TeachersPage />,
        roles: ['admin', 'entity_manager']
    },
    {
        path: ROUTE_PATHS.ENTITY_MANAGERS,
        element: <EntityManagersPage />,
        roles: ['admin']
    },
    {
        path: ROUTE_PATHS.HALAQAS,
        element: <HalaqasListPage />,
        roles: ['entity_manager']
    },
    {
        path: ROUTE_PATHS.HALAQA_DETAIL,
        element: <HalaqaDetailPage />,
        roles: ['entity_manager']
    },
    {
        path: ROUTE_PATHS.CREATE_HALAQA,
        element: <CreateHalaqaPage />,
        roles: ['entity_manager']
    }
];
