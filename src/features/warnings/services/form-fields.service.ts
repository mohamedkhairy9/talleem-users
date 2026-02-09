import { axiosInstance } from '@/api/axiosInstance';

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
     * Get students (for student warnings)
     */
    getStudents: (params?: { branch_id?: number; main_program_id?: number; entity_id?: number; search?: string; page?: number; per_page?: number }): Promise<{
        data: SelectOption[];
        meta?: { current_page?: number; last_page?: number; total?: number; per_page?: number };
    }> => {
        return axiosInstance.get('/students', { params });
    },

    /**
     * Get teachers (for teacher warnings)
     */
    getTeachers: (params?: { branch_id?: number; main_program_id?: number; entity_id?: number; search?: string; page?: number; per_page?: number }): Promise<{
        data: SelectOption[];
        meta?: { current_page?: number; last_page?: number; total?: number; per_page?: number };
    }> => {
        return axiosInstance.get('/teachers', { params });
    },

    /**
     * Get entities (for entity warnings)
     */
    getEntities: (params?: { branch_id?: number; main_program_id?: number; search?: string; page?: number; per_page?: number }): Promise<{
        data: SelectOption[];
        meta?: { current_page?: number; last_page?: number; total?: number; per_page?: number };
    }> => {
        return axiosInstance.get('/entities', { params });
    }
};


