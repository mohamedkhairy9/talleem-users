import { axiosInstance } from '@/shared/api/axiosInstance';

export const examConductionService = {
    getTodayExams: () => axiosInstance.get('/teacher/conduct-exams/today'),
    getEvaluationTemplates: (params = {}) => axiosInstance.get('/teacher/conduct-exams/evaluation-templates', {
        params: {
            model_type: 'exams',
            ...params
        }
    }),
    getExamDetail: (id) => axiosInstance.get(`/teacher/conduct-exams/${id}`),
    startStudentExam: (scheduledExamId, studentId, payload) => axiosInstance.post(
        `/teacher/conduct-exams/${scheduledExamId}/students/${studentId}/start`,
        payload
    ),
    submitStudentExam: (scheduledExamId, studentId, payload) => axiosInstance.post(
        `/teacher/conduct-exams/${scheduledExamId}/students/${studentId}/submit`,
        payload
    ),
    getStudentResult: (scheduledExamId, studentId) => axiosInstance.get(
        `/teacher/conduct-exams/${scheduledExamId}/students/${studentId}/result`
    )
};
