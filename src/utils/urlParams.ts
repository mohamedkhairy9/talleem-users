import { SetURLSearchParams } from 'react-router-dom';

/**
 * Utility functions for managing URL parameters
 * Used for localization, filtering, and state persistence
 */

/**
 * Get a URL parameter value
 */
export const getUrlParam = (
    searchParams: URLSearchParams,
    key: string,
    defaultValue: string | null = null
): string | null => {
    const value = searchParams.get(key);
    return value !== null ? value : defaultValue;
};

/**
 * Get multiple URL parameters as an object
 */
export const getUrlParams = (
    searchParams: URLSearchParams,
    keys: string[]
): Record<string, string> => {
    const params: Record<string, string> = {};
    keys.forEach(key => {
        const value = searchParams.get(key);
        if (value !== null) {
            params[key] = value;
        }
    });
    return params;
};

/**
 * Set a URL parameter
 */
export const setUrlParam = (
    setSearchParams: SetURLSearchParams,
    key: string,
    value: string | number | null,
    options: { replace?: boolean } = { replace: true }
): void => {
    setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        if (value === null || value === undefined || value === '') {
            newParams.delete(key);
        } else {
            newParams.set(key, String(value));
        }
        return newParams;
    }, options);
};

/**
 * Set multiple URL parameters
 */
export const setUrlParams = (
    setSearchParams: SetURLSearchParams,
    params: Record<string, string | number | null>,
    options: { replace?: boolean } = { replace: true }
): void => {
    setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        Object.entries(params).forEach(([key, value]) => {
            if (value === null || value === undefined || value === '') {
                newParams.delete(key);
            } else {
                newParams.set(key, String(value));
            }
        });
        return newParams;
    }, options);
};

/**
 * Get language from URL or return default
 */
export const getLanguageFromUrl = (
    searchParams: URLSearchParams,
    defaultLang: string = 'en'
): string => {
    return getUrlParam(searchParams, 'lang', defaultLang) || defaultLang;
};

/**
 * Set language in URL
 */
export const setLanguageInUrl = (
    setSearchParams: SetURLSearchParams,
    lang: string
): void => {
    setUrlParam(setSearchParams, 'lang', lang);
};

/**
 * Get filter parameters from URL
 */
export const getFiltersFromUrl = (
    searchParams: URLSearchParams,
    defaultFilters: Record<string, any> = {}
): Record<string, any> => {
    const filters = { ...defaultFilters };
    
    // Common filter keys
    const filterKeys = ['search', 'page', 'per_page', 'sort', 'order', 'status'];
    
    filterKeys.forEach(key => {
        const value = searchParams.get(key);
        if (value !== null) {
            filters[key] = value;
        }
    });
    
    return filters;
};

/**
 * Sync filters to URL
 */
export const syncFiltersToUrl = (
    setSearchParams: SetURLSearchParams,
    filters: Record<string, any>
): void => {
    setUrlParams(setSearchParams, filters, { replace: true });
};

/**
 * Clean empty parameters from URL
 */
export const cleanUrlParams = (searchParams: URLSearchParams): URLSearchParams => {
    const cleaned = new URLSearchParams();
    searchParams.forEach((value, key) => {
        if (value !== null && value !== undefined && value !== '') {
            cleaned.set(key, value);
        }
    });
    return cleaned;
};
