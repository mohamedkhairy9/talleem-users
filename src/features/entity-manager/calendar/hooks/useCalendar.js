import { useQueries, useQuery } from '@tanstack/react-query';
import { useDateFormatStore } from '@/app/stores/dateFormat.store';
import entityManagerCalendarService from '../services/calendar.service';

const QUERY_KEY = ['entity-manager-calendar'];

const isRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

const extractCalendarPayload = (responseBody) => {
    if (!isRecord(responseBody)) {
        return {};
    }

    if (isRecord(responseBody.data)) {
        if (isRecord(responseBody.data.data)) {
            return responseBody.data.data;
        }

        return responseBody.data;
    }

    return responseBody;
};

const extractCalendarItems = (responseBody) => {
    const payload = extractCalendarPayload(responseBody);

    if (Array.isArray(payload?.home_items)) {
        return payload.home_items;
    }

    if (Array.isArray(responseBody)) {
        return responseBody;
    }

    if (!isRecord(responseBody)) {
        return [];
    }

    const directCandidates = [
        responseBody.data,
        responseBody.halaqas,
        responseBody.calendar,
        responseBody.events,
        responseBody.items,
        responseBody.rows
    ];

    for (const candidate of directCandidates) {
        if (Array.isArray(candidate)) {
            return candidate;
        }
    }

    if (isRecord(responseBody.data)) {
        const nestedCandidates = [
            responseBody.data.data,
            responseBody.data.halaqas,
            responseBody.data.calendar,
            responseBody.data.events,
            responseBody.data.items,
            responseBody.data.rows
        ];

        for (const candidate of nestedCandidates) {
            if (Array.isArray(candidate)) {
                return candidate;
            }
        }
    }

    return [];
};

export function useEntityManagerCalendar(date, options = {}) {
    const dateFormat = useDateFormatStore((state) => state.dateFormat);

    const query = useQuery({
        queryKey: [...QUERY_KEY, date || 'today', dateFormat],
        queryFn: () => entityManagerCalendarService.getCalendar(date ? { date } : {}),
        staleTime: 2 * 60 * 1000,
        enabled: options.enabled !== false
    });

    const items = extractCalendarItems(query.data);
    const payload = extractCalendarPayload(query.data);

    return {
        ...query,
        items,
        payload
    };
}

export function useEntityManagerCalendarMonth(dates = []) {
    const dateFormat = useDateFormatStore((state) => state.dateFormat);
    const normalizedDates = Array.isArray(dates) ? dates.filter(Boolean) : [];

    const queries = useQueries({
        queries: normalizedDates.map((date) => ({
            queryKey: [...QUERY_KEY, date, dateFormat],
            queryFn: () => entityManagerCalendarService.getCalendar({ date }),
            staleTime: 2 * 60 * 1000,
            enabled: Boolean(date)
        }))
    });

    const itemsByDate = normalizedDates.reduce((acc, date, index) => {
        acc[date] = extractCalendarItems(queries[index]?.data);
        return acc;
    }, {});

    const payloadByDate = normalizedDates.reduce((acc, date, index) => {
        acc[date] = extractCalendarPayload(queries[index]?.data);
        return acc;
    }, {});

    return {
        itemsByDate,
        payloadByDate,
        queries,
        isLoading: queries.some((query) => query.isLoading),
        isFetching: queries.some((query) => query.isFetching),
        error: queries.find((query) => query.error)?.error ?? null
    };
}
