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
    start_verse_id: yup.number().required('Start verse ID is required').positive(),
    daily_amount: yup.number().required('Daily amount is required').positive()
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
    start_verse_id: number;
    daily_amount: number;
}



