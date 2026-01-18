import { RouteConfig } from '@/globals/types';
import { ROUTE_PATHS } from '@/config';
import DashboardPage from '@/pages/DashboardPage';
import StudentsPage from '@/pages/StudentsPage';
import TeachersPage from '@/pages/TeachersPage';
import EntityManagersPage from '@/pages/EntityManagersPage';
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
        path: ROUTE_PATHS.STUDENTS,
        element: <StudentsPage />,
        roles: ['admin', 'entity_manager', 'teacher']
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
        path: ROUTE_PATHS.CREATE_HALAQA,
        element: <CreateHalaqaPage />,
        roles: ['entity_manager']
    }
];
