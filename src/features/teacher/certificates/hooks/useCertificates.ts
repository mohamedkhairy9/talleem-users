import { useQuery } from '@tanstack/react-query';
import { teacherCertificatesService } from '../services/certificates.service';
import type {
    TeacherStudentsListParams,
    TeacherStudentListItem,
    StudentCertificatesDetail
} from '../types/certificates.types';

/**
 * Get teacher's students list (paginated)
 * GET /teacher/halaqas/students
 */
export function useTeacherStudents(params: TeacherStudentsListParams = {}) {
    const query = useQuery({
        queryKey: ['teacher-certificates-students', params],
        queryFn: () => teacherCertificatesService.getTeacherStudents(params),
        staleTime: 2 * 60 * 1000
    });

    const responseBody = query.data;
    const list: TeacherStudentListItem[] = Array.isArray(responseBody?.data) ? responseBody.data : [];
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
export function useStudentCertificates(studentId: number | null) {
    const query = useQuery({
        queryKey: ['student-certificates', studentId],
        queryFn: () => teacherCertificatesService.getStudentCertificates(studentId!),
        enabled: studentId != null && studentId > 0,
        staleTime: 2 * 60 * 1000
    });

    const response = query.data as { data?: StudentCertificatesDetail; success?: boolean; message?: string } | undefined;
    const detail: StudentCertificatesDetail | null = response?.data ?? null;
    const apiMessage: string | null =
        response && response.success === false && typeof response.message === 'string' ? response.message : null;

    return {
        ...query,
        detail,
        apiMessage
    };
}
