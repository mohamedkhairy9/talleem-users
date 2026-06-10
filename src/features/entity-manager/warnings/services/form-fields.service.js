import { axiosInstance } from '@/shared/api/axiosInstance';
/**
 * Form Fields Service for Warnings
 * Handles API calls for form field options
 */
export const warningsFormFieldsService = {
    /**
     * Get students (for student warnings)
     */
    getStudents: (params) => {
        return axiosInstance.get('/entity-manager/mirror/students', { params });
    },
    /**
     * Get teachers (for teacher warnings)
     */
    getTeachers: (params) => {
        return axiosInstance.get('/entity-manager/mirror/teachers', { params });
    },
    /**
     * Get entities (for entity warnings)
     */
    getEntities: (params) => {
        return axiosInstance.get('/entities', { params });
    }
};
