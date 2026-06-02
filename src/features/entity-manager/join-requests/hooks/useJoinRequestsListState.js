import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
const URL_KEYS = {
    PAGE: 'page',
    PER_PAGE: 'per_page',
    SEARCH: 'search'
};
const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 10;
function parseNum(value, defaultVal) {
    if (value == null || value === '')
        return defaultVal;
    const n = parseInt(value, 10);
    return Number.isFinite(n) ? Math.max(1, n) : defaultVal;
}
export function useJoinRequestsListState() {
    const [searchParams, setSearchParams] = useSearchParams();
    const page = parseNum(searchParams.get(URL_KEYS.PAGE), DEFAULT_PAGE);
    const perPage = parseNum(searchParams.get(URL_KEYS.PER_PAGE), DEFAULT_PER_PAGE);
    const search = searchParams.get(URL_KEYS.SEARCH) ?? '';
    const setPage = useCallback((nextPage) => {
        const p = Math.max(1, nextPage);
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            if (p === 1)
                next.delete(URL_KEYS.PAGE);
            else
                next.set(URL_KEYS.PAGE, String(p));
            return next;
        });
    }, [setSearchParams]);
    const setPerPage = useCallback((value) => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            if (value === DEFAULT_PER_PAGE)
                next.delete(URL_KEYS.PER_PAGE);
            else
                next.set(URL_KEYS.PER_PAGE, String(Math.max(1, value)));
            next.delete(URL_KEYS.PAGE);
            return next;
        });
    }, [setSearchParams]);
    const setSearch = useCallback((value) => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            const trimmed = (value ?? '').trim();
            if (trimmed === '')
                next.delete(URL_KEYS.SEARCH);
            else
                next.set(URL_KEYS.SEARCH, trimmed);
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
        setPerPage,
        setSearch,
        resetFilters
    };
}
