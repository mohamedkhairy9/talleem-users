import { RouteConfig } from '@/globals/types';
import { ROUTE_PATHS } from '@/config';
import { MyHalaqasPage, TeacherHalaqaDetailPage, TeacherRequestsPage, TeacherWarningsPage, TeacherLeavesPage, TeacherCertificatesPage } from '@/pages/teacher';

/**
 * Teacher Routes Configuration
 * All routes specific to teachers
 */
export const teacherRoutes: RouteConfig[] = [
    // My Halaqas (index for teacher)
    {
        path: ROUTE_PATHS.TEACHER_HALAQAS,
        element: <MyHalaqasPage />,
        roles: ['teacher']
    },
    // Teacher Halaqa Detail
    {
        path: ROUTE_PATHS.TEACHER_HALAQA_DETAIL,
        element: <TeacherHalaqaDetailPage />,
        roles: ['teacher']
    },
    // Teacher Requests
    {
        path: ROUTE_PATHS.TEACHER_REQUESTS,
        element: <TeacherRequestsPage />,
        roles: ['teacher']
    },
    // Teacher Warnings (read-only)
    {
        path: ROUTE_PATHS.TEACHER_WARNINGS,
        element: <TeacherWarningsPage />,
        roles: ['teacher']
    },
    // Teacher Leaves
    {
        path: ROUTE_PATHS.TEACHER_LEAVES,
        element: <TeacherLeavesPage />,
        roles: ['teacher']
    },
    // Teacher Certificates
    {
        path: ROUTE_PATHS.TEACHER_CERTIFICATES,
        element: <TeacherCertificatesPage />,
        roles: ['teacher']
    }
];

