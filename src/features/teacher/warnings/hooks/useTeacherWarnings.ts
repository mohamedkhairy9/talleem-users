import { useQuery } from '@tanstack/react-query';
import { teacherWarningsService } from '../services/teacher-warnings.service';
import type {
    TeacherWarningsListParams,
    TeacherWarningResponse
} from '../types/teacher-warnings.types';

/**
 * Get teacher warnings list (paginated)
 */
export function useTeacherWarnings(params: TeacherWarningsListParams = {}) {
    const query = useQuery({
        queryKey: ['teacher-warnings', params],
        queryFn: () => teacherWarningsService.getTeacherWarnings(params),
        staleTime: 2 * 60 * 1000
    });

    const responseBody = query.data;
    const list: TeacherWarningResponse[] = Array.isArray(responseBody?.data) ? responseBody.data : [];
    const meta = responseBody?.meta;

    return {
        ...query,
        list,
        meta
    };
}
