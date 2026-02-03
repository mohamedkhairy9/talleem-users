import { useQuery } from '@tanstack/react-query';
import { registrationService } from '../services/registration.service';
import { useTranslation } from 'react-i18next';

/**
 * Hook to fetch all form field options for registration form
 * Similar to useApiCalls in Tallem project
 */
export const useRegistrationFormOptions = () => {
    const { i18n } = useTranslation();
    const currentLang = i18n.language || 'en';

    // Fetch all options in parallel
    const branchesQuery = useQuery({
        queryKey: ['formOptions', 'branches'],
        queryFn: () => registrationService.getBranches(),
        staleTime: 5 * 60 * 1000
    });

    const mainProgramsQuery = useQuery({
        queryKey: ['formOptions', 'main-programs'],
        queryFn: () => registrationService.getMainPrograms(),
        staleTime: 5 * 60 * 1000
    });

    const sessionModesQuery = useQuery({
        queryKey: ['formOptions', 'session-modes'],
        queryFn: () => registrationService.getSessionModes(),
        staleTime: 5 * 60 * 1000
    });

    const nationalitiesQuery = useQuery({
        queryKey: ['formOptions', 'nationalities'],
        queryFn: () => registrationService.getNationalities(),
        staleTime: 5 * 60 * 1000
    });

    const majorsQuery = useQuery({
        queryKey: ['formOptions', 'majors'],
        queryFn: () => registrationService.getMajors(),
        staleTime: 5 * 60 * 1000
    });

    const academicQualificationsQuery = useQuery({
        queryKey: ['formOptions', 'academic-qualifications'],
        queryFn: () => registrationService.getAcademicQualifications(),
        staleTime: 5 * 60 * 1000
    });

    const remotelyAttendancePlatformsQuery = useQuery({
        queryKey: ['formOptions', 'remotely-attendance-platforms'],
        queryFn: () => registrationService.getRemotelyAttendancePlatforms(),
        staleTime: 5 * 60 * 1000
    });

    const memorizationProgramEntityTypesQuery = useQuery({
        queryKey: ['formOptions', 'memorization-program-entity-types'],
        queryFn: () => registrationService.getMemorizationProgramEntityTypes(),
        staleTime: 5 * 60 * 1000
    });

    // Transform options to SelectOption format
    const transformOptions = (data: any[]): Array<{ value: string | number; label: string }> => {
        if (!data) return [];
        return data.map((item: any) => {
            let label = '';
            const value = item.id || item.value || '';

            // Handle bilingual names
            if (typeof item.name === 'object' && item.name !== null) {
                label = currentLang === 'ar' && item.name.ar ? item.name.ar : (item.name.en || '');
            } else if (item.name) {
                label = String(item.name);
            } else if (item.label) {
                label = String(item.label);
            } else {
                label = String(value);
            }

            return { value, label };
        });
    };

    return {
        branch_id: transformOptions(branchesQuery.data?.data || []),
        main_program_id: transformOptions(mainProgramsQuery.data?.data || []),
        session_mode_id: transformOptions(sessionModesQuery.data?.data || []),
        nationality_id: transformOptions(nationalitiesQuery.data?.data || []),
        major_id: transformOptions(majorsQuery.data?.data || []),
        academic_qualification_id: transformOptions(academicQualificationsQuery.data?.data || []),
        'remotely-attendance-platforms': transformOptions(remotelyAttendancePlatformsQuery.data?.data || []),
        memorization_program_entity_type_id: transformOptions(memorizationProgramEntityTypesQuery.data?.data || []),
        isLoading: branchesQuery.isLoading || mainProgramsQuery.isLoading || sessionModesQuery.isLoading || 
                   nationalitiesQuery.isLoading || majorsQuery.isLoading || academicQualificationsQuery.isLoading ||
                   remotelyAttendancePlatformsQuery.isLoading || memorizationProgramEntityTypesQuery.isLoading,
        // Raw data for accessing nested properties (like branch.city)
        rawBranches: branchesQuery.data?.data || []
    };
};

/**
 * Hook to fetch neighborhoods with city_id filter
 */
export const useNeighborhoodsOptions = (cityId: number | string | null | undefined) => {
    const { i18n } = useTranslation();
    const currentLang = i18n.language || 'en';

    const query = useQuery({
        queryKey: ['formOptions', 'neighborhoods', cityId],
        queryFn: () => registrationService.getNeighborhoods(cityId ? { city_id: cityId } : undefined),
        enabled: !!cityId,
        staleTime: 5 * 60 * 1000
    });

    const transformOptions = (data: any[]): Array<{ value: string | number; label: string }> => {
        if (!data) return [];
        return data.map((item: any) => {
            let label = '';
            const value = item.id || item.value || '';

            if (typeof item.name === 'object' && item.name !== null) {
                label = currentLang === 'ar' && item.name.ar ? item.name.ar : (item.name.en || '');
            } else if (item.name) {
                label = String(item.name);
            } else if (item.label) {
                label = String(item.label);
            } else {
                label = String(value);
            }

            return { value, label };
        });
    };

    return {
        neighborhood_id: transformOptions(query.data?.data || []),
        isLoading: query.isLoading
    };
};






