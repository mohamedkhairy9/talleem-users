import { axiosInstance } from '@/shared/api/axiosInstance';
export const teacherLeavesService = {
    getTeacherLeaves: () => {
        return axiosInstance.get('/teacher/leaves');
    },
    createLeave: (formData) => {
        return axiosInstance.post('/teacher/leaves', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    cancelLeave: (id) => {
        return axiosInstance.post(`/teacher/leaves/${id}/cancel`);
    }
};
