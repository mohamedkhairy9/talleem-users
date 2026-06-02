import { useQuery } from '@tanstack/react-query';
import { registrationService } from '../services/registration.service';
import { useTranslation } from 'react-i18next';
/**
 * Map field keys to their corresponding service methods
 */
const getFieldEndpoint = (fieldKey, params) => {
    switch (fieldKey) {
        case 'city_id':
            return registrationService.getCities();
        case 'neighborhood_id':
            return registrationService.getNeighborhoods(params);
        case 'branch_id':
            return registrationService.getBranches();
        case 'main_program_id':
            return registrationService.getMainPrograms();
        case 'session_mode_id':
            return registrationService.getSessionModes();
        case 'nationality_id':
            return registrationService.getNationalities();
        case 'major_id':
            return registrationService.getMajors();
        case 'academic_qualification_id':
            return registrationService.getAcademicQualifications();
        case 'remotely-attendance-platforms':
            return registrationService.getRemotelyAttendancePlatforms();
        case 'memorization_program_entity_type_id':
            return registrationService.getMemorizationProgramEntityTypes();
        default:
            throw new Error(`Unknown field key: ${fieldKey}`);
    }
};
/**
 * Hook to get options for a form field
 */
export const useFormFieldOptions = (fieldKey, enabled = true, params) => {
    const { i18n } = useTranslation();
    const currentLang = i18n.language || 'ar';
    const query = useQuery({
        queryKey: ['formFieldOptions', fieldKey, params],
        queryFn: () => getFieldEndpoint(fieldKey, params),
        enabled: enabled,
        staleTime: 5 * 60 * 1000 // 5 minutes
    });
    // Transform options to SelectOption format
    const options = [];
    if (query.data?.data) {
        query.data.data.forEach((item) => {
            let label = '';
            const value = item.id || item.value || '';
            // Handle bilingual names
            if (typeof item.name === 'object' && item.name !== null) {
                label = currentLang === 'ar' && item.name.ar ? item.name.ar : (item.name.en || '');
            }
            else if (item.name) {
                label = String(item.name);
            }
            else if (item.label) {
                label = String(item.label);
            }
            else {
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
