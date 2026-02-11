import { PAGINATION } from '@/utils/constants/api.constants';
import type { WarningsListParams } from '../services/warnings.service';

/** API path for warnings list (GET /api/front/warnings with baseURL) - single source of truth */
export const WARNINGS_LIST_PATH = '/warnings';

/**
 * Default pagination for warnings list
 */
export const WARNINGS_LIST_PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_PER_PAGE: PAGINATION.DEFAULT_PER_PAGE,
    MAX_PER_PAGE: PAGINATION.MAX_PER_PAGE
} as const;

/**
 * Default params for warnings list (extend when adding new filters)
 */
export const DEFAULT_WARNINGS_LIST_PARAMS: WarningsListParams = {
    page: WARNINGS_LIST_PAGINATION.DEFAULT_PAGE,
    per_page: WARNINGS_LIST_PAGINATION.DEFAULT_PER_PAGE
};

/**
 * Filter config for list - add entries here to add new filters
 * type: 'text' | 'select' | 'date' for future filter UI
 */
export const WARNINGS_LIST_FILTER_KEYS = [
    { key: 'search', paramKey: 'search', type: 'text' as const },
    { key: 'warning_type', paramKey: 'warning_type', type: 'select' as const },
    { key: 'status', paramKey: 'status', type: 'select' as const }
] as const;

