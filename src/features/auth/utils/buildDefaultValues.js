/**
 * Build default values for form from field definitions
 */
export const buildDefaultValues = (fields) => {
    const defaultValues = {};
    const buildFieldDefaults = (field) => {
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
            case 'group': {
                const groupDefaults = {};
                if (field.fields) {
                    field.fields.forEach((subField) => {
                        groupDefaults[subField.key] = buildFieldDefaults(subField);
                    });
                }
                return groupDefaults;
            }
            default:
                return '';
        }
    };
    fields.forEach((field) => {
        defaultValues[field.key] = buildFieldDefaults(field);
    });
    return defaultValues;
};
