import * as yup from 'yup';
import { HALAQA_EVALUATION_SYSTEM_TYPES } from '../config';
const HALAQA_EVALUATION_SYSTEM_TYPE_VALUES = HALAQA_EVALUATION_SYSTEM_TYPES.map((item) => item.value);
const NUMERIC_EVALUATION_SYSTEM_TYPE = HALAQA_EVALUATION_SYSTEM_TYPES.find((item) => item.labelKey === 'halaqa.evaluationSystemTypeOptions.numeric')?.value ?? 'رقمي';

/**
 * Create Halaqa Form Schema
 */
export const createHalaqaSchema = yup.object({
    name: yup.object({
        ar: yup.string().required('halaqa.validation.nameArRequired'),
        en: yup.string().required('halaqa.validation.nameEnRequired')
    }).required('halaqa.validation.nameRequired'),
    memorization_program_entity_type_id: yup.number()
        .typeError('halaqa.validation.memorizationProgramEntityTypeRequired')
        .required('halaqa.validation.memorizationProgramEntityTypeRequired')
        .positive('halaqa.validation.memorizationProgramEntityTypeRequired'),
    teacher_id: yup.number().required('halaqa.validation.teacherRequired').positive('halaqa.validation.teacherRequired'),
    period: yup.string().oneOf(['morning', 'evening'], 'halaqa.validation.periodInvalid').required('halaqa.validation.periodRequired'),
    start_date: yup.string().required('halaqa.validation.startDateRequired'),
    end_date: yup.string().required('halaqa.validation.endDateRequired').test('is-after-start', 'halaqa.validation.endDateAfterStart', function (value) {
        const { start_date } = this.parent;
        if (!start_date || !value)
            return true;
        return new Date(value) >= new Date(start_date);
    }),
    activities: yup.array().of(yup.string().oneOf(['tasbit', 'hifz', 'murajaa'])).min(1, 'halaqa.validation.activitiesRequired').required('halaqa.validation.activitiesRequired'),
    evaluation_system_type: yup.string()
        .oneOf(HALAQA_EVALUATION_SYSTEM_TYPE_VALUES)
        .required('halaqa.validation.evaluationSystemTypeRequired'),
    total_mark: yup.number().when('evaluation_system_type', {
        is: NUMERIC_EVALUATION_SYSTEM_TYPE,
        then: (schema) => schema
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
    meeting_link: yup.string().nullable().when('teaching_method', {
        is: (value) => value !== 'in_person',
        then: (schema) => schema.required('halaqa.validation.meetingLinkRequired').url('halaqa.validation.meetingLinkInvalid'),
        otherwise: (schema) => schema.notRequired().nullable()
    }),
    platform_id: yup.number().nullable().when('teaching_method', {
        is: (value) => value !== 'in_person',
        then: (schema) => schema.required('halaqa.validation.platformRequired').positive('halaqa.validation.platformRequired'),
        otherwise: (schema) => schema.notRequired()
    }),
    teaching_method: yup.string().oneOf(['in_person', 'remote', 'hybrid'], 'halaqa.validation.teachingMethodInvalid').required('halaqa.validation.teachingMethodRequired')
});

/**
 * Update Halaqa Form Schema
 * Matches PUT /halaqas/:id contract
 */
export const updateHalaqaSchema = yup.object({
    name: yup.object({
        ar: yup.string().required('halaqa.validation.nameArRequired'),
        en: yup.string().required('halaqa.validation.nameEnRequired')
    }).required('halaqa.validation.nameRequired'),
    teacher_id: yup.number().required('halaqa.validation.teacherRequired').positive('halaqa.validation.teacherRequired'),
    period: yup.string().oneOf(['morning', 'evening'], 'halaqa.validation.periodInvalid').required('halaqa.validation.periodRequired'),
    start_date: yup.string().required('halaqa.validation.startDateRequired'),
    end_date: yup.string().required('halaqa.validation.endDateRequired').test('is-after-start', 'halaqa.validation.endDateAfterStart', function (value) {
        const { start_date } = this.parent;
        if (!start_date || !value)
            return true;
        return new Date(value) >= new Date(start_date);
    }),
    activities: yup.array().of(yup.string().oneOf(['tasbit', 'hifz', 'murajaa'])).min(1, 'halaqa.validation.activitiesRequired').required('halaqa.validation.activitiesRequired'),
    student_ids: yup.array()
        .of(yup.number().positive('halaqa.validation.studentInvalid'))
        .min(1, 'halaqa.validation.studentRequired')
        .required('halaqa.validation.studentRequired')
});
