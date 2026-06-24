import { axiosInstance } from '@/shared/api/axiosInstance';

export const scheduledExamsService = {
    createScheduledExam: (data) => axiosInstance.post('/scheduled-exams', data)
};
    