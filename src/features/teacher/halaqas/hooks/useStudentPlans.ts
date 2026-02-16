import { useQueries } from '@tanstack/react-query';
import { teacherHalaqasService } from '../services/halaqas.service';
import type { StudentPlanResponse } from '../types/students.types';
import type { HalaqaStudent } from '../types/students.types';

/**
 * Plan key for identifying a specific plan
 */
export interface PlanKey {
    studentId: number;
    activity: string;
}

/**
 * Hook to fetch plans for all students and their activities
 * Returns a map of plans keyed by studentId and activity
 */
export const useStudentPlans = (
    halaqaId: number | string | undefined,
    students: HalaqaStudent[]
) => {
    // Build query configurations with metadata
    const queryConfigs = students.flatMap((student) =>
        (student.activities || []).map((activity) => ({
            studentId: student.id,
            activity,
            queryKey: ['student-plan', halaqaId, student.id, activity] as const,
            queryFn: () =>
                teacherHalaqasService.getStudentPlan(halaqaId!, student.id, activity),
            enabled: !!halaqaId && !!student.id && !!activity,
            staleTime: 2 * 60 * 1000
        }))
    );

    // Generate all plan queries
    const planQueries = useQueries({
        queries: queryConfigs.map(({ studentId, activity, ...queryConfig }) => queryConfig)
    });

    // Create a map for easy access: { studentId: { activity: StudentPlanResponse } }
    const plansMap = queryConfigs.reduce(
        (acc, config, index) => {
            const query = planQueries[index];
            if (query.data) {
                if (!acc[config.studentId]) {
                    acc[config.studentId] = {};
                }
                acc[config.studentId][config.activity] = query.data;
            }
            return acc;
        },
        {} as Record<number, Record<string, StudentPlanResponse>>
    );

    // Calculate loading and error states
    const isLoading = planQueries.some((query) => query.isLoading);
    const hasError = planQueries.some((query) => query.isError);
    const errors = queryConfigs
        .map((config, index) => {
            const query = planQueries[index];
            if (query.isError) {
                return {
                    studentId: config.studentId,
                    activity: config.activity,
                    error: query.error
                };
            }
            return null;
        })
        .filter(Boolean) as Array<{ studentId: number; activity: string; error: unknown }>;

    return {
        plans: plansMap,
        isLoading,
        hasError,
        errors
    };
};

