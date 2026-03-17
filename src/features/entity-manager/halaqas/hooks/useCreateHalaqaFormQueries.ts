import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores';
import { formFieldsService } from '../services/form-fields.service';
import { getAutoIncludeActivitiesForTahfiz } from '../services/configurations.service';
import { generateOptions } from '../utils/formOptionsUtils';
import type { SelectRFHOption } from '@/globals/components/ui/SelectRFH';
import type { HalaqaActivity } from '../config';

/** Query keys for create halaqa form lists (include entity_id so cache is per entity) */
export const HALAQA_FORM_QUERY_KEYS = {
    teachers: ['halaqa-form', 'teachers'] as const,
    students: ['halaqa-form', 'students'] as const,
    platforms: ['halaqa-form', 'platforms'] as const,
    autoIncludeActivities: ['halaqa-form', 'configurations', 'tahfiz', 'auto_include_activities'] as const,
} as const;

const ITEMS_PER_PAGE = 10;
const STALE_TIME_MS = 2 * 60 * 1000;

/** API list response shape: { data: Item[] } */
type ListResponse = { data?: Record<string, unknown>[] };

interface UseCreateHalaqaFormQueriesOptions {
    includeStudents?: boolean;
}

/**
 * Fetches form-level options for halaqa forms.
 * Teachers and students are filtered by entity_id from the logged-in user's entity.
 */
export function useCreateHalaqaFormQueries({ includeStudents = true }: UseCreateHalaqaFormQueriesOptions = {}) {
    const entityId = useAuthStore((s) => s.user?.entity?.id);

    const teachersQuery = useQuery({
        queryKey: [...HALAQA_FORM_QUERY_KEYS.teachers, entityId],
        queryFn: () =>
            formFieldsService.getTeachers({
                page: 1,
                per_page: ITEMS_PER_PAGE,
                ...(entityId != null && { entity_id: entityId })
            }),
        staleTime: STALE_TIME_MS,
        enabled: entityId != null,
    });

    const studentsQuery = useQuery({
        queryKey: [...HALAQA_FORM_QUERY_KEYS.students, entityId],
        queryFn: () =>
            formFieldsService.getStudents({
                page: 1,
                per_page: ITEMS_PER_PAGE,
                ...(entityId != null && { entity_id: entityId })
            }),
        staleTime: STALE_TIME_MS,
        enabled: includeStudents && entityId != null,
    });

    const platformsQuery = useQuery({
        queryKey: HALAQA_FORM_QUERY_KEYS.platforms,
        queryFn: () =>
            formFieldsService.getRemotelyAttendancePlatforms({
                page: 1,
                per_page: ITEMS_PER_PAGE,
            }),
        staleTime: STALE_TIME_MS,
    });

    const autoIncludeActivitiesQuery = useQuery({
        queryKey: HALAQA_FORM_QUERY_KEYS.autoIncludeActivities,
        queryFn: getAutoIncludeActivitiesForTahfiz,
        staleTime: STALE_TIME_MS,
    });

    const teachersOptions: SelectRFHOption[] = generateOptions(
        (teachersQuery.data as ListResponse)?.data
    );
    const studentsOptions: SelectRFHOption[] = includeStudents
        ? generateOptions((studentsQuery.data as ListResponse)?.data)
        : [];
    const platformsOptions: SelectRFHOption[] = generateOptions(
        (platformsQuery.data as ListResponse)?.data
    );

    const isLoading =
        teachersQuery.isLoading ||
        (includeStudents && studentsQuery.isLoading) ||
        platformsQuery.isLoading;

    const autoIncludeActivities: HalaqaActivity[] = autoIncludeActivitiesQuery.data ?? [];

    return {
        teachersOptions,
        studentsOptions,
        platformsOptions,
        autoIncludeActivities,
        isLoadingTeachers: teachersQuery.isLoading,
        isLoadingStudents: includeStudents ? studentsQuery.isLoading : false,
        isLoadingPlatforms: platformsQuery.isLoading,
        isLoading,
    };
}
