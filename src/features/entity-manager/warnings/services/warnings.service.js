import { axiosInstance } from '@/shared/api/axiosInstance';
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
     * Get incoming warnings for the current entity manager context.
     * The shared axios instance automatically sends auth and acting-context headers.
     */
    getIncomingWarnings: (params = {}) => {
        const queryParams = buildListQueryParams(params);
        return axiosInstance.get('/entity-manager/warnings/incoming', { params: queryParams });
    },
    /**
     * Get issued warnings for the current entity manager context.
     * The shared axios instance automatically sends auth and acting-context headers.
     */
    getIssuedWarnings: (params = {}) => {
        const queryParams = buildListQueryParams(params);
        return axiosInstance.get('/entity-manager/warnings/issued', { params: queryParams });
    },
    /**
     * Create an issued warning for the current entity manager context.
     */
    createIssuedWarning: (data) => {
        return axiosInstance.post('/entity-manager/warnings/issued', data);
    },
    /**
     * Get warning reasons by main_program_id
     */
    getWarningReasons: () => {
        return axiosInstance.get('/warning-reasons');
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
        return axiosInstance.put(
            `/entity-manager/warnings/issued/${id}`,
            data
        );
    },
    /**
     * Delete an issued warning by ID
     */
    deleteIssuedWarning: (id) => {
        return axiosInstance.delete(`/entity-manager/warnings/issued/${id}`);
    }
};
