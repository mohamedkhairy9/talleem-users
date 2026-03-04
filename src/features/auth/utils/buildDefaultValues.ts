import { JoinRequestFormField } from '../types/registration.types';

/**
 * Build default values for form from field definitions
 */
export const buildDefaultValues = (fields: JoinRequestFormField[]): Record<string, any> => {
    const defaultValues: Record<string, any> = {};

    const buildFieldDefaults = (field: JoinRequestFormField): any => {
        switch (field.type) {
            case 'object':
                return { ar: '', en: '' };
            case 'boolean':
                return false;
            case 'select':
                return null;
            case 'multiselect':
                return [];
            case 'file':
                return field.multiple ? [] : null;
            case 'group':
                const groupDefaults: Record<string, any> = {};
                if (field.fields) {
                    field.fields.forEach((subField) => {
                        groupDefaults[subField.key] = buildFieldDefaults(subField);
                    });
                }
                return groupDefaults;
            default:
                return '';
        }
    };

    fields.forEach((field) => {
        defaultValues[field.key] = buildFieldDefaults(field);
    });

    return defaultValues;
};


