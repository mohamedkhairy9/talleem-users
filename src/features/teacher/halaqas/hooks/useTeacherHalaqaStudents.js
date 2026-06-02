import { useQuery } from '@tanstack/react-query';
import { teacherHalaqasService } from '../services/halaqas.service';
/**
 * Get students for a specific halaqa query hook
 */
export const useTeacherHalaqaStudents = (halaqaId) => {
    const query = useQuery({
        queryKey: ['teacher-halaqa-students', halaqaId],
        queryFn: () => teacherHalaqasService.getHalaqaStudents(halaqaId),
        enabled: !!halaqaId,
        staleTime: 2 * 60 * 1000
    });
    // Axios interceptor returns response.data (API body), so query.data = TeacherHalaqaStudentsResponse
    const responseBody = query.data;
    return {
        ...query,
        halaqa: responseBody?.halaqa,
        students: responseBody?.students ?? [],
        attendanceTypes: responseBody?.attendance_types ?? [],
        date: responseBody?.date,
        time: responseBody?.time
    };
};
