import { axiosInstance } from '@/api/axiosInstance';
import { HALAQAS_LIST_PATH } from '../constants/list.constants';
import type { HalaqasListParams, HalaqasListResponse } from '../types/list.types';

/** Build query params object (strip undefined, keep only defined filters) */
function buildListQueryParams(params: HalaqasListParams): Record<string, string | number> {
    const result: Record<string, string | number> = {};
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
            result[key] = value as string | number;
        }
    });
    return result;
}

export interface CreateHalaqaPayload {
    name: {
        ar: string;
        en: string;
    };
    teacher_id: number;
    memorization_program_entity_type_id: number; // Set from entity (auth store)
    session_mode_id?: number; // Set from entity (auth store) if API expects it
    period: 'morning' | 'evening';
    start_date: string;
    end_date: string;
    activities: Array<'tasbit' | 'hifz' | 'murajaa'>;
    student_ids: number[];
    session_time: string;
    platform_id?: number;
    teaching_method: 'in_person' | 'remote' | 'hybrid';
}

/**
 * Update Halaqa Payload
 * Only these fields can be updated via PUT /halaqas/:id
 */
export interface UpdateHalaqaPayload {
    name: {
        ar: string;
        en: string;
    };
    teacher_id: number;
    period: 'morning' | 'evening';
    start_date: string;
    end_date: string;
    activities: Array<'tasbit' | 'hifz' | 'murajaa'>;
    student_ids: number[];
}

/**
 * Create Plan Payload
 * POST /halaqas/:id/plans
 */
export interface CreatePlanPayload {
    activity: 'hifz' | 'tasbit' | 'murajaa';
    student_id: number;
    plan_type: 'daily_amount' | 'start_end';
    unit: 'segments' | 'parts' | 'surahs';
    direction: 'incremental' | 'decremental';
    daily_amount: number;
    // Conditional fields based on unit
    start_segment_id?: number; // Required when unit is 'segments'
    start_juz_number?: number; // Required when unit is 'parts'
    start_surah_id?: number; // Required when unit is 'surahs'
    end_segment_id?: number; // Required when unit is 'segments' and plan_type is 'start_end'
}

/**
 * Check Availability Request Payload
 */
export interface CheckAvailabilityPayload {
    teacher_id: number;
    student_ids: number[];
    start_date: string;
    end_date: string;
    period: 'morning' | 'evening';
    session_time: string; // Format: "HH:MM-HH:MM"
}

/**
 * Check Availability Response
 */
export interface CheckAvailabilityResponse {
    has_conflict: boolean;
    conflicts: {
        teacher: { ar: string; en: string } | null;
        students: Array<{ ar: string; en: string }>;
    };
    generated_schedule: Array<{
        day: string;
        from: string;
        to: string;
    }>;
    message: string;
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
     * GET {baseURL}/halaqas → e.g. http://localhost:5173/api/front/halaqas
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
    createPlan: (halaqaId: number | string, data: CreatePlanPayload): Promise<any> => {
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

