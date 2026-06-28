import { ROUTE_PATHS } from '@/config';
import { HalaqasListPage, HalaqaDetailPage, CreateHalaqaPage, EditHalaqaPage, IncomingWarningsPage, WarningsIssuedPage, LicensesPage, JoinRequestsPage, EntityManagerDiaryPage, ScheduledExamsPage, CreateScheduledExamPage, ScheduledExamDetailPage, EditScheduledExamPage } from '@/features/entity-manager/pages';
/**
 * Entity Manager Routes Configuration
 * All routes specific to entity managers
 */
export const entityManagerRoutes = [
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
        element: <IncomingWarningsPage />,
        roles: ['admin', 'entity_manager']
    },
    {
        path: ROUTE_PATHS.INCOMING_WARNINGS,
        element: <IncomingWarningsPage />,
        roles: ['admin', 'entity_manager']
    },
    {
        path: ROUTE_PATHS.WARNINGS_ISSUED,
        element: <WarningsIssuedPage />,
        roles: ['admin', 'entity_manager']
    },
    // Licenses (entity manager: view entity licenses)
    {
        path: ROUTE_PATHS.ENTITY_LICENSES,
        element: <LicensesPage />,
        roles: ['entity_manager']
    },
    // Join Requests (entity manager: view and process join requests)
    {
        path: ROUTE_PATHS.JOIN_REQUESTS,
        element: <JoinRequestsPage />,
        roles: ['entity_manager']
    },
    {
        path: ROUTE_PATHS.ENTITY_MANAGER_DIARY,
        element: <EntityManagerDiaryPage />,
        roles: ['entity_manager']
    },
    // Scheduled Exams (entity manager: list and create exam sessions)
    {
        path: ROUTE_PATHS.SCHEDULED_EXAMS,
        element: <ScheduledExamsPage />,
        roles: ['entity_manager']
    },
    {
        path: ROUTE_PATHS.SCHEDULED_EXAMS_DETAIL,
        element: <ScheduledExamDetailPage />,
        roles: ['entity_manager']
    },
    {
        path: ROUTE_PATHS.SCHEDULED_EXAMS_EDIT,
        element: <EditScheduledExamPage />,
        roles: ['entity_manager']
    },
    {
        path: ROUTE_PATHS.SCHEDULED_EXAMS_CREATE,
        element: <CreateScheduledExamPage />,
        roles: ['entity_manager']
    }
];
