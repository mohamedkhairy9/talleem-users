import { useSearchParams } from 'react-router-dom';
import { getUrlParam, setUrlParam, getFiltersFromUrl, syncFiltersToUrl } from '@/utils/urlParams';
/**
 * Hook to manage URL parameters
 */
export const useUrlParams = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    return {
        searchParams,
        setSearchParams,
        getParam: (key, defaultValue) => getUrlParam(searchParams, key, defaultValue),
        setParam: (key, value, options) => setUrlParam(setSearchParams, key, value, options),
        getFilters: (defaultFilters) => getFiltersFromUrl(searchParams, defaultFilters),
        syncFilters: (filters) => syncFiltersToUrl(setSearchParams, filters)
    };
};
