import * as yup from 'yup';

/**
 * Create Plan Form Schema
 */
export const createPlanSchema = yup.object({
    activity: yup.string().oneOf(['hifz', 'tasbit', 'murajaa'], 'Activity must be hifz, tasbit, or murajaa').required('Activity is required'),
    student_id: yup.number().required('Student is required').positive(),
    plan_type: yup.string().oneOf(['daily_amount', 'start_end'], 'Plan type must be daily_amount or start_end').required('Plan type is required'),
    unit: yup.string().oneOf(['segments', 'parts', 'surahs'], 'Unit must be segments, parts, or surahs').required('Unit is required'),
    direction: yup.string().oneOf(['incremental', 'decremental'], 'Direction must be incremental or decremental').required('Direction is required'),
    daily_amount: yup.number().required('Daily amount is required').positive(),
    // Conditional fields based on unit
    start_segment_id: yup.number().when('unit', {
        is: 'segments',
        then: (schema) => schema.required('Start segment ID is required when unit is segments').positive('Start segment ID must be positive'),
        otherwise: (schema) => schema.notRequired()
    }),
    start_juz_number: yup.number().when('unit', {
        is: 'parts',
        then: (schema) => schema.required('Start juz number is required when unit is parts').positive('Start juz number must be positive'),
        otherwise: (schema) => schema.notRequired()
    }),
    start_surah_id: yup.number().when('unit', {
        is: 'surahs',
        then: (schema) => schema.required('Start surah ID is required when unit is surahs').positive('Start surah ID must be positive'),
        otherwise: (schema) => schema.notRequired()
    })
});

/**
 * Create Plan Form Data Type
 */
export interface CreatePlanFormData {
    activity: 'hifz' | 'tasbit' | 'murajaa';
    student_id: number;
    plan_type: 'daily_amount' | 'start_end';
    unit: 'segments' | 'parts' | 'surahs';
    direction: 'incremental' | 'decremental';
    daily_amount: number;
    // Conditional fields based on unit
    start_segment_id?: number; // Required when unit is 'segments'
    start_juz_number?: number; // Required when unit is 'parts'
    start_surah_id?: number; // Required when unit is 'surahs'
}



