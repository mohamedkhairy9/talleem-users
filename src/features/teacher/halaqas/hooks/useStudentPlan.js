import { useQuery } from '@tanstack/react-query';
import { teacherHalaqasService } from '../services/halaqas.service';
/**
 * Hook to fetch a single student plan for a specific activity
 * Fetches on-demand when studentId, halaqaId, and activity are provided
 */
export const useStudentPlan = (halaqaId, studentId, activity, enabled = true) => {
    const query = useQuery({
        queryKey: ['student-plan', halaqaId, studentId, activity],
        queryFn: () => teacherHalaqasService.getStudentPlan(halaqaId, studentId, activity),
        enabled: !!halaqaId && !!studentId && !!activity && enabled,
        staleTime: 2 * 60 * 1000
    });
    return query;
};
