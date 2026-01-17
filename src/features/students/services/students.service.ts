import { axiosInstance } from '@/api/axiosInstance';

/**
 * Students Service
 * Feature-specific API service for students
 */
export const studentsService = {
    /**
     * Get students list
     */
    getStudents: (filters: Record<string, any> = {}): Promise<any> => {
        return axiosInstance.get('/students', { params: filters });
    },

    /**
     * Get student by ID
     */
    getStudent: (id: number | string): Promise<any> => {
        return axiosInstance.get(`/students/${id}`);
    },

    /**
     * Create student
     */
    createStudent: (data: any): Promise<any> => {
        return axiosInstance.post('/students', data);
    },

    /**
     * Update student
     */
    updateStudent: (id: number | string, data: any): Promise<any> => {
        return axiosInstance.put(`/students/${id}`, data);
    },

    /**
     * Delete student
     */
    deleteStudent: (id: number | string): Promise<void> => {
        return axiosInstance.delete(`/students/${id}`);
    }
};
