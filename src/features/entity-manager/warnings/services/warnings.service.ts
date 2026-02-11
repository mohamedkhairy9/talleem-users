import { axiosInstance } from '@/api/axiosInstance';

export interface WarningReason {
    id: number;
    name: {
        en: string;
        ar: string;
    };
    main_program: {
        id: number;
        name: {
            en: string;
            ar: string;
        };
        code: number;
        status: boolean;
    };
    status: boolean;
    created_at: string;
    updated_at: string;
}

export interface WarningResponse {
    id: number;
    branch: {
        id: number;
        name: {
            en: string;
            ar: string;
        };
        city_id: number;
        neighborhood_id: number;
        code: number;
        status: boolean;
        created_at: string;
        updated_at: string;
    };
    program: {
        id: number;
        name: {
            en: string;
            ar: string;
        };
        code: number;
        status: boolean;
        created_at: string;
        updated_at: string;
    };
    entity: any | null;
    student: any | null;
    teacher: any | null;
    warning_reason: WarningReason;
    warning_type: 'student' | 'teacher' | 'entity';
    date: string;
    note: string;
    status: boolean;
    created_by: {
        id: number;
        name: {
            en: string;
            ar: string;
        };
    };
    updated_by: any | null;
    created_at: string;
    updated_at: string;
}

export interface WarningsListResponse {
    data: WarningResponse[];
    meta: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
    };
}

export interface WarningReasonsResponse {
    data: WarningReason[];
    meta: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
    };
}

export interface CreateWarningPayload {
    branch_id: number;
    program_id: number;
    entity_id?: number | null;
    student_id?: number | null;
    teacher_id?: number | null;
    warning_reason_id: number;
    warning_type: 'student' | 'teacher' | 'entity';
    date: string;
    note: string;
    status: boolean;
}

export interface UpdateWarningPayload extends CreateWarningPayload {}

export interface WarningDetailResponse {
    data: WarningResponse;
}

export interface WarningsListParams {
    page?: number;
    per_page?: number;
    search?: string;
    warning_type?: 'student' | 'teacher' | 'entity';
    branch_id?: number;
    program_id?: number;
    status?: boolean;
}

/**
 * Build query params object (strip undefined, keep only defined filters)
 */
function buildListQueryParams(params: WarningsListParams): Record<string, string | number | boolean> {
    const result: Record<string, string | number | boolean> = {};
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
            result[key] = value as string | number | boolean;
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
    getWarnings: (params: WarningsListParams = {}): Promise<WarningsListResponse> => {
        const queryParams = buildListQueryParams(params);
        return axiosInstance.get('/warnings', { params: queryParams });
    },

    /**
     * Get warning reasons by main_program_id
     */
    getWarningReasons: (mainProgramId: number): Promise<WarningReasonsResponse> => {
        return axiosInstance.get('/warning-reasons', {
            params: { main_program_id: mainProgramId }
        });
    },

    /**
     * Create a new warning
     */
    createWarning: (data: CreateWarningPayload): Promise<any> => {
        return axiosInstance.post('/warnings', data);
    },

    /**
     * Get a single warning by ID
     */
    getWarning: (id: number): Promise<WarningDetailResponse> => {
        return axiosInstance.get(`/warnings/${id}`);
    },

    /**
     * Update a warning by ID
     */
    updateWarning: (id: number, data: UpdateWarningPayload): Promise<any> => {
        return axiosInstance.put(`/warnings/${id}`, data);
    },

    /**
     * Delete a warning by ID
     */
    deleteWarning: (id: number): Promise<any> => {
        return axiosInstance.delete(`/warnings/${id}`);
    }
};

