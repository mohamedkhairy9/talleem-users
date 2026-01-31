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
    platform_id: number;
    teaching_method: 'in_person' | 'remote' | 'hybrid';
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
     */
    updateHalaqa: (id: number | string, data: Partial<CreateHalaqaPayload>): Promise<any> => {
        return axiosInstance.put(`/halaqas/${id}`, data);
    },

    /**
     * Delete halaqa
     */
    deleteHalaqa: (id: number | string): Promise<void> => {
        return axiosInstance.delete(`/halaqas/${id}`);
    }
};

