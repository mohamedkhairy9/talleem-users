import * as yup from 'yup';

/** Returns today's date in YYYY-MM-DD for comparison with date inputs */
function getTodayDateString(): string {
    return new Date().toISOString().slice(0, 10);
}

/**
 * Full create leave form schema (leave + pto).
 * - Leave: leave_sub_type, from_date, to_date; medical_report required when leave_sub_type is 'sick'.
 * - PTO: date, from_time, to_time.
 */
export const createLeaveFormSchema = yup.object({
    leave_type: yup.string().oneOf(['leave', 'pto']).required(),
    leave_sub_type: yup
        .string()
        .when('leave_type', {
            is: 'leave',
            then: (schema) => schema.required('leave_sub_type_required'),
            otherwise: (schema) => schema.optional().nullable()
        }),
    from_date: yup
        .string()
        .when('leave_type', {
            is: 'leave',
            then: (schema) =>
                schema
                    .required('fromDateRequired')
                    .test('not-before-today', 'fromDateNotBeforeToday', (value) => {
                        if (!value) return false;
                        return value >= getTodayDateString();
                    }),
            otherwise: (schema) => schema.optional().nullable()
        }),
    to_date: yup
        .string()
        .when('leave_type', {
            is: 'leave',
            then: (schema) =>
                schema
                    .required('toDateRequired')
                    .test('after-start', 'toDateAfterStart', function (value) {
                        const { from_date } = this.parent;
                        if (!value || !from_date) return true;
                        return value > from_date;
                    })
                    .test('not-before-today', 'toDateNotBeforeToday', (value) => {
                        if (!value) return false;
                        return value >= getTodayDateString();
                    }),
            otherwise: (schema) => schema.optional().nullable()
        }),
    medical_report: yup
        .mixed<File | null>()
        .nullable()
        .when(['leave_type', 'leave_sub_type'], {
            is: (leave_type: string, leave_sub_type: string) => leave_type === 'leave' && leave_sub_type === 'sick',
            then: (schema) =>
                schema.test(
                    'medical-report-required',
                    'medicalReportRequired',
                    (value) => value != null && value instanceof File && value.size > 0
                ),
            otherwise: (schema) => schema.nullable().optional()
        }),
    date: yup
        .string()
        .when('leave_type', {
            is: 'pto',
            then: (schema) => schema.required('dateRequired'),
            otherwise: (schema) => schema.optional().nullable()
        }),
    from_time: yup
        .string()
        .when('leave_type', {
            is: 'pto',
            then: (schema) => schema.required('fromTimeRequired'),
            otherwise: (schema) => schema.optional().nullable()
        }),
    to_time: yup
        .string()
        .when('leave_type', {
            is: 'pto',
            then: (schema) => schema.required('toTimeRequired'),
            otherwise: (schema) => schema.optional().nullable()
        }),
    notes: yup.string().optional().nullable()
});

export type CreateLeaveFormData = yup.InferType<typeof createLeaveFormSchema>;
