import { axiosInstance } from '@/api/axiosInstance';

export interface CreateHalaqaPayload {
    name: {
        ar: string;
        en: string;
    };
    teacher_id: number;
    memorization_program_entity_type_id: number;
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
     * Get halaqas list
     */
    getHalaqas: (filters: Record<string, any> = {}): Promise<any> => {
        return axiosInstance.get('/halaqas', { params: filters });
    },

    /**
     * Get halaqa by ID
     */
    getHalaqa: (id: number | string): Promise<any> => {
        return axiosInstance.get(`/halaqas/${id}`);
    }
};

