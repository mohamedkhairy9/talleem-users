import { axiosInstance } from '@/shared/api/axiosInstance';
/**
 * Teacher Warnings Service
 * GET /teacher/warnings - read-only list for teacher role
 */
export const teacherWarningsService = {
    /**
     * Get warnings for the current teacher (paginated)
     * GET /teacher/warnings
     */
    getTeacherWarnings: (params) => {
        return axiosInstance.get('/teacher/warnings', { params });
    }
};
