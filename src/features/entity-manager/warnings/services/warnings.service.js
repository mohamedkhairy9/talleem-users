import { axiosInstance } from '@/api/axiosInstance';
/**
 * Build query params object (strip undefined, keep only defined filters)
 */
function buildListQueryParams(params) {
    const result = {};
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
            result[key] = value;
        }
    });
    return result;
}
/**
 * Warnings Service
 */
export const warningsService = {
    /**
     * Get warnings list (paginated, with optional filters)
     */
    getWarnings: (params = {}) => {
        const queryParams = buildListQueryParams(params);
        return axiosInstance.get('/warnings', { params: queryParams });
    },
    /**
     * Get warning reasons by main_program_id
     */
    getWarningReasons: (mainProgramId) => {
        return axiosInstance.get('/warning-reasons', {
            params: { main_program_id: mainProgramId }
        });
    },
    /**
     * Create a new warning
     */
    createWarning: (data) => {
        return axiosInstance.post('/warnings', data);
    },
    /**
     * Get a single warning by ID
     */
    getWarning: (id) => {
        return axiosInstance.get(`/warnings/${id}`);
    },
    /**
     * Update a warning by ID
     */
    updateWarning: (id, data) => {
        return axiosInstance.put(`/warnings/${id}`, data);
    },
    /**
     * Delete a warning by ID
     */
    deleteWarning: (id) => {
        return axiosInstance.delete(`/warnings/${id}`);
    }
};
