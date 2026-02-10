import { RouteConfig } from '@/globals/types';
import { ROUTE_PATHS } from '@/config';
import { MyHalaqasPage, TeacherHalaqaDetailPage } from '@/pages/teacher';

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
    }
];

