import * as yup from 'yup';

export const joinHalaqaStudentSchema = yup.object({
    student_id: yup
        .number()
        .transform((value, originalValue) => {
            if (originalValue === '' || originalValue === null || originalValue === undefined) {
                return undefined;
            }

            const num = typeof value === 'number' ? value : Number(originalValue);
            return Number.isNaN(num) ? undefined : num;
        })
        .positive('plan.validation.studentInvalid')
        .required('plan.validation.studentRequired'),
    start_date: yup
        .string()
        .required('halaqa.validation.startDateRequired'),
    activity: yup
        .string()
        .oneOf(['hifz', 'tasbit', 'murajaa'], 'plan.validation.activityInvalid')
        .required('plan.validation.activityRequired'),
    plan_type: yup
        .string()
        .oneOf(['daily_amount', 'start_end'], 'plan.validation.planTypeInvalid')
        .required('plan.validation.planTypeRequired'),
    direction: yup
        .string()
        .oneOf(['incremental', 'decremental'], 'plan.validation.directionInvalid')
        .required('plan.validation.directionRequired'),
    daily_amount: yup
        .number()
        .transform((value, originalValue) => {
            if (originalValue === '' || originalValue === null || originalValue === undefined) {
                return undefined;
            }

            const num = typeof value === 'number' ? value : Number(originalValue);
            return Number.isNaN(num) ? undefined : num;
        })
        .when('plan_type', {
            is: 'daily_amount',
            then: (schema) => schema
                .required('plan.validation.dailyAmountRequired')
                .positive('plan.validation.dailyAmountPositive')
                .integer('plan.validation.dailyAmountInteger'),
            otherwise: (schema) => schema.notRequired().nullable()
        }),
    start_segment_verse_key: yup
        .string()
        .required('plan.validation.startSegmentRequired')
        .matches(/^\d+:\d+$/, 'plan.validation.verseKeyFormat'),
    end_segment_verse_key: yup
        .string()
        .when('plan_type', {
            is: 'start_end',
            then: (schema) => schema
                .required('plan.validation.endSegmentRequired')
                .matches(/^\d+:\d+$/, 'plan.validation.verseKeyFormat'),
            otherwise: (schema) => schema.notRequired()
        })
});
