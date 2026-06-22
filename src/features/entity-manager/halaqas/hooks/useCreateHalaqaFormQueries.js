import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores';
import { formFieldsService } from '../services/form-fields.service';
import {
    getAutoIncludeActivitiesForTahfiz,
    getEditableEvaluationSystemForTahfiz,
    getEditableMaxStudentsForTahfiz,
    getEditableWeeklyHolidayForTahfiz,
    getMaxStudentsPerHalaqaForTahfiz,
    getWeeklyHolidayForTahfiz,
    getTotalMarkForTahfiz
} from '../services/configurations.service';
import { generateOptions } from '../utils/formOptionsUtils';
/** Query keys for create halaqa form lists (include entity_id so cache is per entity) */
export const HALAQA_FORM_QUERY_KEYS = {
    teachers: ['halaqa-form', 'teachers'],
    students: ['halaqa-form', 'students'],
    currentEntity: ['halaqa-form', 'current-entity'],
    platforms: ['halaqa-form', 'platforms'],
    autoIncludeActivities: ['halaqa-form', 'configurations', 'tahfiz', 'auto_include_activities'],
    totalMark: ['halaqa-form', 'configurations', 'tahfiz', 'total_mark'],
    editableEvaluationSystem: ['halaqa-form', 'configurations', 'tahfiz', 'editable_evaluation_system'],
    maxStudentsPerHalaqa: ['halaqa-form', 'configurations', 'tahfiz', 'max_students_per_halaqa'],
    editableMaxStudents: ['halaqa-form', 'configurations', 'tahfiz', 'editable_max_students'],
    weeklyHoliday: ['halaqa-form', 'configurations', 'tahfiz', 'weekly_holiday'],
    editableWeeklyHoliday: ['halaqa-form', 'configurations', 'tahfiz', 'editable_weekly_holiday'],
};
const FORM_OPTIONS_PER_PAGE = 1000;
const STALE_TIME_MS = 2 * 60 * 1000;
/**
 * Fetches form-level options for halaqa forms.
 * Teachers and students are filtered by entity_id from the logged-in user's entity.
 */
export function useCreateHalaqaFormQueries({
    includeStudents = true,
    useAvailability = false,
    availabilityParams = null
} = {}) {
    const actingEntityId = useAuthStore((s) => s.actingEntityId);
    const fallbackEntityId = useAuthStore((s) => s.user?.entity?.id);
    const entityId = actingEntityId ?? fallbackEntityId;
    const hasAvailabilityParams = Boolean(
        availabilityParams?.start_date &&
        availabilityParams?.end_date &&
        availabilityParams?.period &&
        availabilityParams?.session_time
    );
    const currentEntityQuery = useQuery({
        queryKey: [...HALAQA_FORM_QUERY_KEYS.currentEntity, entityId],
        queryFn: () => formFieldsService.getMyEntities({
            page: 1,
            per_page: 1000,
        }),
        staleTime: STALE_TIME_MS,
        enabled: entityId != null,
    });
    const teachersQuery = useQuery({
        queryKey: [
            ...HALAQA_FORM_QUERY_KEYS.teachers,
            useAvailability ? availabilityParams : entityId
        ],
        queryFn: () => useAvailability
            ? formFieldsService.getAvailableTeachers(availabilityParams)
            : formFieldsService.getTeachers({
                page: 1,
                per_page: FORM_OPTIONS_PER_PAGE,
                ...(entityId != null && { entity_id: entityId })
            }),
        staleTime: STALE_TIME_MS,
        enabled: useAvailability ? hasAvailabilityParams : entityId != null,
    });
    const studentsQuery = useQuery({
        queryKey: [
            ...HALAQA_FORM_QUERY_KEYS.students,
            useAvailability ? availabilityParams : entityId
        ],
        queryFn: () => useAvailability
            ? formFieldsService.getAvailableStudents(availabilityParams)
            : formFieldsService.getStudents({
                page: 1,
                per_page: FORM_OPTIONS_PER_PAGE,
                ...(entityId != null && { entity_id: entityId })
            }),
        staleTime: STALE_TIME_MS,
        enabled: includeStudents && (useAvailability ? hasAvailabilityParams : entityId != null),
    });
    const platformsQuery = useQuery({
        queryKey: HALAQA_FORM_QUERY_KEYS.platforms,
        queryFn: () => formFieldsService.getRemotelyAttendancePlatforms({
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
    const totalMarkQuery = useQuery({
        queryKey: HALAQA_FORM_QUERY_KEYS.totalMark,
        queryFn: getTotalMarkForTahfiz,
        staleTime: STALE_TIME_MS,
    });
    const editableEvaluationSystemQuery = useQuery({
        queryKey: HALAQA_FORM_QUERY_KEYS.editableEvaluationSystem,
        queryFn: getEditableEvaluationSystemForTahfiz,
        staleTime: STALE_TIME_MS,
    });
    const maxStudentsPerHalaqaQuery = useQuery({
        queryKey: HALAQA_FORM_QUERY_KEYS.maxStudentsPerHalaqa,
        queryFn: getMaxStudentsPerHalaqaForTahfiz,
        staleTime: STALE_TIME_MS,
    });
    const editableMaxStudentsQuery = useQuery({
        queryKey: HALAQA_FORM_QUERY_KEYS.editableMaxStudents,
        queryFn: getEditableMaxStudentsForTahfiz,
        staleTime: STALE_TIME_MS,
    });
    const weeklyHolidayQuery = useQuery({
        queryKey: HALAQA_FORM_QUERY_KEYS.weeklyHoliday,
        queryFn: getWeeklyHolidayForTahfiz,
        staleTime: STALE_TIME_MS,
    });
    const editableWeeklyHolidayQuery = useQuery({
        queryKey: HALAQA_FORM_QUERY_KEYS.editableWeeklyHoliday,
        queryFn: getEditableWeeklyHolidayForTahfiz,
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
    const currentEntityList = Array.isArray(currentEntityQuery.data?.data) ? currentEntityQuery.data.data : [];
    const currentEntity = currentEntityList.find((item) => item?.id === entityId) ?? currentEntityList[0] ?? null;
    const isLoading = teachersQuery.isLoading ||
        (includeStudents && studentsQuery.isLoading) ||
        platformsQuery.isLoading;
    const autoIncludeActivities = autoIncludeActivitiesQuery.data ?? [];
    const totalMark = totalMarkQuery.data ?? null;
    const editableEvaluationSystem = editableEvaluationSystemQuery.data ?? false;
    const maxStudentsPerHalaqa = maxStudentsPerHalaqaQuery.data ?? null;
    const editableMaxStudents = editableMaxStudentsQuery.data ?? false;
    const weeklyHoliday = weeklyHolidayQuery.data ?? [];
    const editableWeeklyHoliday = editableWeeklyHolidayQuery.data ?? false;
    return {
        teachersOptions,
        teachersList,
        studentsOptions,
        studentsList,
        platformsOptions,
        currentEntity,
        autoIncludeActivities,
        totalMark,
        editableEvaluationSystem,
        maxStudentsPerHalaqa,
        editableMaxStudents,
        weeklyHoliday,
        editableWeeklyHoliday,
        isLoadingCurrentEntity: currentEntityQuery.isLoading,
        isLoadingTeachers: teachersQuery.isLoading,
        isLoadingStudents: includeStudents ? studentsQuery.isLoading : false,
        isLoadingPlatforms: platformsQuery.isLoading,
        isLoadingConfigurations: autoIncludeActivitiesQuery.isLoading ||
            totalMarkQuery.isLoading ||
            editableEvaluationSystemQuery.isLoading ||
            maxStudentsPerHalaqaQuery.isLoading ||
            editableMaxStudentsQuery.isLoading ||
            weeklyHolidayQuery.isLoading ||
            editableWeeklyHolidayQuery.isLoading,
        isLoading,
    };
}
