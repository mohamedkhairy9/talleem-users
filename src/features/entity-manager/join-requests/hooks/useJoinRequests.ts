import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { joinRequestsService } from '../services/join-requests.service';
import type { JoinRequestsListParams, ProcessStepPayload } from '../types/join-requests.types';

const QUERY_KEY = ['join-requests'] as const;

export function useJoinRequests(params: JoinRequestsListParams = {}, options?: { enabled?: boolean }) {
    const query = useQuery({
        queryKey: [...QUERY_KEY, params],
        queryFn: () => joinRequestsService.getJoinRequests(params),
        enabled: options?.enabled !== false,
        staleTime: 2 * 60 * 1000
    });

    const responseBody = query.data as { data?: unknown[]; meta?: { total?: number } } | undefined;
    const list = Array.isArray(responseBody?.data) ? responseBody.data : [];
    const meta = responseBody?.meta;

    return {
        ...query,
        list,
        meta,
        refresh: query.refetch
    };
}

export function useProcessJoinRequestStep() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: ProcessStepPayload }) =>
            joinRequestsService.processStep(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        }
    });
}
