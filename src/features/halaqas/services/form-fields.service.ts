import { axiosInstance } from '@/api/axiosInstance';

export interface Teacher {
    id: number;
    name?: string;
    email?: string;
    [key: string]: any;
}

export interface Student {
    id: number;
    name?: string;
    email?: string;
    [key: string]: any;
}

export interface Platform {
    id: number;
    name?: string;
    [key: string]: any;
}

export interface MemorizationProgramEntityType {
    id: number;
    name?: string;
    [key: string]: any;
}

/**
 * Form Fields Service
 * Handles API calls for form field options (teachers, students, platforms, etc.)
 */
export const formFieldsService = {
    /**
     * Get teachers list (paginated)
     */
    getTeachers: (params: { page?: number; per_page?: number; search?: string } = {}): Promise<{
        data: Teacher[];
        meta?: { current_page?: number; last_page?: number; total?: number };
    }> => {
        return axiosInstance.get('/teachers', { params });
    },

    /**
     * Get students list (paginated)
     */
    getStudents: (params: { page?: number; per_page?: number; search?: string } = {}): Promise<{
        data: Student[];
        meta?: { current_page?: number; last_page?: number; total?: number };
    }> => {
        return axiosInstance.get('/students', { params });
    },

    /**
     * Get platforms list (paginated)
     */
    getPlatforms: (params: { page?: number; per_page?: number; search?: string } = {}): Promise<{
        data: Platform[];
        meta?: { current_page?: number; last_page?: number; total?: number };
    }> => {
        return axiosInstance.get('/platforms', { params });
    },

    /**
     * Get memorization program entity types list (paginated)
     */
    getMemorizationProgramEntityTypes: (params: { page?: number; per_page?: number; search?: string } = {}): Promise<{
        data: MemorizationProgramEntityType[];
        meta?: { current_page?: number; last_page?: number; total?: number };
    }> => {
        return axiosInstance.get('/memorization-program-entity-types', { params });
    }
};

