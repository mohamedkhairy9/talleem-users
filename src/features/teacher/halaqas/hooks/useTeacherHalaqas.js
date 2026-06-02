import { useQuery } from '@tanstack/react-query';
import { teacherHalaqasService } from '../services/halaqas.service';
/**
 * Get active halaqas for teacher query hook
 */
export const useTeacherHalaqas = () => {
    const query = useQuery({
        queryKey: ['teacher-halaqas', 'active'],
        queryFn: () => teacherHalaqasService.getActiveHalaqas(),
        staleTime: 2 * 60 * 1000
    });
    // Axios interceptor returns response.data (API body), so query.data = { data: TeacherHalaqaItem[] }
    const responseBody = query.data;
    const list = Array.isArray(responseBody?.data) ? responseBody.data : [];
    return {
        ...query,
        list
    };
};
