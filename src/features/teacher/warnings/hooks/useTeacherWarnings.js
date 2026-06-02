import { useQuery } from '@tanstack/react-query';
import { teacherWarningsService } from '../services/teacher-warnings.service';
/**
 * Get teacher warnings list (paginated)
 */
export function useTeacherWarnings(params = {}) {
    const query = useQuery({
        queryKey: ['teacher-warnings', params],
        queryFn: () => teacherWarningsService.getTeacherWarnings(params),
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
