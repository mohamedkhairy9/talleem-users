/**
 * Utility functions for managing URL parameters
 * Used for filtering and state persistence
 */
/**
 * Get a URL parameter value
 */
export const getUrlParam = (searchParams, key, defaultValue = null) => {
    const value = searchParams.get(key);
    return value !== null ? value : defaultValue;
};
/**
 * Get multiple URL parameters as an object
 */
export const getUrlParams = (searchParams, keys) => {
    const params = {};
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
export const setUrlParam = (setSearchParams, key, value, options = { replace: true }) => {
    setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        if (value === null || value === undefined || value === '') {
            newParams.delete(key);
        }
        else {
            newParams.set(key, String(value));
        }
        return newParams;
    }, options);
};
/**
 * Set multiple URL parameters
 */
export const setUrlParams = (setSearchParams, params, options = { replace: true }) => {
    setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        Object.entries(params).forEach(([key, value]) => {
            if (value === null || value === undefined || value === '') {
                newParams.delete(key);
            }
            else {
                newParams.set(key, String(value));
            }
        });
        return newParams;
    }, options);
};
/**
 * Get filter parameters from URL
 */
export const getFiltersFromUrl = (searchParams, defaultFilters = {}) => {
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
export const syncFiltersToUrl = (setSearchParams, filters) => {
    setUrlParams(setSearchParams, filters, { replace: true });
};
/**
 * Clean empty parameters from URL
 */
export const cleanUrlParams = (searchParams) => {
    const cleaned = new URLSearchParams();
    searchParams.forEach((value, key) => {
        if (value !== null && value !== undefined && value !== '') {
            cleaned.set(key, value);
        }
    });
    return cleaned;
};
