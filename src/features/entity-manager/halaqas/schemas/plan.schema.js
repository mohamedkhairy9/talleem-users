import * as yup from 'yup';

/**
 * Create Plan Form Schema
 */
export const createPlanSchema = yup.object({
    activity: yup.string().oneOf(['hifz', 'tasbit', 'murajaa'], 'plan.validation.activityInvalid').required('plan.validation.activityRequired'),
    auto_tasbit_enabled: yup.boolean().notRequired(),
    student_ids: yup.array()
        .of(yup.number().positive('plan.validation.studentInvalid'))
        .min(1, 'plan.validation.studentRequired')
        .required('plan.validation.studentRequired'),
    plan_type: yup.string().oneOf(['daily_amount', 'start_end'], 'plan.validation.planTypeInvalid').required('plan.validation.planTypeRequired'),
    unit: yup.string().oneOf(['segments', 'parts', 'surahs'], 'plan.validation.unitInvalid').required('plan.validation.unitRequired'),
    direction: yup.string().oneOf(['incremental', 'decremental'], 'plan.validation.directionInvalid').required('plan.validation.directionRequired'),
    daily_amount: yup
        .number()
        .transform((value, originalValue) => {
            if (originalValue === '' || originalValue === null || originalValue === undefined) {
                return undefined;
            }

            const num = typeof value === 'number' ? value : Number(value);
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
    // Conditional fields based on unit
    start_segment_verse_key: yup.string().when('unit', {
        is: 'segments',
        then: (schema) => schema.required('plan.validation.startSegmentRequired').matches(/^\d+:\d+$/, 'plan.validation.verseKeyFormat'),
        otherwise: (schema) => schema.notRequired()
    }),
    start_juz_number: yup.number().when('unit', {
        is: 'parts',
        then: (schema) => schema.required('plan.validation.startJuzRequired').positive('plan.validation.startJuzPositive').max(30, 'plan.validation.juzRange'),
        otherwise: (schema) => schema.notRequired()
    }),
    start_surah_id: yup.number().when('unit', {
        is: 'surahs',
        then: (schema) => schema.required('plan.validation.startSurahRequired').positive('plan.validation.startSurahPositive'),
        otherwise: (schema) => schema.notRequired()
    }),
    // End fields - required when plan_type is 'start_end'
    end_segment_verse_key: yup.string().when(['unit', 'plan_type'], {
        is: (unit, planType) => unit === 'segments' && planType === 'start_end',
        then: (schema) => schema.required('plan.validation.endSegmentRequired').matches(/^\d+:\d+$/, 'plan.validation.verseKeyFormat'),
        otherwise: (schema) => schema.notRequired()
    }),
    end_juz_number: yup.number().when(['unit', 'plan_type'], {
        is: (unit, planType) => unit === 'parts' && planType === 'start_end',
        then: (schema) => schema.required('plan.validation.endJuzRequired').positive('plan.validation.endJuzPositive').max(30, 'plan.validation.juzRange'),
        otherwise: (schema) => schema.notRequired()
    }),
    end_surah_id: yup.number().when(['unit', 'plan_type'], {
        is: (unit, planType) => unit === 'surahs' && planType === 'start_end',
        then: (schema) => schema.required('plan.validation.endSurahRequired').positive('plan.validation.endSurahPositive'),
        otherwise: (schema) => schema.notRequired()
    })
});
