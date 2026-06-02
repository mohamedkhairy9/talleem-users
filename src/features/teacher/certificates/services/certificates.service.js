import { axiosInstance } from '@/api/axiosInstance';
/**
 * Teacher Certificates Service
 * GET /teacher/halaqas/students, GET /student-certificates/:id
 */
export const teacherCertificatesService = {
    /**
     * Get students for the teacher (all halaqas)
     * GET /teacher/halaqas/students
     */
    getTeacherStudents: (params) => {
        return axiosInstance.get('/teacher/halaqas/students', { params });
    },
    /**
     * Get student certificates by student id
     * GET /student-certificates/:id
     */
    getStudentCertificates: (studentId) => {
        return axiosInstance.get(`/student-certificates/${studentId}`);
    }
};
