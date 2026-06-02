import { axiosInstance } from '@/api/axiosInstance';
/**
 * Form Fields Service
 * Handles API calls for form field options (teachers, students, platforms, etc.)
 */
export const formFieldsService = {
    /**
     * Get teachers list (paginated)
     * entity_id: filter by entity (from logged-in user's entity)
     */
    getTeachers: (params = {}) => {
        return axiosInstance.get('/teachers', { params });
    },
    /**
     * Get students list (paginated)
     * entity_id: filter by entity (from logged-in user's entity)
     */
    getStudents: (params = {}) => {
        return axiosInstance.get('/students', { params });
    },
    /**
     * Get platforms list (paginated) - generic platforms endpoint
     */
    getPlatforms: (params = {}) => {
        return axiosInstance.get('/platforms', { params });
    },
    /**
     * Get remotely-attendance platforms list (for create halaqa form)
     */
    getRemotelyAttendancePlatforms: (params = {}) => {
        return axiosInstance.get('/remotely-attendance-platforms', { params });
    },
    /**
     * Get memorization program entity types list (paginated)
     */
    getMemorizationProgramEntityTypes: (params = {}) => {
        return axiosInstance.get('/memorization-program-entity-types', { params });
    }
};
