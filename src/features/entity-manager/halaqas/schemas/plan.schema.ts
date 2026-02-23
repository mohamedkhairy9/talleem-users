import * as yup from 'yup';

/**
 * Create Plan Form Schema
 */
export const createPlanSchema = yup.object({
    activity: yup.string().oneOf(['hifz', 'tasbit', 'murajaa'], 'Activity must be hifz, tasbit, or murajaa').required('Activity is required'),
    student_ids: yup.array().of(yup.number().positive()).min(1, 'Select at least one student').required('At least one student is required'),
    plan_type: yup.string().oneOf(['daily_amount', 'start_end'], 'Plan type must be daily_amount or start_end').required('Plan type is required'),
    unit: yup.string().oneOf(['segments', 'parts', 'surahs'], 'Unit must be segments, parts, or surahs').required('Unit is required'),
    direction: yup.string().oneOf(['incremental', 'decremental'], 'Direction must be incremental or decremental').required('Direction is required'),
    daily_amount: yup.number().when('plan_type', {
        is: 'daily_amount',
        then: (schema) => schema.required('Daily amount is required when plan type is daily_amount').positive('Daily amount must be positive'),
        otherwise: (schema) => schema.notRequired()
    }),
    // Conditional fields based on unit
    start_segment_verse_key: yup.string().when('unit', {
        is: 'segments',
        then: (schema) => schema.required('Start segment verse key is required when unit is segments').matches(/^\d+:\d+$/, 'Verse key must be in format "surah:ayah" (e.g., "1:1")'),
        otherwise: (schema) => schema.notRequired()
    }),
    start_juz_number: yup.number().when('unit', {
        is: 'parts',
        then: (schema) => schema.required('Start juz number is required when unit is parts').positive('Start juz number must be positive').max(30, 'Juz must be 1–30'),
        otherwise: (schema) => schema.notRequired()
    }),
    start_surah_id: yup.number().when('unit', {
        is: 'surahs',
        then: (schema) => schema.required('Start surah ID is required when unit is surahs').positive('Start surah ID must be positive'),
        otherwise: (schema) => schema.notRequired()
    }),
    // End fields - required when plan_type is 'start_end'
    end_segment_verse_key: yup.string().when(['unit', 'plan_type'], {
        is: (unit: string, planType: string) => unit === 'segments' && planType === 'start_end',
        then: (schema) => schema.required('End segment verse key is required when plan type is start_end and unit is segments').matches(/^\d+:\d+$/, 'Verse key must be in format "surah:ayah" (e.g., "1:2")'),
        otherwise: (schema) => schema.notRequired()
    }),
    end_juz_number: yup.number().when(['unit', 'plan_type'], {
        is: (unit: string, planType: string) => unit === 'parts' && planType === 'start_end',
        then: (schema) => schema.required('End juz number is required when plan type is start_end and unit is parts').positive('End juz number must be positive'),
        otherwise: (schema) => schema.notRequired()
    }),
    end_surah_id: yup.number().when(['unit', 'plan_type'], {
        is: (unit: string, planType: string) => unit === 'surahs' && planType === 'start_end',
        then: (schema) => schema.required('End surah ID is required when plan type is start_end and unit is surahs').positive('End surah ID must be positive'),
        otherwise: (schema) => schema.notRequired()
    })
});

/**
 * Create Plan Form Data Type
 */
export interface CreatePlanFormData {
    activity: 'hifz' | 'tasbit' | 'murajaa';
    student_ids: number[];
    plan_type: 'daily_amount' | 'start_end';
    unit: 'segments' | 'parts' | 'surahs';
    direction: 'incremental' | 'decremental';
    daily_amount: number;
    // Conditional fields based on unit
    start_segment_verse_key?: string; // Required when unit is 'segments' (format: "surah:ayah" e.g., "1:1")
    start_juz_number?: number; // Required when unit is 'parts'
    start_surah_id?: number; // Required when unit is 'surahs'
    end_segment_verse_key?: string; // Required when unit is 'segments' and plan_type is 'start_end' (format: "surah:ayah" e.g., "1:2")
    end_juz_number?: number; // Required when unit is 'parts' and plan_type is 'start_end'
    end_surah_id?: number; // Required when unit is 'surahs' and plan_type is 'start_end'
}



