import { PAGINATION } from '@/utils/constants/api.constants';
import type { HalaqasListParams } from '../types/list.types';

/** API path for halaqas list (GET /api/front/halaqas with baseURL) - single source of truth */
export const HALAQAS_LIST_PATH = '/halaqas';

/**
 * Default pagination for halaqas list
 */
export const HALAQAS_LIST_PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_PER_PAGE: PAGINATION.DEFAULT_PER_PAGE,
    MAX_PER_PAGE: PAGINATION.MAX_PER_PAGE
} as const;

/**
 * Default params for halaqas list (extend when adding new filters)
 */
export const DEFAULT_HALAQAS_LIST_PARAMS: HalaqasListParams = {
    page: HALAQAS_LIST_PAGINATION.DEFAULT_PAGE,
    per_page: HALAQAS_LIST_PAGINATION.DEFAULT_PER_PAGE
};

/**
 * Filter config for list - add entries here to add new filters
 * type: 'text' | 'select' | 'date' for future filter UI
 */
export const HALAQAS_LIST_FILTER_KEYS = [
    { key: 'search', paramKey: 'search', type: 'text' as const },
    { key: 'period', paramKey: 'period', type: 'select' as const },
    { key: 'teaching_method', paramKey: 'teaching_method', type: 'select' as const }
] as const;
