import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores';
import { formFieldsService } from '../services/form-fields.service';
import { getAutoIncludeActivitiesForTahfiz } from '../services/configurations.service';
import { generateOptions } from '../utils/formOptionsUtils';
/** Query keys for create halaqa form lists (include entity_id so cache is per entity) */
export const HALAQA_FORM_QUERY_KEYS = {
    teachers: ['halaqa-form', 'teachers'],
    students: ['halaqa-form', 'students'],
    currentEntity: ['halaqa-form', 'current-entity'],
    platforms: ['halaqa-form', 'platforms'],
    memorizationProgramEntityTypes: ['halaqa-form', 'memorization-program-entity-types'],
    autoIncludeActivities: ['halaqa-form', 'configurations', 'tahfiz', 'auto_include_activities'],
};
const FORM_OPTIONS_PER_PAGE = 1000;
const STALE_TIME_MS = 2 * 60 * 1000;
/**
 * Fetches form-level options for halaqa forms.
 * Teachers and students are filtered by entity_id from the logged-in user's entity.
 */
export function useCreateHalaqaFormQueries({ includeStudents = true } = {}) {
    const entityId = useAuthStore((s) => s.user?.entity?.id);
    const currentEntityQuery = useQuery({
        queryKey: [...HALAQA_FORM_QUERY_KEYS.currentEntity, entityId],
        queryFn: () => formFieldsService.getEntities({
            entity_id: entityId,
            page: 1,
            per_page: 1,
        }),
        staleTime: STALE_TIME_MS,
        enabled: entityId != null,
    });
    const teachersQuery = useQuery({
        queryKey: [...HALAQA_FORM_QUERY_KEYS.teachers, entityId],
        queryFn: () => formFieldsService.getTeachers({
            page: 1,
            per_page: FORM_OPTIONS_PER_PAGE,
            ...(entityId != null && { entity_id: entityId })
        }),
        staleTime: STALE_TIME_MS,
        enabled: entityId != null,
    });
    const studentsQuery = useQuery({
        queryKey: [...HALAQA_FORM_QUERY_KEYS.students, entityId],
        queryFn: () => formFieldsService.getStudents({
            page: 1,
            per_page: FORM_OPTIONS_PER_PAGE,
            ...(entityId != null && { entity_id: entityId })
        }),
        staleTime: STALE_TIME_MS,
        enabled: includeStudents && entityId != null,
    });
    const platformsQuery = useQuery({
        queryKey: HALAQA_FORM_QUERY_KEYS.platforms,
        queryFn: () => formFieldsService.getRemotelyAttendancePlatforms({
            page: 1,
            per_page: FORM_OPTIONS_PER_PAGE,
        }),
        staleTime: STALE_TIME_MS,
    });
    const memorizationProgramEntityTypesQuery = useQuery({
        queryKey: HALAQA_FORM_QUERY_KEYS.memorizationProgramEntityTypes,
        queryFn: () => formFieldsService.getMemorizationProgramEntityTypes({
            page: 1,
            per_page: FORM_OPTIONS_PER_PAGE,
        }),
        staleTime: STALE_TIME_MS,
    });
    const autoIncludeActivitiesQuery = useQuery({
        queryKey: HALAQA_FORM_QUERY_KEYS.autoIncludeActivities,
        queryFn: getAutoIncludeActivitiesForTahfiz,
        staleTime: STALE_TIME_MS,
    });
    const teachersOptions = generateOptions(teachersQuery.data?.data);
    const teachersList = Array.isArray(teachersQuery.data?.data) ? teachersQuery.data.data : [];
    const studentsList = includeStudents && Array.isArray(studentsQuery.data?.data)
        ? studentsQuery.data.data
        : [];
    const studentsOptions = includeStudents
        ? generateOptions(studentsList)
        : [];
    const platformsOptions = generateOptions(platformsQuery.data?.data);
    const memorizationProgramEntityTypeOptions = generateOptions(memorizationProgramEntityTypesQuery.data?.data);
    const currentEntityList = Array.isArray(currentEntityQuery.data?.data) ? currentEntityQuery.data.data : [];
    const currentEntity = currentEntityList.find((item) => item?.id === entityId) ?? currentEntityList[0] ?? null;
    const isLoading = teachersQuery.isLoading ||
        (includeStudents && studentsQuery.isLoading) ||
        platformsQuery.isLoading ||
        memorizationProgramEntityTypesQuery.isLoading;
    const autoIncludeActivities = autoIncludeActivitiesQuery.data ?? [];
    return {
        teachersOptions,
        teachersList,
        studentsOptions,
        studentsList,
        platformsOptions,
        memorizationProgramEntityTypeOptions,
        currentEntity,
        autoIncludeActivities,
        isLoadingCurrentEntity: currentEntityQuery.isLoading,
        isLoadingTeachers: teachersQuery.isLoading,
        isLoadingStudents: includeStudents ? studentsQuery.isLoading : false,
        isLoadingPlatforms: platformsQuery.isLoading,
        isLoadingMemorizationProgramEntityTypes: memorizationProgramEntityTypesQuery.isLoading,
        isLoading,
    };
}
