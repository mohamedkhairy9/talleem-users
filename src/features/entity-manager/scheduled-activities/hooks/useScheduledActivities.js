import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores';
import { useDateFormatStore } from '@/app/stores/dateFormat.store';
import { formFieldsService } from '@/features/entity-manager/halaqas/services/form-fields.service';
import { generateOptions } from '@/features/entity-manager/halaqas/utils/formOptionsUtils';
import { scheduledActivitiesService } from '../services/scheduled-activities.service';

const FORM_OPTIONS_PER_PAGE = 1000;
const STALE_TIME_MS = 2 * 60 * 1000;
const QUERY_KEY = ['scheduled-activities'];

function extractListAndMeta(responseBody) {
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

    return { list, meta };
}

export function useScheduledActivities(params = {}, options) {
    const dateFormat = useDateFormatStore((state) => state.dateFormat);

    const query = useQuery({
        queryKey: [...QUERY_KEY, params, dateFormat],
        queryFn: () => scheduledActivitiesService.getScheduledActivities(params),
        enabled: options?.enabled !== false,
        staleTime: STALE_TIME_MS
    });

    const { list, meta } = extractListAndMeta(query.data);

    return {
        ...query,
        list,
        meta,
        refresh: query.refetch
    };
}

export function useScheduledActivity(activityId, options) {
    const dateFormat = useDateFormatStore((state) => state.dateFormat);

    const query = useQuery({
        queryKey: [...QUERY_KEY, 'detail', activityId, dateFormat],
        queryFn: () => scheduledActivitiesService.getScheduledActivity(activityId),
        enabled: Boolean(activityId) && options?.enabled !== false,
        staleTime: STALE_TIME_MS
    });

    const responseBody = query.data;
    const firstLevel = responseBody?.data && !Array.isArray(responseBody.data)
        ? responseBody.data
        : null;
    const secondLevel = firstLevel?.data && !Array.isArray(firstLevel.data)
        ? firstLevel.data
        : null;
    const activity = secondLevel ?? firstLevel ?? responseBody ?? null;

    return {
        ...query,
        activity
    };
}

export function useCreateScheduledActivity() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => scheduledActivitiesService.createScheduledActivity(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        }
    });
}

export function useUpdateScheduledActivity() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ activityId, data }) => scheduledActivitiesService.updateScheduledActivity(activityId, data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, 'detail', variables?.activityId] });
        }
    });
}

export function useDeleteScheduledActivity() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (activityId) => scheduledActivitiesService.deleteScheduledActivity(activityId),
        onSuccess: (_data, activityId) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            queryClient.removeQueries({ queryKey: [...QUERY_KEY, 'detail', activityId] });
        }
    });
}

export function useScheduledActivityFormOptions() {
    const actingEntityId = useAuthStore((state) => state.actingEntityId);
    const fallbackEntityId = useAuthStore((state) => state.user?.entity?.id);
    const entityId = actingEntityId ?? fallbackEntityId;

    const teachersQuery = useQuery({
        queryKey: ['scheduled-activities-form', 'teachers', entityId],
        queryFn: () => formFieldsService.getTeachers({
            page: 1,
            per_page: FORM_OPTIONS_PER_PAGE,
            ...(entityId != null && { entity_id: entityId })
        }),
        staleTime: STALE_TIME_MS
    });

    const studentsQuery = useQuery({
        queryKey: ['scheduled-activities-form', 'students', entityId],
        queryFn: () => formFieldsService.getStudents({
            page: 1,
            per_page: FORM_OPTIONS_PER_PAGE,
            ...(entityId != null && { entity_id: entityId })
        }),
        staleTime: STALE_TIME_MS
    });

    return {
        teachersOptions: generateOptions(teachersQuery.data?.data),
        studentsOptions: generateOptions(studentsQuery.data?.data),
        teachersList: Array.isArray(teachersQuery.data?.data) ? teachersQuery.data.data : [],
        studentsList: Array.isArray(studentsQuery.data?.data) ? studentsQuery.data.data : [],
        isLoadingTeachers: teachersQuery.isLoading,
        isLoadingStudents: studentsQuery.isLoading,
        isLoading: teachersQuery.isLoading || studentsQuery.isLoading
    };
}

