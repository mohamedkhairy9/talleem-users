import * as yup from 'yup';
import type { JoinRequestFormField } from '../types/teacher-requests.types';

function getTodayDateString(): string {
    return new Date().toISOString().slice(0, 10);
}

/**
 * Build default value for a dynamic field (e.g. "today" -> today's date)
 */
export function getFieldDefaultValue(field: JoinRequestFormField): string | number | null {
    if (field.default === 'today' && (field.type === 'date' || !field.type)) {
        return getTodayDateString();
    }
    if (field.type === 'number') return '';
    if (field.type === 'select') return null;
    return '';
}

/**
 * Build default values for the create request form: request_type_id + dynamic field keys
 */
export function buildCreateRequestDefaultValues(
    requestTypeId: number,
    fields: JoinRequestFormField[]
): Record<string, unknown> {
    const sorted = [...fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const defaults: Record<string, unknown> = { request_type_id: requestTypeId };
    sorted.forEach((f) => {
        defaults[f.key] = getFieldDefaultValue(f);
    });
    return defaults;
}

/**
 * Build yup schema shape for dynamic fields
 */
function buildDynamicFieldSchema(field: JoinRequestFormField): yup.AnySchema {
    const required = field.required ?? false;
    switch (field.type) {
        case 'number': {
            const base = yup
                .number()
                .transform((v, o) => (o === '' || o === undefined ? null : Number(v)))
                .nullable();
            return required ? base.required('fieldRequired').typeError('fieldRequired') : base;
        }
        case 'date':
            return required
                ? yup.string().required('fieldRequired')
                : yup.string().nullable().optional();
        case 'select': {
            const base = yup
                .number()
                .transform((v, o) => (o === '' || o === undefined ? null : Number(v)))
                .nullable();
            return required ? base.required('fieldRequired').typeError('fieldRequired') : base;
        }
        case 'text':
        default:
            return required
                ? yup.string().required('fieldRequired').trim().min(1, 'fieldRequired')
                : yup.string().nullable().optional();
    }
}

/**
 * Build full create request form schema (request_type_id + dynamic fields from form definition)
 */
export function buildCreateRequestFormSchema(fields: JoinRequestFormField[]): yup.ObjectSchema<any> {
    const sorted = [...fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const shape: Record<string, yup.AnySchema> = {
        request_type_id: yup
            .number()
            .required('requestTypeRequired')
            .positive('requestTypeRequired')
    };
    sorted.forEach((f) => {
        shape[f.key] = buildDynamicFieldSchema(f);
    });
    return yup.object(shape);
}

/** Base schema when no form is loaded (request type only) */
export const createRequestFormSchemaBase = yup.object({
    request_type_id: yup
        .number()
        .required('requestTypeRequired')
        .positive('requestTypeRequired')
});

export type CreateRequestFormDataBase = yup.InferType<typeof createRequestFormSchemaBase>;
