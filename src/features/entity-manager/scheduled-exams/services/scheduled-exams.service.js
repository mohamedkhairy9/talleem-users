import { axiosInstance } from '@/shared/api/axiosInstance';

function buildQueryParams(params = {}) {
    const result = {};

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
            result[key] = value;
        }
    });

    return result;
}

export const scheduledExamsService = {
    getRequiredExamSegments: (params = {}) => {
        const queryParams = buildQueryParams(params);
        return axiosInstance.get('/required-exam-segments', { params: queryParams });
    },
    getScheduledExams: (params = {}) => {
        const queryParams = buildQueryParams(params);
        return axiosInstance.get('/scheduled-exams', {
            params: queryParams,
            ...(queryParams.exam_date && {
                headers: {
                    'X-Date-Format': 'gregorian'
                }
            })
        });
    },
    getScheduledExam: (examId) => axiosInstance.get(`/scheduled-exams/${examId}`),
    updateScheduledExam: (examId, data) => axiosInstance.put(`/scheduled-exams/${examId}`, data),
    deleteScheduledExam: (examId) => axiosInstance.delete(`/scheduled-exams/${examId}`),
    createScheduledExam: (data) => axiosInstance.post('/scheduled-exams', data)
};
    
