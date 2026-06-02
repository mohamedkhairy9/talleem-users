import { axiosInstance } from '@/api/axiosInstance';
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
    getActiveHalaqas: () => {
        return axiosInstance.get('/teacher/halaqas/active');
    },
    /**
     * Get students for a specific halaqa
     * GET /teacher/halaqas/:id/students
     * API returns: { halaqa: {...}, students: [...], attendance_types: [], date: string, time: string }
     * Axios interceptor extracts response.data, so this returns TeacherHalaqaStudentsResponse directly
     */
    getHalaqaStudents: (halaqaId) => {
        return axiosInstance.get(`/teacher/halaqas/${halaqaId}/students`);
    },
    /**
     * Get plan for a specific student and activity
     * GET /teacher/halaqas/:halaqaId/students/:studentId/plan?activity={activity}
     * Axios interceptor extracts response.data, so this returns StudentPlanResponse directly
     */
    getStudentPlan: (halaqaId, studentId, activity) => {
        return axiosInstance.get(`/teacher/halaqas/${halaqaId}/students/${studentId}/plan`, {
            params: { activity }
        });
    },
    /**
     * Submit attendance for a student
     * POST /teacher/halaqas/:halaqaId/attendance
     * Payload: { student_id: number, is_present: boolean, attendance_type_id?: number }
     */
    submitAttendance: (halaqaId, data) => {
        return axiosInstance.post(`/teacher/halaqas/${halaqaId}/attendance`, data);
    },
    /**
     * Get attendance types
     * GET /attendance-types
     * Axios interceptor extracts response.data, so this returns AttendanceTypesResponse directly
     */
    getAttendanceTypes: () => {
        return axiosInstance.get('/attendance-types');
    },
    /**
     * Submit bulk attendance for all students with special reason
     * POST /teacher/halaqas/:halaqaId/attendance/all
     * Payload: { special_reason: 'teacher_absence' | 'force_majeure', student_attendances: [{ student_id, is_present }] }
     */
    submitBulkAttendance: (halaqaId, data) => {
        return axiosInstance.post(`/teacher/halaqas/${halaqaId}/attendance/all`, data);
    },
    /**
     * Submit memorization/grade for a student
     * POST /teacher/halaqas/:halaqaId/memorization
     * Payload: { student_id, activity, halaqa_plan_id, is_complete, grade, actual_end_verse_key, notes }
     */
    submitMemorization: (halaqaId, data) => {
        return axiosInstance.post(`/teacher/halaqas/${halaqaId}/memorization`, data);
    }
};
