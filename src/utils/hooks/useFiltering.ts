import { useState, useCallback } from 'react';
import { useUrlParams } from './useUrlParams';

interface Pagination {
    page: number;
    per_page: number;
    total: number;
}

/**
 * Hook for managing filtering and pagination
 * Syncs with URL parameters for shareable URLs
 */
export const useFiltering = (defaultFilters: Record<string, any> = {}) => {
    const { getFilters, syncFilters, searchParams } = useUrlParams();
    
    // Initialize filters from URL or use defaults
    const initialFilters = getFilters(defaultFilters);
    const [filters, setFilters] = useState<Record<string, any>>({
        ...defaultFilters,
        ...initialFilters
    });

    const [pagination, setPagination] = useState<Pagination>({
        page: parseInt(searchParams.get('page') || '1') || 1,
        per_page: parseInt(searchParams.get('per_page') || '10') || 10,
        total: 0
    });

    // Handle filter changes
    const handleFilter = useCallback((key: string, value: any) => {
        setFilters(prev => {
            const newFilters = { ...prev, [key]: value };
            // Reset to page 1 when filters change
            if (key !== 'page') {
                newFilters.page = 1;
            }
            syncFilters({ ...newFilters, page: newFilters.page });
            return newFilters;
        });
    }, [syncFilters]);

    // Handle pagination changes
    const handlePageChange = useCallback((page: number) => {
        setPagination(prev => ({ ...prev, page }));
        setFilters(prev => {
            const newFilters = { ...prev, page };
            syncFilters(newFilters);
            return newFilters;
        });
    }, [syncFilters]);

    // Update pagination total
    const setPaginationTotal = useCallback((total: number) => {
        setPagination(prev => ({ ...prev, total }));
    }, []);

    // Reset filters
    const resetFilters = useCallback(() => {
        setFilters(defaultFilters);
        setPagination(prev => ({ ...prev, page: 1 }));
        syncFilters({ ...defaultFilters, page: 1 });
    }, [defaultFilters, syncFilters]);

    return {
        filters,
        setFilters,
        handleFilter,
        pagination,
        handlePageChange,
        setPaginationTotal,
        resetFilters
    };
};
