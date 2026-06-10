import { axiosInstance } from '@/shared/api/axiosInstance';
/**
 * Teacher Evaluations Service
 * Received: GET /teacher/evaluations/received
 * Given: GET /teacher/evaluations, POST /teacher/evaluations (form-data)
 * Templates: GET /teacher/evaluations/templates, GET /teacher/evaluations/templates/:id
 */
export const teacherEvaluationsService = {
    /**
     * Get evaluations received by the teacher (others evaluate the teacher)
     * GET /teacher/evaluations/received
     */
    getReceivedEvaluations: () => {
        return axiosInstance.get('/teacher/evaluations/received');
    },
    /**
     * Get evaluations given (submitted) by the teacher
     * GET /teacher/evaluations
     */
    getGivenEvaluations: () => {
        return axiosInstance.get('/teacher/evaluations');
    },
    /**
     * Get evaluation templates (for creating an evaluation)
     * GET /teacher/evaluations/templates
     */
    getTemplates: () => {
        return axiosInstance.get('/teacher/evaluations/templates');
    },
    /**
     * Get template detail + available entities to evaluate
     * GET /teacher/evaluations/templates/:id
     */
    getTemplateById: (id) => {
        return axiosInstance.get(`/teacher/evaluations/templates/${id}`);
    },
    /**
     * Submit an evaluation (form-data)
     * POST /teacher/evaluations
     */
    submitEvaluation: (formData) => {
        return axiosInstance.post('/teacher/evaluations', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
};
