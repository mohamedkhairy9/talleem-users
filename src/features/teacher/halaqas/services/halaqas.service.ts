import { axiosInstance } from '@/api/axiosInstance';
import type { TeacherHalaqasListResponse } from '../types/list.types';
import type { TeacherHalaqaStudentsResponse, StudentPlanResponse } from '../types/students.types';

/**
 * Teacher Halaqas Service
 */
export const teacherHalaqasService = {
    /**
     * Get active halaqas for teacher
     * GET /teacher/halaqas/active
     * API returns: { data: TeacherHalaqaItem[] }
     * Axios interceptor extracts response.data, so this returns TeacherHalaqasListResponse directly
     */
    getActiveHalaqas: (): Promise<TeacherHalaqasListResponse> => {
        return axiosInstance.get('/teacher/halaqas/active');
    },

    /**
     * Get students for a specific halaqa
     * GET /teacher/halaqas/:id/students
     * API returns: { halaqa: {...}, students: [...], attendance_types: [], date: string, time: string }
     * Axios interceptor extracts response.data, so this returns TeacherHalaqaStudentsResponse directly
     */
    getHalaqaStudents: (halaqaId: number | string): Promise<TeacherHalaqaStudentsResponse> => {
        return axiosInstance.get(`/teacher/halaqas/${halaqaId}/students`);
    },

    /**
     * Get plan for a specific student and activity
     * GET /teacher/halaqas/:halaqaId/students/:studentId/plan?activity={activity}
     * Axios interceptor extracts response.data, so this returns StudentPlanResponse directly
     */
    getStudentPlan: (
        halaqaId: number | string,
        studentId: number | string,
        activity: string
    ): Promise<StudentPlanResponse> => {
        return axiosInstance.get(`/teacher/halaqas/${halaqaId}/students/${studentId}/plan`, {
            params: { activity }
        });
    }
};

