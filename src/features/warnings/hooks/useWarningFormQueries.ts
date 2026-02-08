import { useQuery } from '@tanstack/react-query';
import { warningsFormFieldsService } from '../services/form-fields.service';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores';

/**
 * Hook to fetch form field options for warning form
 */
export const useWarningFormQueries = (filters: {
    branchId?: number | null;
    programId?: number | null;
    warningType?: 'student' | 'teacher' | 'entity' | null;
} = {}) => {
    const { i18n } = useTranslation();
    const currentLang = i18n.language || 'en';
    const entity = useAuthStore((s) => s.user?.entity);
    const mainProgramId = entity?.main_program?.id;

    // Fetch branches
    const branchesQuery = useQuery({
        queryKey: ['warning-form-options', 'branches'],
        queryFn: () => warningsFormFieldsService.getBranches(),
        staleTime: 5 * 60 * 1000
    });

    // Fetch programs (filtered by branch if selected)
    const programsQuery = useQuery({
        queryKey: ['warning-form-options', 'programs', filters.branchId],
        queryFn: () => warningsFormFieldsService.getPrograms({ branch_id: filters.branchId! }),
        enabled: !!filters.branchId,
        staleTime: 5 * 60 * 1000
    });

    // Fetch students (only if warning type is 'student')
    const studentsQuery = useQuery({
        queryKey: ['warning-form-options', 'students', filters.branchId, filters.programId],
        queryFn: () => warningsFormFieldsService.getStudents({
            branch_id: filters.branchId!,
            program_id: filters.programId!
        }),
        enabled: filters.warningType === 'student' && !!filters.branchId && !!filters.programId,
        staleTime: 5 * 60 * 1000
    });

    // Fetch teachers (only if warning type is 'teacher')
    const teachersQuery = useQuery({
        queryKey: ['warning-form-options', 'teachers', filters.branchId, filters.programId],
        queryFn: () => warningsFormFieldsService.getTeachers({
            branch_id: filters.branchId!,
            program_id: filters.programId!
        }),
        enabled: filters.warningType === 'teacher' && !!filters.branchId && !!filters.programId,
        staleTime: 5 * 60 * 1000
    });

    // Fetch entities (only if warning type is 'entity')
    const entitiesQuery = useQuery({
        queryKey: ['warning-form-options', 'entities', filters.branchId, filters.programId],
        queryFn: () => warningsFormFieldsService.getEntities({
            branch_id: filters.branchId!,
            program_id: filters.programId!
        }),
        enabled: filters.warningType === 'entity' && !!filters.branchId && !!filters.programId,
        staleTime: 5 * 60 * 1000
    });

    // Helper to transform options to React Select format
    const transformOptions = (items: any[] = []): Array<{ value: number; label: string }> => {
        return items.map((item) => {
            const id = item.id || item.value;
            let label = '';
            if (typeof item.name === 'string') {
                label = item.name;
            } else if (item.name && typeof item.name === 'object') {
                label = currentLang === 'ar' && item.name.ar ? item.name.ar : (item.name.en || '');
            } else if (item.label) {
                label = item.label;
            } else {
                label = String(id);
            }
            return { value: id, label };
        });
    };

    return {
        branchesOptions: transformOptions(branchesQuery.data?.data || []),
        programsOptions: transformOptions(programsQuery.data?.data || []),
        studentsOptions: transformOptions(studentsQuery.data?.data || []),
        teachersOptions: transformOptions(teachersQuery.data?.data || []),
        entitiesOptions: transformOptions(entitiesQuery.data?.data || []),
        isLoadingBranches: branchesQuery.isLoading,
        isLoadingPrograms: programsQuery.isLoading,
        isLoadingStudents: studentsQuery.isLoading,
        isLoadingTeachers: teachersQuery.isLoading,
        isLoadingEntities: entitiesQuery.isLoading,
        mainProgramId
    };
};

