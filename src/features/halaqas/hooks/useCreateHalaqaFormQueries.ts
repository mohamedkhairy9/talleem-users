import { useQuery } from '@tanstack/react-query';
import { formFieldsService } from '../services/form-fields.service';
import { generateOptions } from '../utils/formOptionsUtils';
import type { SelectRFHOption } from '@/globals/components/ui/SelectRFH';

/** Query keys for create halaqa form lists (same pattern as Tallem useQuery at form level) */
export const HALAQA_FORM_QUERY_KEYS = {
    teachers: ['halaqa-form', 'teachers'] as const,
    students: ['halaqa-form', 'students'] as const,
    platforms: ['halaqa-form', 'platforms'] as const,
    memorizationProgramEntityTypes: ['halaqa-form', 'memorization-program-entity-types'] as const,
} as const;

const ITEMS_PER_PAGE = 200;
const STALE_TIME_MS = 2 * 60 * 1000;

/** API list response shape: { data: Item[] } */
type ListResponse = { data?: Record<string, unknown>[] };

/**
 * Fetches form-level options for create halaqa (teachers, students, platforms, memorization types).
 * Same pattern as Tallem: useQuery per list at form level, then pass options + loading to SelectRFH.
 */
export function useCreateHalaqaFormQueries() {
    const teachersQuery = useQuery({
        queryKey: HALAQA_FORM_QUERY_KEYS.teachers,
        queryFn: () =>
            formFieldsService.getTeachers({ page: 1, per_page: ITEMS_PER_PAGE }),
        staleTime: STALE_TIME_MS,
    });

    const studentsQuery = useQuery({
        queryKey: HALAQA_FORM_QUERY_KEYS.students,
        queryFn: () =>
            formFieldsService.getStudents({ page: 1, per_page: ITEMS_PER_PAGE }),
        staleTime: STALE_TIME_MS,
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

    const memorizationTypesQuery = useQuery({
        queryKey: HALAQA_FORM_QUERY_KEYS.memorizationProgramEntityTypes,
        queryFn: () =>
            formFieldsService.getMemorizationProgramEntityTypes({
                page: 1,
                per_page: ITEMS_PER_PAGE,
            }),
        staleTime: STALE_TIME_MS,
    });

    const teachersOptions: SelectRFHOption[] = generateOptions(
        (teachersQuery.data as ListResponse)?.data
    );
    const studentsOptions: SelectRFHOption[] = generateOptions(
        (studentsQuery.data as ListResponse)?.data
    );
    const platformsOptions: SelectRFHOption[] = generateOptions(
        (platformsQuery.data as ListResponse)?.data
    );
    const memorizationTypesOptions: SelectRFHOption[] = generateOptions(
        (memorizationTypesQuery.data as ListResponse)?.data
    );

    const isLoading =
        teachersQuery.isLoading ||
        studentsQuery.isLoading ||
        platformsQuery.isLoading ||
        memorizationTypesQuery.isLoading;

    return {
        teachersOptions,
        studentsOptions,
        platformsOptions,
        memorizationTypesOptions,
        isLoadingTeachers: teachersQuery.isLoading,
        isLoadingStudents: studentsQuery.isLoading,
        isLoadingPlatforms: platformsQuery.isLoading,
        isLoadingMemorizationTypes: memorizationTypesQuery.isLoading,
        isLoading,
    };
}
