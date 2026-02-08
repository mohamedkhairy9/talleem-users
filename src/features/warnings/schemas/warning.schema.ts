import * as yup from 'yup';

/**
 * Create Warning Form Schema
 */
export const createWarningSchema = yup.object({
    branch_id: yup.number().required('Branch is required').positive(),
    program_id: yup.number().required('Program is required').positive(),
    warning_type: yup.string().oneOf(['student', 'teacher', 'entity'], 'Warning type must be student, teacher, or entity').required('Warning type is required'),
    entity_id: yup.number().nullable().when('warning_type', {
        is: 'entity',
        then: (schema) => schema.required('Entity is required').positive(),
        otherwise: (schema) => schema.nullable()
    }),
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
    note: yup.string().required('Note is required'),
    status: yup.boolean().required('Status is required')
});

/**
 * Create Warning Form Data Type
 */
export interface CreateWarningFormData {
    branch_id: number;
    program_id: number;
    warning_type: 'student' | 'teacher' | 'entity';
    entity_id?: number | null;
    student_id?: number | null;
    teacher_id?: number | null;
    warning_reason_id: number;
    date: string;
    note: string;
    status: boolean;
}

