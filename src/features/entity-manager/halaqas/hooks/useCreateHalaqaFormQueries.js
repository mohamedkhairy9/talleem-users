import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores';
import { formFieldsService } from '../services/form-fields.service';
import { getAutoIncludeActivitiesForTahfiz } from '../services/configurations.service';
import { generateOptions } from '../utils/formOptionsUtils';
/** Query keys for create halaqa form lists (include entity_id so cache is per entity) */
export const HALAQA_FORM_QUERY_KEYS = {
    teachers: ['halaqa-form', 'teachers'],
    students: ['halaqa-form', 'students'],
    platforms: ['halaqa-form', 'platforms'],
    autoIncludeActivities: ['halaqa-form', 'configurations', 'tahfiz', 'auto_include_activities'],
};
const ITEMS_PER_PAGE = 10;
const STALE_TIME_MS = 2 * 60 * 1000;
/**
 * Fetches form-level options for halaqa forms.
 * Teachers and students are filtered by entity_id from the logged-in user's entity.
 */
export function useCreateHalaqaFormQueries({ includeStudents = true } = {}) {
    const entityId = useAuthStore((s) => s.user?.entity?.id);
    const teachersQuery = useQuery({
        queryKey: [...HALAQA_FORM_QUERY_KEYS.teachers, entityId],
        queryFn: () => formFieldsService.getTeachers({
            page: 1,
            per_page: ITEMS_PER_PAGE,
            ...(entityId != null && { entity_id: entityId })
        }),
        staleTime: STALE_TIME_MS,
        enabled: entityId != null,
    });
    const studentsQuery = useQuery({
        queryKey: [...HALAQA_FORM_QUERY_KEYS.students, entityId],
        queryFn: () => formFieldsService.getStudents({
            page: 1,
            per_page: ITEMS_PER_PAGE,
            ...(entityId != null && { entity_id: entityId })
        }),
        staleTime: STALE_TIME_MS,
        enabled: includeStudents && entityId != null,
    });
    const platformsQuery = useQuery({
        queryKey: HALAQA_FORM_QUERY_KEYS.platforms,
        queryFn: () => formFieldsService.getRemotelyAttendancePlatforms({
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
    const teachersOptions = generateOptions(teachersQuery.data?.data);
    const studentsOptions = includeStudents
        ? generateOptions(studentsQuery.data?.data)
        : [];
    const platformsOptions = generateOptions(platformsQuery.data?.data);
    const isLoading = teachersQuery.isLoading ||
        (includeStudents && studentsQuery.isLoading) ||
        platformsQuery.isLoading;
    const autoIncludeActivities = autoIncludeActivitiesQuery.data ?? [];
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
