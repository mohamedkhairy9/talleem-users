import * as yup from 'yup';
import { JoinRequestFormField } from '../types/registration.types';

/**
 * Build Yup schema dynamically from form field definitions
 */
export const buildDynamicSchema = (fields: JoinRequestFormField[]): yup.AnyObjectSchema => {
    const schemaObject: Record<string, any> = {};

    const buildFieldSchema = (field: JoinRequestFormField): any => {
        let fieldSchema: any;

        switch (field.type) {
            case 'text':
            case 'email':
                fieldSchema = yup.string();
                if (field.type === 'email') {
                    fieldSchema = fieldSchema.email('Invalid email address');
                }
                break;

            case 'number':
                fieldSchema = yup.number().typeError('Must be a number');
                break;

            case 'date':
                fieldSchema = yup.string();
                break;

            case 'boolean':
                fieldSchema = yup.boolean();
                break;

            case 'textarea':
                fieldSchema = yup.string();
                break;

            case 'object':
                // Multilingual object (name.ar, name.en)
                fieldSchema = yup.object({
                    ar: yup.string(),
                    en: yup.string()
                });
                break;

            case 'select':
                if (field.options) {
                    if (Array.isArray(field.options) && field.options.length > 0) {
                        fieldSchema = yup.string().oneOf(field.options);
                    } else if (typeof field.options === 'object' && !Array.isArray(field.options)) {
                        // Handle Record<string, string> - convert to array of values
                        const optionValues = Object.values(field.options);
                        fieldSchema = yup.string().oneOf(optionValues);
                    } else {
                        // For dynamic selects, accept string or number
                        fieldSchema = yup.mixed();
                    }
                } else {
                    // For dynamic selects, accept string or number
                    fieldSchema = yup.mixed();
                }
                break;

            case 'file':
                // File fields are handled separately in FormData
                fieldSchema = yup.mixed();
                break;

            case 'group':
                // Recursively build schema for nested fields
                const groupSchema: Record<string, any> = {};
                if (field.fields) {
                    field.fields.forEach((subField) => {
                        groupSchema[subField.key] = buildFieldSchema(subField);
                        if (subField.required) {
                            groupSchema[subField.key] = groupSchema[subField.key].required();
                        }
                    });
                }
                fieldSchema = yup.object(groupSchema);
                break;

            default:
                fieldSchema = yup.mixed();
        }

        if (field.required && field.type !== 'file') {
            fieldSchema = fieldSchema.required(`${field.label} is required`);
        }

        return fieldSchema;
    };

    fields.forEach((field) => {
        schemaObject[field.key] = buildFieldSchema(field);
    });

    return yup.object(schemaObject);
};


