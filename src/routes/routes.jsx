import { ROUTE_PATHS } from '@/config';
import DashboardPage from '@/pages/DashboardPage';
import TeachersPage from '@/pages/TeachersPage';
import EntityManagersPage from '@/pages/EntityManagersPage';
import RoleBasedIndexRoute from './RoleBasedIndexRoute';
import { entityManagerRoutes } from './entity-manager';
import { teacherRoutes } from './teacher';
/**
 * Application Routes Configuration
 * Routes are filtered by role in AppRoutes component
 *
 * Routes are organized by role:
 * - Shared routes (dashboard, etc.)
 * - Entity Manager routes (imported from entity-manager module)
 * - Future: Teacher routes, Admin routes, etc.
 */
export const routes = [
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
    // Entity Manager Routes (Halaqas, Warnings, etc.)
    ...entityManagerRoutes,
    // Teacher Routes (My Halaqas, etc.)
    ...teacherRoutes
];
