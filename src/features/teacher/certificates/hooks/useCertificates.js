import { useQuery } from '@tanstack/react-query';
import { teacherCertificatesService } from '../services/certificates.service';
/**
 * Get teacher's students list (paginated)
 * GET /teacher/halaqas/students
 */
export function useTeacherStudents(params = {}) {
    const query = useQuery({
        queryKey: ['teacher-certificates-students', params],
        queryFn: () => teacherCertificatesService.getTeacherStudents(params),
        staleTime: 2 * 60 * 1000
    });
    const responseBody = query.data;
    const list = Array.isArray(responseBody?.data) ? responseBody.data : [];
    const meta = responseBody?.meta;
    return {
        ...query,
        list,
        meta
    };
}
/**
 * Get student certificates detail
 * GET /student-certificates/:id
 * API may return 200 with { success: false, message: "..." } when no certificates found.
 */
export function useStudentCertificates(studentId) {
    const query = useQuery({
        queryKey: ['student-certificates', studentId],
        queryFn: () => teacherCertificatesService.getStudentCertificates(studentId),
        enabled: studentId != null && studentId > 0,
        staleTime: 2 * 60 * 1000
    });
    const response = query.data;
    const detail = response?.data ?? null;
    const apiMessage = response && response.success === false && typeof response.message === 'string' ? response.message : null;
    return {
        ...query,
        detail,
        apiMessage
    };
}
