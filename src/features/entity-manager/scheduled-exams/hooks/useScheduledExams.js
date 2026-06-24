import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores';
import { formFieldsService } from '@/features/entity-manager/halaqas/services/form-fields.service';
import { generateOptions } from '@/features/entity-manager/halaqas/utils/formOptionsUtils';
import { scheduledExamsService } from '../services/scheduled-exams.service';

const FORM_OPTIONS_PER_PAGE = 1000;
const STALE_TIME_MS = 2 * 60 * 1000;

export function useCreateScheduledExam() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => scheduledExamsService.createScheduledExam(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scheduled-exams'] });
        }
    });
}

export function useScheduledExamFormOptions() {
    const actingEntityId = useAuthStore((state) => state.actingEntityId);
    const fallbackEntityId = useAuthStore((state) => state.user?.entity?.id);
    const entityId = actingEntityId ?? fallbackEntityId;

    const teachersQuery = useQuery({
        queryKey: ['scheduled-exams-form', 'teachers', entityId],
        queryFn: () => formFieldsService.getTeachers({
            page: 1,
            per_page: FORM_OPTIONS_PER_PAGE,
            ...(entityId != null && { entity_id: entityId })
        }),
        staleTime: STALE_TIME_MS
    });

    const studentsQuery = useQuery({
        queryKey: ['scheduled-exams-form', 'students', entityId],
        queryFn: () => formFieldsService.getStudents({
            page: 1,
            per_page: FORM_OPTIONS_PER_PAGE,
            ...(entityId != null && { entity_id: entityId })
        }),
        staleTime: STALE_TIME_MS
    });

    const platformsQuery = useQuery({
        queryKey: ['scheduled-exams-form', 'platforms'],
        queryFn: () => formFieldsService.getRemotelyAttendancePlatforms({
            page: 1,
            per_page: FORM_OPTIONS_PER_PAGE
        }),
        staleTime: STALE_TIME_MS
    });

    return {
        teachersOptions: generateOptions(teachersQuery.data?.data),
        studentsOptions: generateOptions(studentsQuery.data?.data),
        platformsOptions: generateOptions(platformsQuery.data?.data),
        teachersList: Array.isArray(teachersQuery.data?.data) ? teachersQuery.data.data : [],
        studentsList: Array.isArray(studentsQuery.data?.data) ? studentsQuery.data.data : [],
        platformsList: Array.isArray(platformsQuery.data?.data) ? platformsQuery.data.data : [],
        isLoadingTeachers: teachersQuery.isLoading,
        isLoadingStudents: studentsQuery.isLoading,
        isLoadingPlatforms: platformsQuery.isLoading,
        isLoading: teachersQuery.isLoading || studentsQuery.isLoading || platformsQuery.isLoading
    };
}
