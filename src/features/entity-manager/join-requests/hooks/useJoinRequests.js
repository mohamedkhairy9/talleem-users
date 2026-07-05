import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { joinRequestsService } from '../services/join-requests.service';
const QUERY_KEY = ['join-requests'];
export function useJoinRequests(params = {}, options) {
    const query = useQuery({
        queryKey: [...QUERY_KEY, params],
        queryFn: () => joinRequestsService.getJoinRequests(params),
        enabled: options?.enabled !== false,
        staleTime: 2 * 60 * 1000
    });
    const responseBody = query.data;
    const list = Array.isArray(responseBody?.data) ? responseBody.data : [];
    const meta = responseBody?.meta;
    return {
        ...query,
        list,
        meta,
        refresh: query.refetch
    };
}

export function useJoinRequestDetail(id, options) {
    const query = useQuery({
        queryKey: [...QUERY_KEY, 'detail', id],
        queryFn: () => joinRequestsService.getJoinRequest(id),
        enabled: Boolean(id) && options?.enabled !== false,
        staleTime: 2 * 60 * 1000
    });

    const responseBody = query.data;
    const firstLevel = responseBody?.data && !Array.isArray(responseBody.data)
        ? responseBody.data
        : null;
    const secondLevel = firstLevel?.data && !Array.isArray(firstLevel.data)
        ? firstLevel.data
        : null;
    const request = secondLevel ?? firstLevel ?? responseBody ?? null;

    return {
        ...query,
        request
    };
}

export function useProcessJoinRequestStep() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => joinRequestsService.processStep(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        }
    });
}
