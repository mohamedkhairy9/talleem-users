import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherEvaluationsService } from '../services/evaluations.service';
import type {
    ReceivedEvaluationItem,
    GivenEvaluationItem,
    EvaluationTemplate,
    TemplateDetailResponse
} from '../types/evaluations.types';

/**
 * Get evaluations received by the teacher (others evaluate the teacher)
 * GET /teacher/evaluations/received
 */
export function useReceivedEvaluations() {
    const query = useQuery({
        queryKey: ['teacher-evaluations-received'],
        queryFn: () => teacherEvaluationsService.getReceivedEvaluations(),
        staleTime: 2 * 60 * 1000
    });

    const list: ReceivedEvaluationItem[] = Array.isArray(query.data?.data) ? query.data.data : [];

    return {
        ...query,
        list
    };
}

/**
 * Get evaluations given (submitted) by the teacher
 * GET /teacher/evaluations
 */
export function useGivenEvaluations() {
    const query = useQuery({
        queryKey: ['teacher-evaluations-given'],
        queryFn: () => teacherEvaluationsService.getGivenEvaluations(),
        staleTime: 2 * 60 * 1000
    });

    const list: GivenEvaluationItem[] = Array.isArray(query.data?.data) ? query.data.data : [];

    return {
        ...query,
        list
    };
}

/**
 * Get evaluation templates (for create form)
 * GET /teacher/evaluations/templates
 * @param enabled - when false, query does not run (e.g. when modal is closed)
 */
export function useEvaluationTemplates(enabled = true) {
    const query = useQuery({
        queryKey: ['teacher-evaluations-templates'],
        queryFn: () => teacherEvaluationsService.getTemplates(),
        staleTime: 2 * 60 * 1000,
        enabled
    });

    const rawData = query.data as { data?: EvaluationTemplate[] } | undefined;
    const templates: EvaluationTemplate[] = Array.isArray(rawData?.data) ? rawData.data : [];

    return {
        ...query,
        templates
    };
}

/**
 * Get template detail + available entities
 * GET /teacher/evaluations/templates/:id
 */
export function useEvaluationTemplate(id: number | null) {
    const query = useQuery({
        queryKey: ['teacher-evaluations-template', id],
        queryFn: () => teacherEvaluationsService.getTemplateById(id!),
        enabled: id != null && id > 0,
        staleTime: 2 * 60 * 1000
    });

    const detail: TemplateDetailResponse | null = query.data ?? null;

    return {
        ...query,
        detail
    };
}

/**
 * Submit evaluation (POST /teacher/evaluations form-data)
 */
export function useSubmitEvaluation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (formData: FormData) => teacherEvaluationsService.submitEvaluation(formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teacher-evaluations-given'] });
        }
    });
}
