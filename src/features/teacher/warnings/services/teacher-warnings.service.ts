import { axiosInstance } from '@/api/axiosInstance';
import type {
    TeacherWarningsListResponse,
    TeacherWarningsListParams
} from '../types/teacher-warnings.types';

/**
 * Teacher Warnings Service
 * GET /teacher/warnings - read-only list for teacher role
 */
export const teacherWarningsService = {
    /**
     * Get warnings for the current teacher (paginated)
     * GET /teacher/warnings
     */
    getTeacherWarnings: (params?: TeacherWarningsListParams): Promise<TeacherWarningsListResponse> => {
        return axiosInstance.get('/teacher/warnings', { params });
    }
};
