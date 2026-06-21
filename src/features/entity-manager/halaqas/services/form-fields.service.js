import { axiosInstance } from '@/shared/api/axiosInstance';
/**
 * Form Fields Service
 * Handles API calls for form field options (teachers, students, platforms, etc.)
 */
export const formFieldsService = {
    /**
     * Get teachers available for the requested halaqa schedule.
     */
    getAvailableTeachers: (data) => {
        return axiosInstance.post('/halaqas/available-teachers', data);
    },
    /**
     * Get teachers list (paginated)
     * entity_id: filter by entity (from logged-in user's entity)
     */
    getTeachers: (params = {}) => {
        return axiosInstance.get('/teachers', { params });
    },
    /**
     * Get students available for the requested halaqa schedule.
     */
    getAvailableStudents: (data) => {
        return axiosInstance.post('/halaqas/available-students', data);
    },
    /**
     * Get students list (paginated)
     * entity_id: filter by entity (from logged-in user's entity)
     */
    getStudents: (params = {}) => {
        return axiosInstance.get('/students', { params });
    },
    /**
     * Get the entities available to the current authenticated user.
     */
    getMyEntities: (params = {}) => {
        return axiosInstance.get('/my-entities', { params });
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
};
