import { axiosInstance } from '@/api/axiosInstance';
import { registrationService } from '@/features/auth/services/registration.service';

export interface SelectOption {
    id: number | string;
    name?: string | { ar?: string; en?: string };
    label?: string;
    value?: number | string;
    [key: string]: any;
}

/**
 * Form Fields Service for Warnings
 * Handles API calls for form field options
 */
export const warningsFormFieldsService = {
    /**
     * Get branches (reuse from registration service)
     */
    getBranches: (): Promise<{ data: SelectOption[] }> => {
        return registrationService.getBranches();
    },

    /**
     * Get programs
     */
    getPrograms: (params?: { branch_id?: number }): Promise<{ data: SelectOption[] }> => {
        return axiosInstance.get('/programs', { params });
    },

    /**
     * Get students (for student warnings)
     */
    getStudents: (params?: { branch_id?: number; program_id?: number; search?: string }): Promise<{
        data: SelectOption[];
        meta?: { current_page?: number; last_page?: number; total?: number };
    }> => {
        return axiosInstance.get('/students', { params });
    },

    /**
     * Get teachers (for teacher warnings)
     */
    getTeachers: (params?: { branch_id?: number; program_id?: number; search?: string }): Promise<{
        data: SelectOption[];
        meta?: { current_page?: number; last_page?: number; total?: number };
    }> => {
        return axiosInstance.get('/teachers', { params });
    },

    /**
     * Get entities (for entity warnings)
     */
    getEntities: (params?: { branch_id?: number; program_id?: number; search?: string }): Promise<{
        data: SelectOption[];
        meta?: { current_page?: number; last_page?: number; total?: number };
    }> => {
        return axiosInstance.get('/entities', { params });
    }
};

