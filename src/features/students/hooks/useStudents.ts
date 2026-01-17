import { useQuery } from '@tanstack/react-query';
import { studentsService } from '../services/students.service';

/**
 * Hook to fetch students
 */
export const useStudents = (filters: Record<string, any> = {}) => {
    return useQuery({
        queryKey: ['students', filters],
        queryFn: () => studentsService.getStudents(filters),
        staleTime: 5 * 60 * 1000 // 5 minutes
    });
};
