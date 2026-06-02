import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DEFAULT_HALAQAS_LIST_PARAMS, HALAQAS_LIST_PAGINATION } from '../constants/list.constants';
const URL_KEYS = {
    PAGE: 'page',
    PER_PAGE: 'per_page',
    SEARCH: 'search',
    PERIOD: 'period',
    TEACHING_METHOD: 'teaching_method'
};
function parseNum(value, defaultVal) {
    if (value == null || value === '')
        return defaultVal;
    const n = parseInt(value, 10);
    return Number.isFinite(n) ? Math.max(1, n) : defaultVal;
}
/**
 * Reads pagination and filter state from URL search params and updates URL on change.
 * Enables shareable / bookmarkable list URLs (e.g. ?page=2&search=foo&period=morning).
 */
export function useHalaqasListState() {
    const [searchParams, setSearchParams] = useSearchParams();
    const page = parseNum(searchParams.get(URL_KEYS.PAGE), DEFAULT_HALAQAS_LIST_PARAMS.page ?? HALAQAS_LIST_PAGINATION.DEFAULT_PAGE ?? 1);
    const perPage = parseNum(searchParams.get(URL_KEYS.PER_PAGE), DEFAULT_HALAQAS_LIST_PARAMS.per_page ?? HALAQAS_LIST_PAGINATION.DEFAULT_PER_PAGE ?? 10);
    const search = searchParams.get(URL_KEYS.SEARCH) ?? '';
    const period = searchParams.get(URL_KEYS.PERIOD) ?? '';
    const teachingMethod = searchParams.get(URL_KEYS.TEACHING_METHOD) ?? '';
    const setPageSafe = useCallback((nextPage) => {
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
            const def = HALAQAS_LIST_PAGINATION.DEFAULT_PER_PAGE ?? 10;
            if (value === def)
                next.delete(URL_KEYS.PER_PAGE);
            else
                next.set(URL_KEYS.PER_PAGE, String(Math.max(1, value)));
            next.delete(URL_KEYS.PAGE); // reset to page 1 when changing per_page
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
    const setPeriod = useCallback((value) => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            const v = (value ?? '').trim();
            if (v === '')
                next.delete(URL_KEYS.PERIOD);
            else
                next.set(URL_KEYS.PERIOD, v);
            next.delete(URL_KEYS.PAGE);
            return next;
        });
    }, [setSearchParams]);
    const setTeachingMethod = useCallback((value) => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            const v = (value ?? '').trim();
            if (v === '')
                next.delete(URL_KEYS.TEACHING_METHOD);
            else
                next.set(URL_KEYS.TEACHING_METHOD, v);
            next.delete(URL_KEYS.PAGE);
            return next;
        });
    }, [setSearchParams]);
    const setFilter = useCallback((key, value) => {
        if (key === 'page')
            setPageSafe(value ?? 1);
        else if (key === 'per_page')
            setPerPage(value ?? 10);
        else if (key === 'search')
            setSearch(value ?? '');
        else if (key === 'period')
            setPeriod(value ?? '');
        else if (key === 'teaching_method')
            setTeachingMethod(value ?? '');
    }, [setPageSafe, setPerPage, setSearch, setPeriod, setTeachingMethod]);
    const params = useMemo(() => ({
        page,
        per_page: perPage,
        ...(search && { search: search.trim() }),
        ...(period && { period }),
        ...(teachingMethod && { teaching_method: teachingMethod })
    }), [page, perPage, search, period, teachingMethod]);
    const resetFilters = useCallback(() => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.delete(URL_KEYS.PAGE);
            next.delete(URL_KEYS.PER_PAGE);
            next.delete(URL_KEYS.SEARCH);
            next.delete(URL_KEYS.PERIOD);
            next.delete(URL_KEYS.TEACHING_METHOD);
            return next;
        });
    }, [setSearchParams]);
    return {
        params,
        page,
        perPage,
        search,
        period,
        teachingMethod,
        setPage: setPageSafe,
        setPerPage,
        setSearch,
        setPeriod,
        setTeachingMethod,
        setFilter,
        resetFilters
    };
}
