import { axiosInstance } from '@/shared/api/axiosInstance';

const GREGORIAN_REQUEST_CONFIG = {
    headers: {
        'X-Date-Format': 'gregorian'
    }
};

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
    getAvailableTeachers: (data) => axiosInstance.post('/scheduled-exams/available-teachers', data, GREGORIAN_REQUEST_CONFIG),
    getAvailableStudents: (data) => axiosInstance.post('/scheduled-exams/available-students', data, GREGORIAN_REQUEST_CONFIG),
    getScheduledExams: (params = {}) => {
        const queryParams = buildQueryParams(params);
        return axiosInstance.get('/scheduled-exams', {
            params: queryParams
        });
    },
    getScheduledExam: (examId) => axiosInstance.get(`/scheduled-exams/${examId}`),
    updateScheduledExam: (examId, data) => axiosInstance.put(`/scheduled-exams/${examId}`, data, GREGORIAN_REQUEST_CONFIG),
    deleteScheduledExam: (examId) => axiosInstance.delete(`/scheduled-exams/${examId}`),
    createScheduledExam: (data) => axiosInstance.post('/scheduled-exams', data, GREGORIAN_REQUEST_CONFIG)
};
    
