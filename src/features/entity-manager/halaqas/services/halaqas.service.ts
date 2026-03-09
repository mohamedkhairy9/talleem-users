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
    weekly_holiday?: string;
    evaluation_system_type: 'رقمي' | 'مئوي';
    custom_total_mark?: number;
    max_students: number;
    student_ids?: number[];
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
    activities: Array<'tasbit' | 'hifz' | 'murajaa'>;
    weekly_holiday?: string;
    evaluation_system_type: 'رقمي' | 'مئوي';
    custom_total_mark?: number | null;
    max_students: number;
    session_time: string;
    platform_id?: number;
    teaching_method: 'in_person' | 'remote' | 'hybrid';
}

/**
 * Create Plan Payload
 * POST /halaqas/:id/plans
 * All units send start_verse_key (from local: segments = selected verse key, parts = juz first verse, surahs = surah_id:1).
 * save_or_not: 0 = preview only (200 does NOT mean plan was created; response is used to show plan and open in Mushaf); 1 = actually create plans.
 */
export interface CreatePlanPayload {
    activity: 'hifz' | 'tasbit' | 'murajaa';
    student_ids: number[];
    plan_type: 'daily_amount' | 'start_end';
    unit: 'segments' | 'parts' | 'surahs';
    direction: 'incremental' | 'decremental';
    start_verse_key: string; // All units: "surah:ayah" e.g. "1:1"
    daily_amount?: number; // Required when plan_type is 'daily_amount'
    save_or_not: 0 | 1; // 0 = preview, 1 = save
    // End range only when plan_type is 'start_end' (API may accept end_verse_key or legacy end_* fields)
    end_verse_key?: string;
    end_segment_verse_key?: string;
    end_juz_number?: number;
    end_surah_id?: number;
}

/** Daily schedule item from plan preview/save response */
export interface PlanDailyScheduleItem {
    day: number;
    date: string;
    from_verse_key: string | null;
    to_verse_key: string | null;
    juz_numbers?: number[];
    surah_numbers?: number[];
    from_text?: string;
    to_text?: string;
    text?: string;
}

/** Plan preview/save response data */
export interface CreatePlanResponseData {
    halaqa_id: number;
    activity: string;
    student_ids: number[];
    plan_type: string;
    unit: string;
    direction: string;
    start_verse_key: string;
    end_verse_key: string | null;
    total_segments: number;
    daily_target_segments: number;
    days_needed: number;
    available_study_days: number;
    has_empty_days: boolean;
    warning: string | null;
    computed_last_verse_key: string | null;
    daily_schedule: PlanDailyScheduleItem[];
    students_missing_activity: unknown[];
}

/** Plan API response: preview (save_or_not=0) or save (save_or_not=1) */
export interface CreatePlanResponse {
    preview_only: boolean;
    created_plans_count?: number;
    data: CreatePlanResponseData;
}

/**
 * Check Availability Request Payload
 */
export interface CheckAvailabilityPayload {
    teacher_id: number;
    student_ids?: number[];
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

