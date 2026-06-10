import { warningsFormFieldsService } from '../services/form-fields.service';
import i18n from 'i18next';
const ITEMS_PER_PAGE = 20;
const DEBOUNCE_DELAY = 400; // milliseconds
const normalizeSearchTerm = (inputValue) => {
    if (typeof inputValue !== 'string') {
        return undefined;
    }
    const trimmed = inputValue.trim();
    return trimmed === '' ? undefined : trimmed;
};
const extractResponseItems = (response) => {
    if (Array.isArray(response?.data)) {
        return response.data;
    }
    if (Array.isArray(response?.items)) {
        return response.items;
    }
    if (Array.isArray(response?.data?.items)) {
        return response.data.items;
    }
    if (Array.isArray(response?.data?.data)) {
        return response.data.data;
    }
    if (Array.isArray(response)) {
        return response;
    }
    return [];
};
/**
 * Debounce utility function for async functions
 */
function debounce(func, wait) {
    let timeout = null;
    return function executedFunction(...args) {
        return new Promise((resolve) => {
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(async () => {
                const result = await func(...args);
                resolve(result);
            }, wait);
        });
    };
}
/**
 * Transform API response to SelectRFHOption format
 */
function transformToOptions(items = []) {
    const currentLang = i18n.language || 'ar';
    return items.map((item) => {
        const id = item.id || item.value;
        let label = '';
        if (typeof item.name === 'string') {
            label = item.name;
        }
        else if (item.name && typeof item.name === 'object') {
            label = currentLang === 'ar' && item.name.ar ? item.name.ar : (item.name.en || '');
        }
        else if (item.label) {
            label = item.label;
        }
        else {
            label = String(id);
        }
        return {
            id,
            value: id,
            label,
            name: label
        };
    });
}
/**
 * Create async load function for students with debounced search
 */
export const createStudentsLoader = (branchId, mainProgramId, entityId) => {
    const loadStudents = async (inputValue) => {
        const params = {
            branch_id: branchId,
            main_program_id: mainProgramId,
            entity_id: entityId,
            search: normalizeSearchTerm(inputValue),
            page: 1,
            per_page: ITEMS_PER_PAGE
        };
        try {
            const response = await warningsFormFieldsService.getStudents(params);
            const items = extractResponseItems(response);
            return transformToOptions(items);
        }
        catch (error) {
            console.error('Error loading students:', error);
            return [];
        }
    };
    // Return debounced version
    return debounce(loadStudents, DEBOUNCE_DELAY);
};
/**
 * Create async load function for teachers with debounced search
 */
export const createTeachersLoader = (branchId, mainProgramId, entityId) => {
    const loadTeachers = async (inputValue) => {
        const params = {
            branch_id: branchId,
            main_program_id: mainProgramId,
            entity_id: entityId,
            search: normalizeSearchTerm(inputValue),
            page: 1,
            per_page: ITEMS_PER_PAGE
        };
        try {
            const response = await warningsFormFieldsService.getTeachers(params);
            const items = extractResponseItems(response);
            return transformToOptions(items);
        }
        catch (error) {
            console.error('Error loading teachers:', error);
            return [];
        }
    };
    // Return debounced version
    return debounce(loadTeachers, DEBOUNCE_DELAY);
};
/**
 * Create async load function for entities with debounced search
 */
export const createEntitiesLoader = (branchId, mainProgramId) => {
    const loadEntities = async (inputValue) => {
        try {
            const response = await warningsFormFieldsService.getEntities({
                branch_id: branchId,
                main_program_id: mainProgramId,
                search: normalizeSearchTerm(inputValue),
                page: 1,
                per_page: ITEMS_PER_PAGE
            });
            return transformToOptions(extractResponseItems(response));
        }
        catch (error) {
            console.error('Error loading entities:', error);
            return [];
        }
    };
    // Return debounced version
    return debounce(loadEntities, DEBOUNCE_DELAY);
};
