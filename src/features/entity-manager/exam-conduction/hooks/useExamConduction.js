import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDateFormatStore } from '@/app/stores/dateFormat.store';
import { examConductionService } from '../services/exam-conduction.service';
import {
    getExamTimeAfterSessionForTahfiz,
    getExamTimeBeforeSessionForTahfiz
} from '@/features/entity-manager/halaqas/services/configurations.service';

const TODAY_EXAMS_QUERY_KEY = ['exam-conduction', 'today'];
const EXAM_DETAIL_QUERY_KEY = ['exam-conduction', 'detail'];
const EVALUATION_TEMPLATES_QUERY_KEY = ['exam-conduction', 'evaluation-templates'];
const EXAM_RESULT_QUERY_KEY = ['exam-conduction', 'result'];
const EXAM_SESSION_WINDOW_CONFIG_QUERY_KEY = ['exam-conduction', 'configurations', 'tahfiz', 'session-window'];
const STALE_TIME_MS = 2 * 60 * 1000;

function extractArray(response) {
    if (Array.isArray(response?.data)) {
        return response.data;
    }

    if (Array.isArray(response?.data?.data)) {
        return response.data.data;
    }

    if (Array.isArray(response)) {
        return response;
    }

    return [];
}

function extractEntity(response) {
    if (response?.data && !Array.isArray(response.data)) {
        if (response.data?.data && !Array.isArray(response.data.data)) {
            return response.data.data;
        }

        return response.data;
    }

    return response ?? null;
}

function normalizeEvaluationTemplate(template) {
    if (!template || typeof template !== 'object') {
        return null;
    }

    return {
        id: template?.id ?? null,
        name: template?.name ?? null,
        total_grade: template?.total_grade ?? null,
        passing_grade: template?.passing_grade ?? null,
        evaluation_system: template?.evaluation_system ?? null,
        criteria: Array.isArray(template?.criteria)
            ? template.criteria.map((criteriaItem) => ({
                id: criteriaItem?.id ?? criteriaItem?.criteria_id ?? null,
                criteria_name: criteriaItem?.criteria_name ?? criteriaItem?.name ?? null,
                degree: criteriaItem?.degree ?? criteriaItem?.max_degree ?? null
            }))
            : []
    };
}

export function useTodayConductExams(options) {
    const dateFormat = useDateFormatStore((state) => state.dateFormat);

    const query = useQuery({
        queryKey: [...TODAY_EXAMS_QUERY_KEY, dateFormat],
        queryFn: () => examConductionService.getTodayExams(),
        enabled: options?.enabled !== false,
        staleTime: STALE_TIME_MS
    });

    return {
        ...query,
        list: extractArray(query.data),
        refresh: query.refetch
    };
}

export function useConductExamEvaluationTemplates(options) {
    const query = useQuery({
        queryKey: EVALUATION_TEMPLATES_QUERY_KEY,
        queryFn: () => examConductionService.getEvaluationTemplates(),
        enabled: options?.enabled !== false,
        staleTime: STALE_TIME_MS
    });

    return {
        ...query,
        templates: extractArray(query.data)
            .map(normalizeEvaluationTemplate)
            .filter(Boolean)
    };
}

export function useConductExamSessionWindowConfig(options = {}) {
    const beforeSessionQuery = useQuery({
        queryKey: [...EXAM_SESSION_WINDOW_CONFIG_QUERY_KEY, 'before'],
        queryFn: getExamTimeBeforeSessionForTahfiz,
        enabled: options?.enabled !== false,
        staleTime: STALE_TIME_MS
    });

    const afterSessionQuery = useQuery({
        queryKey: [...EXAM_SESSION_WINDOW_CONFIG_QUERY_KEY, 'after'],
        queryFn: getExamTimeAfterSessionForTahfiz,
        enabled: options?.enabled !== false,
        staleTime: STALE_TIME_MS
    });

    return {
        beforeMinutes: beforeSessionQuery.data ?? 0,
        afterMinutes: afterSessionQuery.data ?? 0,
        isLoading: Boolean(beforeSessionQuery.isLoading || afterSessionQuery.isLoading),
        error: beforeSessionQuery.error ?? afterSessionQuery.error ?? null
    };
}

export function useConductExamDetail(id, options) {
    const dateFormat = useDateFormatStore((state) => state.dateFormat);

    const query = useQuery({
        queryKey: [...EXAM_DETAIL_QUERY_KEY, id, dateFormat],
        queryFn: () => examConductionService.getExamDetail(id),
        enabled: Boolean(id) && options?.enabled !== false,
        staleTime: STALE_TIME_MS
    });

    return {
        ...query,
        exam: extractEntity(query.data)
    };
}

export function useStudentExamResult(scheduledExamId, studentId, options) {
    const dateFormat = useDateFormatStore((state) => state.dateFormat);

    const query = useQuery({
        queryKey: [...EXAM_RESULT_QUERY_KEY, scheduledExamId, studentId, dateFormat],
        queryFn: () => examConductionService.getStudentResult(scheduledExamId, studentId),
        enabled: Boolean(scheduledExamId) && Boolean(studentId) && options?.enabled !== false,
        staleTime: STALE_TIME_MS
    });

    return {
        ...query,
        result: extractEntity(query.data)
    };
}

export function useStudentExamResultsMap(scheduledExamId, students = [], options = {}) {
    const dateFormat = useDateFormatStore((state) => state.dateFormat);
    const studentIds = Array.isArray(students)
        ? students
            .map((student) => student?.id ?? student?.student_id)
            .filter(Boolean)
        : [];

    const queries = useQueries({
        queries: studentIds.map((studentId) => ({
            queryKey: [...EXAM_RESULT_QUERY_KEY, scheduledExamId, studentId, dateFormat, 'summary'],
            queryFn: () => examConductionService.getStudentResult(scheduledExamId, studentId),
            enabled: Boolean(scheduledExamId) && Boolean(studentId) && options.enabled !== false,
            staleTime: STALE_TIME_MS,
            retry: false
        }))
    });

    const resultsMap = studentIds.reduce((accumulator, studentId, index) => {
        const query = queries[index];
        const result = extractEntity(query?.data);
        const status = result?.status ?? null;
        const notFound = query?.error?.status === 404;

        accumulator[studentId] = {
            result,
            status,
            notFound,
            hasResult: Boolean(result?.id),
            isCompleted: status === 'completed',
            isLoading: Boolean(query?.isLoading || query?.isFetching),
            error: notFound ? null : (query?.error ?? null)
        };

        return accumulator;
    }, {});

    return {
        queries,
        resultsMap,
        isLoading: queries.some((query) => query.isLoading || query.isFetching),
        error: queries.find((query) => query.error && query.error.status !== 404)?.error ?? null
    };
}

export function useStartStudentExam() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ scheduledExamId, studentId, payload }) => (
            examConductionService.startStudentExam(scheduledExamId, studentId, payload)
        ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TODAY_EXAMS_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: EXAM_DETAIL_QUERY_KEY });
        }
    });
}

export function useSubmitStudentExam() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ scheduledExamId, studentId, payload }) => (
            examConductionService.submitStudentExam(scheduledExamId, studentId, payload)
        ),
        onSuccess: (_response, variables) => {
            queryClient.invalidateQueries({ queryKey: TODAY_EXAMS_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: EXAM_DETAIL_QUERY_KEY });
            queryClient.invalidateQueries({
                queryKey: [...EXAM_RESULT_QUERY_KEY, variables?.scheduledExamId, variables?.studentId]
            });
        }
    });
}
