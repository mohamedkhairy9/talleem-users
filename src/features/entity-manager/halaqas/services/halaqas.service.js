import { axiosInstance } from '@/shared/api/axiosInstance';
import { HALAQAS_LIST_PATH } from '../constants/list.constants';
/** Build query params object (strip undefined, keep only defined filters). */
function buildListQueryParams(params) {
    const result = {};
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
            result[key] = value;
            // Keep halaqa_page as a compatibility fallback for older backends.
            if (key === 'page') {
                result.halaqa_page = value;
            }
        }
    });
    return result;
}
/**
 * Halaqas Service
 */
export const halaqasService = {
    /**
     * Create a new halaqa
     */
    createHalaqa: (data) => {
        return axiosInstance.post('/halaqas', data);
    },
    /**
     * Get halaqas list (paginated, with optional filters)
     */
    getHalaqas: (params = {}) => {
        const queryParams = buildListQueryParams(params);
        console.log('Halaqa list request debug:', {
            endpoint: HALAQAS_LIST_PATH,
            params,
            queryParams
        });
        return axiosInstance.get(HALAQAS_LIST_PATH, { params: queryParams });
    },
    /**
     * Get halaqa by ID
     */
    getHalaqa: (id) => {
        return axiosInstance.get(`/halaqas/${id}`);
    },
    /**
     * Update halaqa
     * Only allows updating: name, teacher_id, period, start_date, end_date, activities, student_ids
     */
    updateHalaqa: (id, data) => {
        return axiosInstance.put(`/halaqas/${id}`, data);
    },
    /**
     * Delete halaqa
     */
    deleteHalaqa: (id) => {
        return axiosInstance.delete(`/halaqas/${id}`);
    },
    /**
     * Create plan for a halaqa
     * POST /halaqas/:id/plans
     */
    createPlan: (halaqaId, data) => {
        return axiosInstance.post(`/halaqas/${halaqaId}/plans`, data);
    },
    /**
     * Join a student to a halaqa after the halaqa has already started
     * POST /halaqas/:id/students/join
     */
    joinStudent: (halaqaId, data) => {
        return axiosInstance.post(`/halaqas/${halaqaId}/students/join`, data);
    },
    /**
     * Check availability for halaqa creation
     * POST /halaqas/check-availability
     * Note: Axios interceptor returns response.data directly, so this returns CheckAvailabilityResponse
     */
    checkAvailability: (data) => {
        return axiosInstance.post('/halaqas/check-availability', data);
    }
};
