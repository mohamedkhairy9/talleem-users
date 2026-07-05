import { useQuery } from '@tanstack/react-query';
import { accountManagementService } from '../services/account-management.service';

const STALE_TIME_MS = 2 * 60 * 1000;
const QUERY_KEY = ['account-management'];

function extractListAndMeta(responseBody) {
    const nestedResponseBody = responseBody?.data && !Array.isArray(responseBody.data)
        ? responseBody.data
        : null;

    const list = Array.isArray(responseBody?.data)
        ? responseBody.data
        : Array.isArray(nestedResponseBody?.data)
            ? nestedResponseBody.data
            : Array.isArray(responseBody)
                ? responseBody
                : [];

    const meta = responseBody?.meta ??
        nestedResponseBody?.meta ??
        responseBody?.pagination ??
        nestedResponseBody?.pagination ??
        null;

    return { list, meta };
}

function extractDataPayload(responseBody) {
    const firstLevel = responseBody?.data && !Array.isArray(responseBody.data)
        ? responseBody.data
        : null;
    const secondLevel = firstLevel?.data != null
        ? firstLevel.data
        : null;

    return secondLevel ?? firstLevel ?? responseBody ?? null;
}

export function useAccountManagement(accountType = 'teacher', params = {}, options) {
    const query = useQuery({
        queryKey: [...QUERY_KEY, accountType, params],
        queryFn: () => accountManagementService.getAccounts(accountType, params),
        enabled: options?.enabled !== false,
        staleTime: STALE_TIME_MS
    });

    const { list, meta } = extractListAndMeta(query.data);

    return {
        ...query,
        list,
        meta,
        refresh: query.refetch
    };
}

export function useAccountManagementSection(accountType = 'student', accountId, sectionKey = 'profile', options) {
    const query = useQuery({
        queryKey: [...QUERY_KEY, 'detail', accountType, accountId, sectionKey],
        queryFn: () => {
            if (accountType === 'student') {
                return accountManagementService.getStudentSection(accountId, sectionKey);
            }

            if (accountType === 'teacher') {
                return accountManagementService.getTeacherSection(accountId, sectionKey);
            }

            throw new Error('Unsupported account type.');
        },
        enabled: Boolean(accountId) && options?.enabled !== false,
        staleTime: STALE_TIME_MS
    });

    return {
        ...query,
        payload: extractDataPayload(query.data)
    };
}

export function useTeacherStudentNestedSection(teacherId, halaqaId, studentId, sectionKey = 'plan', options) {
    const query = useQuery({
        queryKey: [...QUERY_KEY, 'teacher-nested', teacherId, halaqaId, studentId, sectionKey],
        queryFn: () => accountManagementService.getTeacherStudentNestedSection(teacherId, halaqaId, studentId, sectionKey),
        enabled: Boolean(teacherId) && Boolean(halaqaId) && Boolean(studentId) && options?.enabled !== false,
        staleTime: STALE_TIME_MS
    });

    return {
        ...query,
        payload: extractDataPayload(query.data)
    };
}
