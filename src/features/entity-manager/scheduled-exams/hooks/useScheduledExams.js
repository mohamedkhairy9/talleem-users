import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores';
import { useDateFormatStore } from '@/app/stores/dateFormat.store';
import { formFieldsService } from '@/features/entity-manager/halaqas/services/form-fields.service';
import { generateOptions } from '@/features/entity-manager/halaqas/utils/formOptionsUtils';
import { scheduledExamsService } from '../services/scheduled-exams.service';

const FORM_OPTIONS_PER_PAGE = 1000;
const STALE_TIME_MS = 2 * 60 * 1000;
const QUERY_KEY = ['scheduled-exams'];
const getArrayData = (response) => {
    if (Array.isArray(response?.data)) {
        return response.data;
    }

    if (Array.isArray(response?.data?.data)) {
        return response.data.data;
    }

    if (Array.isArray(response)) {
        return response;
    }

    return [];
};

export function useScheduledExams(params = {}, options) {
    const dateFormat = useDateFormatStore((state) => state.dateFormat);

    const query = useQuery({
        queryKey: [...QUERY_KEY, params, dateFormat],
        queryFn: () => scheduledExamsService.getScheduledExams(params),
        enabled: options?.enabled !== false,
        staleTime: STALE_TIME_MS
    });

    const responseBody = query.data;
    const nestedResponseBody = responseBody?.data && !Array.isArray(responseBody.data)
        ? responseBody.data
        : null;

    const list = Array.isArray(responseBody?.data)
        ? responseBody.data
        : Array.isArray(nestedResponseBody?.data)
            ? nestedResponseBody.data
            : Array.isArray(responseBody)
                ? responseBody
                : [];

    const meta = responseBody?.meta ??
        nestedResponseBody?.meta ??
        responseBody?.pagination ??
        nestedResponseBody?.pagination ??
        null;

    return {
        ...query,
        list,
        meta,
        refresh: query.refetch
    };
}

export function useScheduledExam(examId, options) {
    const dateFormat = useDateFormatStore((state) => state.dateFormat);

    const query = useQuery({
        queryKey: [...QUERY_KEY, 'detail', examId, dateFormat],
        queryFn: () => scheduledExamsService.getScheduledExam(examId),
        enabled: Boolean(examId) && options?.enabled !== false,
        staleTime: STALE_TIME_MS
    });

    const responseBody = query.data;
    const firstLevel = responseBody?.data && !Array.isArray(responseBody.data)
        ? responseBody.data
        : null;
    const secondLevel = firstLevel?.data && !Array.isArray(firstLevel.data)
        ? firstLevel.data
        : null;
    const exam = secondLevel ?? firstLevel ?? responseBody ?? null;

    return {
        ...query,
        exam
    };
}

export function useCreateScheduledExam() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => scheduledExamsService.createScheduledExam(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        }
    });
}

export function useUpdateScheduledExam() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ examId, data }) => scheduledExamsService.updateScheduledExam(examId, data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, 'detail', variables?.examId] });
        }
    });
}

export function useDeleteScheduledExam() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (examId) => scheduledExamsService.deleteScheduledExam(examId),
        onSuccess: (_data, examId) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            queryClient.removeQueries({ queryKey: [...QUERY_KEY, 'detail', examId] });
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

    const requiredExamSegmentsQuery = useQuery({
        queryKey: ['scheduled-exams-form', 'required-exam-segments'],
        queryFn: () => scheduledExamsService.getRequiredExamSegments({
            page: 1,
            per_page: FORM_OPTIONS_PER_PAGE
        }),
        staleTime: STALE_TIME_MS
    });

    const requiredExamSegmentsList = getArrayData(requiredExamSegmentsQuery.data);

    return {
        teachersOptions: generateOptions(teachersQuery.data?.data),
        studentsOptions: generateOptions(studentsQuery.data?.data),
        platformsOptions: generateOptions(platformsQuery.data?.data),
        requiredExamSegmentsOptions: generateOptions(requiredExamSegmentsList),
        teachersList: Array.isArray(teachersQuery.data?.data) ? teachersQuery.data.data : [],
        studentsList: Array.isArray(studentsQuery.data?.data) ? studentsQuery.data.data : [],
        platformsList: Array.isArray(platformsQuery.data?.data) ? platformsQuery.data.data : [],
        requiredExamSegmentsList,
        isLoadingTeachers: teachersQuery.isLoading,
        isLoadingStudents: studentsQuery.isLoading,
        isLoadingPlatforms: platformsQuery.isLoading,
        isLoadingRequiredExamSegments: requiredExamSegmentsQuery.isLoading,
        isLoading: teachersQuery.isLoading || studentsQuery.isLoading || platformsQuery.isLoading || requiredExamSegmentsQuery.isLoading
    };
}
