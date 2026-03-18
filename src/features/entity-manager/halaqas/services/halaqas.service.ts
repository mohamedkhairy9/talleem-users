import { axiosInstance } from '@/api/axiosInstance';
import { HALAQAS_LIST_PATH } from '../constants/list.constants';
import type { HalaqasListParams, HalaqasListResponse } from '../types/list.types';
import type { CreateHalaqaPayload, UpdateHalaqaPayload, CreatePlanPayload, CreatePlanResponse, CheckAvailabilityPayload, CheckAvailabilityResponse } from '../types';

/** Build query params object (strip undefined, keep only defined filters). */
function buildListQueryParams(params: HalaqasListParams): Record<string, string | number> {
    const result: Record<string, string | number> = {};
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
            // API expects halaqa_page instead of generic page for halaqa list
            const apiKey = key === 'page' ? 'halaqa_page' : key;
            result[apiKey] = value as string | number;
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
    createHalaqa: (data: CreateHalaqaPayload): Promise<any> => {
        return axiosInstance.post('/halaqas', data);
    },

    /**
     * Get halaqas list (paginated, with optional filters)
     */
    getHalaqas: (params: HalaqasListParams = {}): Promise<{ data: HalaqasListResponse }> => {
        const queryParams = buildListQueryParams(params);
        return axiosInstance.get(HALAQAS_LIST_PATH, { params: queryParams });
    },

    /**
     * Get halaqa by ID
     */
    getHalaqa: (id: number | string): Promise<any> => {
        return axiosInstance.get(`/halaqas/${id}`);
    },

    /**
     * Update halaqa
     * Only allows updating: name, teacher_id, period, start_date, end_date, activities, student_ids
     */
    updateHalaqa: (id: number | string, data: UpdateHalaqaPayload): Promise<any> => {
        return axiosInstance.put(`/halaqas/${id}`, data);
    },

    /**
     * Delete halaqa
     */
    deleteHalaqa: (id: number | string): Promise<void> => {
        return axiosInstance.delete(`/halaqas/${id}`);
    },

    /**
     * Create plan for a halaqa
     * POST /halaqas/:id/plans
     */
    createPlan: (halaqaId: number | string, data: CreatePlanPayload): Promise<{ data: CreatePlanResponse }> => {
        return axiosInstance.post(`/halaqas/${halaqaId}/plans`, data);
    },

    /**
     * Check availability for halaqa creation
     * POST /halaqas/check-availability
     * Note: Axios interceptor returns response.data directly, so this returns CheckAvailabilityResponse
     */
    checkAvailability: (data: CheckAvailabilityPayload): Promise<CheckAvailabilityResponse> => {
        return axiosInstance.post('/halaqas/check-availability', data);
    }
};

