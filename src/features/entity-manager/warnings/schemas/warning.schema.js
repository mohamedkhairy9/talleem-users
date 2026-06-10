import * as yup from 'yup';
/**
 * Create Warning Form Schema
 * Note: branch_id and program_id are set automatically from entity data, not from form
 */
export const createWarningSchema = yup.object({
    warning_type: yup.string().oneOf(['student', 'teacher'], 'Warning type must be student or teacher').required('Warning type is required'),
    student_id: yup.number().nullable().when('warning_type', {
        is: 'student',
        then: (schema) => schema.required('Student is required').positive(),
        otherwise: (schema) => schema.nullable()
    }),
    teacher_id: yup.number().nullable().when('warning_type', {
        is: 'teacher',
        then: (schema) => schema.required('Teacher is required').positive(),
        otherwise: (schema) => schema.nullable()
    }),
    warning_reason_id: yup.number().required('Warning reason is required').positive(),
    date: yup.string().required('Date is required'),
    note: yup.string().nullable().transform((value) => value ?? ''),
    status: yup.boolean().optional()
});
