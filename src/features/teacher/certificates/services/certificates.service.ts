import { axiosInstance } from '@/api/axiosInstance';
import type {
    TeacherStudentsListResponse,
    TeacherStudentsListParams,
    StudentCertificatesResponse
} from '../types/certificates.types';

/**
 * Teacher Certificates Service
 * GET /teacher/halaqas/students, GET /student-certificates/:id
 */
export const teacherCertificatesService = {
    /**
     * Get students for the teacher (all halaqas)
     * GET /teacher/halaqas/students
     */
    getTeacherStudents: (params?: TeacherStudentsListParams): Promise<TeacherStudentsListResponse> => {
        return axiosInstance.get('/teacher/halaqas/students', { params });
    },

    /**
     * Get student certificates by student id
     * GET /student-certificates/:id
     */
    getStudentCertificates: (studentId: number): Promise<StudentCertificatesResponse> => {
        return axiosInstance.get(`/student-certificates/${studentId}`);
    }
};
