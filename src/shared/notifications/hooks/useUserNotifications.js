import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import userNotificationsService from '../services/user-notifications.service';

const QUERY_KEY = ['user-notifications'];

const isRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

const extractNotificationList = (responseBody) => {
    if (Array.isArray(responseBody)) {
        return responseBody;
    }

    if (!isRecord(responseBody)) {
        return [];
    }

    const directCandidates = [
        responseBody.data,
        responseBody.notifications,
        responseBody.items,
        responseBody.results,
        responseBody.rows
    ];

    for (const candidate of directCandidates) {
        if (Array.isArray(candidate)) {
            return candidate;
        }
    }

    const nestedData = responseBody.data;
    if (isRecord(nestedData)) {
        const nestedCandidates = [
            nestedData.data,
            nestedData.notifications,
            nestedData.items,
            nestedData.results,
            nestedData.rows
        ];

        for (const candidate of nestedCandidates) {
            if (Array.isArray(candidate)) {
                return candidate;
            }
        }
    }

    return [];
};

const isNotificationRead = (notification) => Boolean(
    notification?.is_read ||
    notification?.read ||
    notification?.read_at ||
    notification?.seen_at ||
    notification?.status === 'read'
);

const extractUnreadCount = (responseBody, list) => {
    const directCount = responseBody?.unread_count ??
        responseBody?.unreadCount ??
        responseBody?.meta?.unread_count ??
        responseBody?.meta?.unreadCount ??
        responseBody?.data?.unread_count ??
        responseBody?.data?.unreadCount ??
        responseBody?.data?.meta?.unread_count ??
        responseBody?.data?.meta?.unreadCount;

    if (typeof directCount === 'number') {
        return directCount;
    }

    return list.filter((notification) => !isNotificationRead(notification)).length;
};

export function useUserNotifications(options = {}) {
    const query = useQuery({
        queryKey: QUERY_KEY,
        queryFn: () => userNotificationsService.getUserNotifications(),
        staleTime: options.staleTime ?? 30 * 1000,
        refetchInterval: options.refetchInterval ?? 60 * 1000,
        refetchOnWindowFocus: true
    });

    const list = extractNotificationList(query.data);
    const unreadCount = extractUnreadCount(query.data, list);

    return {
        ...query,
        list,
        unreadCount,
        refresh: query.refetch
    };
}

export function useMarkUserNotificationAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => userNotificationsService.markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        }
    });
}

export function useMarkAllUserNotificationsAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => userNotificationsService.markAllAsRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        }
    });
}

export { isNotificationRead };
