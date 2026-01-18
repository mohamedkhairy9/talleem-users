import { useSearchParams } from 'react-router-dom';
import { 
    getUrlParam, 
    setUrlParam, 
    getFiltersFromUrl,
    syncFiltersToUrl 
} from '@/utils/urlParams';

/**
 * Hook to manage URL parameters
 */
export const useUrlParams = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    return {
        searchParams,
        setSearchParams,
        getParam: (key: string, defaultValue?: string | null) => getUrlParam(searchParams, key, defaultValue),
        setParam: (key: string, value: string | number | null, options?: { replace?: boolean }) => setUrlParam(setSearchParams, key, value, options),
        getFilters: (defaultFilters?: Record<string, any>) => getFiltersFromUrl(searchParams, defaultFilters),
        syncFilters: (filters: Record<string, any>) => syncFiltersToUrl(setSearchParams, filters)
    };
};
