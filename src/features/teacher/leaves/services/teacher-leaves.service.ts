import { axiosInstance } from '@/api/axiosInstance';
import type { TeacherLeavesListResponse } from '../types/teacher-leaves.types';

export const teacherLeavesService = {
    getTeacherLeaves: (): Promise<TeacherLeavesListResponse> => {
        return axiosInstance.get('/teacher/leaves');
    },
    createLeave: (formData: FormData): Promise<{ success: boolean; data?: unknown }> => {
        return axiosInstance.post('/teacher/leaves', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    cancelLeave: (id: number): Promise<{ success: boolean }> => {
        return axiosInstance.post(`/teacher/leaves/${id}/cancel`);
    }
};
