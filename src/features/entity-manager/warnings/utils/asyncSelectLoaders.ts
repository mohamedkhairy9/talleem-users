import { warningsFormFieldsService } from '../services/form-fields.service';
import { SelectRFHOption } from '@/globals/components/ui/SelectRFH';
import i18n from 'i18next';

const ITEMS_PER_PAGE = 20;
const DEBOUNCE_DELAY = 400; // milliseconds

/**
 * Debounce utility function for async functions
 */
function debounce<T extends (...args: any[]) => Promise<any>>(
    func: T,
    wait: number
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
    let timeout: NodeJS.Timeout | null = null;
    
    return function executedFunction(...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> {
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
function transformToOptions(items: any[] = []): SelectRFHOption[] {
    const currentLang = i18n.language || 'ar';
    return items.map((item) => {
        const id = item.id || item.value;
        let label = '';
        
        if (typeof item.name === 'string') {
            label = item.name;
        } else if (item.name && typeof item.name === 'object') {
            label = currentLang === 'ar' && item.name.ar ? item.name.ar : (item.name.en || '');
        } else if (item.label) {
            label = item.label;
        } else {
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
export const createStudentsLoader = (branchId?: number, mainProgramId?: number, entityId?: number) => {
    const loadStudents = async (inputValue: string): Promise<SelectRFHOption[]> => {
        try {
            const response = await warningsFormFieldsService.getStudents({
                branch_id: branchId,
                main_program_id: mainProgramId,
                entity_id: entityId,
                search: inputValue.trim() || undefined
            });
            
            return transformToOptions(response.data || []);
        } catch (error) {
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
export const createTeachersLoader = (branchId?: number, mainProgramId?: number, entityId?: number) => {
    const loadTeachers = async (inputValue: string): Promise<SelectRFHOption[]> => {
        try {
            const response = await warningsFormFieldsService.getTeachers({
                branch_id: branchId,
                main_program_id: mainProgramId,
                entity_id: entityId,
                search: inputValue.trim() || undefined,
                page: 1,
                per_page: ITEMS_PER_PAGE
            });
            
            return transformToOptions(response.data || []);
        } catch (error) {
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
export const createEntitiesLoader = (branchId?: number, mainProgramId?: number) => {
    const loadEntities = async (inputValue: string): Promise<SelectRFHOption[]> => {
        try {
            const response = await warningsFormFieldsService.getEntities({
                branch_id: branchId,
                main_program_id: mainProgramId,
                search: inputValue.trim() || undefined,
                page: 1,
                per_page: ITEMS_PER_PAGE
            });
            
            return transformToOptions(response.data || []);
        } catch (error) {
            console.error('Error loading entities:', error);
            return [];
        }
    };
    
    // Return debounced version
    return debounce(loadEntities, DEBOUNCE_DELAY);
};

