import { useQuery } from '@tanstack/react-query';
import { registrationService, SelectOption } from '../services/registration.service';
import { useTranslation } from 'react-i18next';

/**
 * Map field keys to their corresponding API endpoints
 */
const FIELD_ENDPOINT_MAP: Record<string, () => Promise<{ data: SelectOption[] }>> = {
    neighborhood_id: (params?: { city_id?: number | string }) => registrationService.getNeighborhoods(params),
    branch_id: () => registrationService.getBranches(),
    session_mode_id: () => registrationService.getSessionModes(),
    nationality_id: () => registrationService.getNationalities(),
    major_id: () => registrationService.getMajors(),
    academic_qualification_id: () => registrationService.getAcademicQualifications(),
    'remotely-attendance-platforms': () => registrationService.getRemotelyAttendancePlatforms(),
    memorization_program_entity_type_id: () => registrationService.getMemorizationProgramEntityTypes()
};

/**
 * Hook to get options for a form field
 */
export const useFormFieldOptions = (
    fieldKey: string,
    enabled: boolean = true,
    params?: { city_id?: number | string }
) => {
    const { i18n } = useTranslation();
    const currentLang = i18n.language || 'en';

    const query = useQuery({
        queryKey: ['formFieldOptions', fieldKey, params],
        queryFn: () => getFieldEndpoint(fieldKey, params),
        enabled: enabled,
        staleTime: 5 * 60 * 1000 // 5 minutes
    });

    // Transform options to SelectOption format
    const options: Array<{ value: string | number; label: string }> = [];
    
    if (query.data?.data) {
        query.data.data.forEach((item: SelectOption) => {
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

            if (value !== '' && value !== null && value !== undefined) {
                options.push({ value, label });
            }
        });
    }

    return {
        options,
        isLoading: query.isLoading,
        error: query.error
    };
};

