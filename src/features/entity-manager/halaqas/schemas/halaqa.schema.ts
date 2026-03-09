import * as yup from 'yup';
import { HALAQA_EVALUATION_SYSTEM_TYPES, HALAQA_WEEKLY_HOLIDAYS } from '../config';

const HALAQA_WEEKLY_HOLIDAY_VALUES = HALAQA_WEEKLY_HOLIDAYS.map((day) => day.value);
const HALAQA_EVALUATION_SYSTEM_TYPE_VALUES = HALAQA_EVALUATION_SYSTEM_TYPES.map((item) => item.value);

/**
 * Create Halaqa Form Schema
 */
export const createHalaqaSchema = yup.object({
    name: yup.object({
        ar: yup.string().required('halaqa.validation.nameArRequired'),
        en: yup.string().required('halaqa.validation.nameEnRequired')
    }).required('halaqa.validation.nameRequired'),
    teacher_id: yup.number().required('halaqa.validation.teacherRequired').positive('halaqa.validation.teacherRequired'),
    period: yup.string().oneOf(['morning', 'evening'], 'halaqa.validation.periodInvalid').required('halaqa.validation.periodRequired'),
    start_date: yup.string().required('halaqa.validation.startDateRequired'),
    end_date: yup.string().required('halaqa.validation.endDateRequired').test(
        'is-after-start',
        'halaqa.validation.endDateAfterStart',
        function(value) {
            const { start_date } = this.parent;
            if (!start_date || !value) return true;
            return new Date(value) > new Date(start_date);
        }
    ),
    activities: yup.array().of(yup.string().oneOf(['tasbit', 'hifz', 'murajaa'])).min(1, 'halaqa.validation.activitiesRequired').required('halaqa.validation.activitiesRequired'),
    weekly_holiday: yup.array().of(
        yup.string().oneOf(HALAQA_WEEKLY_HOLIDAY_VALUES)
    ).notRequired().default([]),
    evaluation_system_type: yup.string()
        .oneOf(HALAQA_EVALUATION_SYSTEM_TYPE_VALUES)
        .required('halaqa.validation.evaluationSystemTypeRequired'),
    custom_total_mark: yup.number().when('evaluation_system_type', {
        is: 'رقمي',
        then: (schema) =>
            schema
                .typeError('halaqa.validation.customTotalMarkNumber')
                .required('halaqa.validation.customTotalMarkRequired')
                .integer('halaqa.validation.customTotalMarkInteger')
                .positive('halaqa.validation.customTotalMarkPositive'),
        otherwise: (schema) => schema.notRequired().nullable()
    }),
    max_students: yup.number()
        .typeError('halaqa.validation.maxStudentsNumber')
        .required('halaqa.validation.maxStudentsRequired')
        .integer('halaqa.validation.maxStudentsInteger')
        .positive('halaqa.validation.maxStudentsPositive'),
    session_time: yup.string().required('halaqa.validation.sessionTimeRequired').matches(/^\d{2}:\d{2}-\d{2}:\d{2}$/, 'halaqa.validation.sessionTimeFormat'),
    platform_id: yup.number().nullable().when('teaching_method', {
        is: (value: string) => value !== 'in_person',
        then: (schema) => schema.required('halaqa.validation.platformRequired').positive('halaqa.validation.platformRequired'),
        otherwise: (schema) => schema.notRequired()
    }),
    teaching_method: yup.string().oneOf(['in_person', 'remote', 'hybrid'], 'halaqa.validation.teachingMethodInvalid').required('halaqa.validation.teachingMethodRequired')
});

/**
 * Update Halaqa Form Schema
 * Only includes fields that can be updated
 */
export const updateHalaqaSchema = yup.object({
    name: yup.object({
        ar: yup.string().required('Arabic name is required'),
        en: yup.string().required('English name is required')
    }).required('Name is required'),
    teacher_id: yup.number().required('Teacher is required').positive(),
    period: yup.string().oneOf(['morning', 'evening'], 'Period must be morning or evening').required('Period is required'),
    start_date: yup.string().required('Start date is required'),
    end_date: yup.string().required('End date is required').test(
        'is-after-start',
        'End date must be after start date',
        function(value) {
            const { start_date } = this.parent;
            if (!start_date || !value) return true;
            return new Date(value) > new Date(start_date);
        }
    ),
    activities: yup.array().of(yup.string().oneOf(['tasbit', 'hifz', 'murajaa'])).min(1, 'At least one activity is required').required('Activities are required'),
    student_ids: yup.array().of(yup.number()).min(1, 'At least one student is required').required('Students are required')
});

/**
 * Create Halaqa Form Data Type
 */
export interface CreateHalaqaFormData {
    name: {
        ar: string;
        en: string;
    };
    teacher_id: number;
    period: 'morning' | 'evening';
    start_date: string;
    end_date: string;
    activities: Array<'tasbit' | 'hifz' | 'murajaa'>;
    weekly_holiday?: string[];
    evaluation_system_type: 'رقمي' | 'مئوي';
    custom_total_mark?: number;
    max_students: number;
    session_time: string;
    platform_id?: number;
    teaching_method: 'in_person' | 'remote' | 'hybrid';
}

/**
 * Update Halaqa Form Data Type
 * Only includes fields that can be updated
 */
export interface UpdateHalaqaFormData {
    name: {
        ar: string;
        en: string;
    };
    teacher_id: number;
    period: 'morning' | 'evening';
    start_date: string;
    end_date: string;
    activities: Array<'tasbit' | 'hifz' | 'murajaa'>;
    student_ids: number[];
}
