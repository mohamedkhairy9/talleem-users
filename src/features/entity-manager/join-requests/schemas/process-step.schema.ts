import * as yup from 'yup';

export const processStepSchema = yup.object({
    status: yup.number().required('Status is required').oneOf([1, 2, 3, 4]).transform((v) => (v === '' || v === null ? undefined : v)),
    notes: yup.string().nullable().optional(),
    files: yup.mixed().nullable().optional()
});

export type ProcessStepFormData = yup.InferType<typeof processStepSchema>;
