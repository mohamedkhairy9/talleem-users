import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { WarningsListParams } from '../services/warnings.service';

const URL_KEYS = {
    PAGE: 'page',
    PER_PAGE: 'per_page',
    SEARCH: 'search',
    WARNING_TYPE: 'warning_type',
    STATUS: 'status'
} as const;

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 10;

function parseNum(value: string | null, defaultVal: number): number {
    if (value == null || value === '') return defaultVal;
    const n = parseInt(value, 10);
    return Number.isFinite(n) ? Math.max(1, n) : defaultVal;
}

function parseBool(value: string | null): boolean | '' {
    if (value === null || value === '') return '';
    if (value === 'true') return true;
    if (value === 'false') return false;
    return '';
}

/**
 * Reads pagination and filter state from URL search params and updates URL on change.
 * Enables shareable / bookmarkable list URLs (e.g. ?page=2&search=foo&warning_type=student).
 */
export function useWarningsListState() {
    const [searchParams, setSearchParams] = useSearchParams();

    const page = parseNum(searchParams.get(URL_KEYS.PAGE), DEFAULT_PAGE);
    const perPage = parseNum(searchParams.get(URL_KEYS.PER_PAGE), DEFAULT_PER_PAGE);
    const search = searchParams.get(URL_KEYS.SEARCH) ?? '';
    const warningType = searchParams.get(URL_KEYS.WARNING_TYPE) ?? '';
    const status = parseBool(searchParams.get(URL_KEYS.STATUS));

    const setPageSafe = useCallback(
        (nextPage: number) => {
            const p = Math.max(1, nextPage);
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                if (p === 1) next.delete(URL_KEYS.PAGE);
                else next.set(URL_KEYS.PAGE, String(p));
                return next;
            });
        },
        [setSearchParams]
    );

    const setPerPage = useCallback(
        (value: number) => {
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                if (value === DEFAULT_PER_PAGE) next.delete(URL_KEYS.PER_PAGE);
                else next.set(URL_KEYS.PER_PAGE, String(Math.max(1, value)));
                next.delete(URL_KEYS.PAGE); // reset to page 1 when changing per_page
                return next;
            });
        },
        [setSearchParams]
    );

    const setSearch = useCallback(
        (value: string) => {
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                const trimmed = (value ?? '').trim();
                if (trimmed === '') next.delete(URL_KEYS.SEARCH);
                else next.set(URL_KEYS.SEARCH, trimmed);
                next.delete(URL_KEYS.PAGE);
                return next;
            });
        },
        [setSearchParams]
    );

    const setWarningType = useCallback(
        (value: string) => {
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                const v = (value ?? '').trim();
                if (v === '') next.delete(URL_KEYS.WARNING_TYPE);
                else next.set(URL_KEYS.WARNING_TYPE, v);
                next.delete(URL_KEYS.PAGE);
                return next;
            });
        },
        [setSearchParams]
    );

    const setStatus = useCallback(
        (value: boolean | '') => {
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                if (value === '') {
                    next.delete(URL_KEYS.STATUS);
                } else {
                    next.set(URL_KEYS.STATUS, String(value));
                }
                next.delete(URL_KEYS.PAGE);
                return next;
            });
        },
        [setSearchParams]
    );

    const params: WarningsListParams = useMemo(
        () => ({
            page,
            per_page: perPage,
            ...(search && { search: search.trim() }),
            ...(warningType && { warning_type: warningType as 'student' | 'teacher' | 'entity' }),
            ...(status !== '' && { status })
        }),
        [page, perPage, search, warningType, status]
    );

    const resetFilters = useCallback(() => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.delete(URL_KEYS.PAGE);
            next.delete(URL_KEYS.PER_PAGE);
            next.delete(URL_KEYS.SEARCH);
            next.delete(URL_KEYS.WARNING_TYPE);
            next.delete(URL_KEYS.STATUS);
            return next;
        });
    }, [setSearchParams]);

    return {
        params,
        page,
        perPage,
        search,
        warningType,
        status,
        setPage: setPageSafe,
        setPerPage,
        setSearch,
        setWarningType,
        setStatus,
        resetFilters
    };
}


