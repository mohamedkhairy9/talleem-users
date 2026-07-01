import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

const URL_KEYS = {
    PAGE: 'page',
    PER_PAGE: 'per_page',
    SEARCH: 'search'
};

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 10;

function parseNum(value, defaultValue) {
    if (value == null || value === '') {
        return defaultValue;
    }

    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? Math.max(1, parsed) : defaultValue;
}

export function useScheduledActivitiesListState() {
    const [searchParams, setSearchParams] = useSearchParams();
    const page = parseNum(searchParams.get(URL_KEYS.PAGE), DEFAULT_PAGE);
    const perPage = parseNum(searchParams.get(URL_KEYS.PER_PAGE), DEFAULT_PER_PAGE);
    const search = searchParams.get(URL_KEYS.SEARCH) ?? '';

    const setPage = useCallback((nextPage) => {
        const safePage = Math.max(1, nextPage);

        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            if (safePage === 1) {
                next.delete(URL_KEYS.PAGE);
            } else {
                next.set(URL_KEYS.PAGE, String(safePage));
            }

            return next;
        });
    }, [setSearchParams]);

    const setSearch = useCallback((value) => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            const trimmed = (value ?? '').trim();

            if (trimmed === '') {
                next.delete(URL_KEYS.SEARCH);
            } else {
                next.set(URL_KEYS.SEARCH, trimmed);
            }

            next.delete(URL_KEYS.PAGE);
            return next;
        });
    }, [setSearchParams]);

    const params = useMemo(() => ({
        page,
        per_page: perPage,
        ...(search && { search: search.trim() })
    }), [page, perPage, search]);

    const resetFilters = useCallback(() => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.delete(URL_KEYS.PAGE);
            next.delete(URL_KEYS.PER_PAGE);
            next.delete(URL_KEYS.SEARCH);
            return next;
        });
    }, [setSearchParams]);

    return {
        params,
        page,
        perPage,
        search,
        setPage,
        setSearch,
        resetFilters
    };
}

