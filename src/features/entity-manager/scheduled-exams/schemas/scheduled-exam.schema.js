import * as yup from 'yup';

export const RESPONSIBLE_VALUES = ['entity', 'branch', 'general_management'];
export const METHOD_VALUES = ['in_person', 'remote'];

const JUZ_MIN = 1;
const JUZ_MAX = 30;
const TIME_24H_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

function transformNumber(value, originalValue) {
    if (originalValue === '' || originalValue == null) {
        return undefined;
    }

    const parsed = Number(originalValue);
    return Number.isNaN(parsed) ? value : parsed;
}

function toMinutes(value) {
    if (!value || !TIME_24H_REGEX.test(value)) {
        return null;
    }

    const [hours, minutes] = value.split(':').map(Number);
    return (hours * 60) + minutes;
}

const juzNumbersSchema = yup
    .array()
    .of(
        yup
            .number()
            .transform(transformNumber)
            .integer('scheduledExams.validation.juzInvalid')
            .min(JUZ_MIN, 'scheduledExams.validation.juzInvalid')
            .max(JUZ_MAX, 'scheduledExams.validation.juzInvalid')
            .required('scheduledExams.validation.juzRequired')
    )
    .min(1, 'scheduledExams.validation.juzRequired')
    .required('scheduledExams.validation.juzRequired');

const studentSchema = yup.object({
    student_id: yup
        .number()
        .transform(transformNumber)
        .typeError('scheduledExams.validation.studentRequired')
        .integer('scheduledExams.validation.studentRequired')
        .positive('scheduledExams.validation.studentRequired')
        .required('scheduledExams.validation.studentRequired'),
    juz_numbers: juzNumbersSchema
});

export const createScheduledExamSchema = yup.object({
    exam_segment_id: yup
        .number()
        .transform(transformNumber)
        .typeError('scheduledExams.validation.segmentRequired')
        .integer('scheduledExams.validation.segmentRequired')
        .positive('scheduledExams.validation.segmentPositive')
        .required('scheduledExams.validation.segmentRequired'),
    exam_date: yup.string().required('scheduledExams.validation.dateRequired'),
    time_from: yup
        .string()
        .required('scheduledExams.validation.timeFromRequired')
        .matches(TIME_24H_REGEX, 'scheduledExams.validation.timeFromRequired'),
    time_to: yup
        .string()
        .required('scheduledExams.validation.timeToRequired')
        .matches(TIME_24H_REGEX, 'scheduledExams.validation.timeToRequired')
        .test('end-after-start', 'scheduledExams.validation.timeToAfterFrom', function validateEndTime(value) {
            const { time_from: timeFrom } = this.parent;
            const startMinutes = toMinutes(timeFrom);
            const endMinutes = toMinutes(value);

            if (startMinutes == null || endMinutes == null) {
                return true;
            }

            return endMinutes > startMinutes;
        }),
    responsible: yup
        .string()
        .oneOf(RESPONSIBLE_VALUES, 'scheduledExams.validation.responsibleInvalid')
        .required('scheduledExams.validation.responsibleRequired'),
    method: yup
        .string()
        .oneOf(METHOD_VALUES, 'scheduledExams.validation.methodInvalid')
        .required('scheduledExams.validation.methodRequired'),
    location: yup
        .string()
        .trim()
        .notRequired(),
    remote_platform_id: yup
        .number()
        .transform(transformNumber)
        .nullable()
        .when('method', {
            is: 'remote',
            then: (schema) => schema
                .typeError('scheduledExams.validation.platformRequired')
                .integer('scheduledExams.validation.platformRequired')
                .positive('scheduledExams.validation.platformRequired')
                .required('scheduledExams.validation.platformRequired'),
            otherwise: (schema) => schema.notRequired().nullable()
        }),
    remote_link: yup
        .string()
        .trim()
        .when('method', {
            is: 'remote',
            then: (schema) => schema
                .required('scheduledExams.validation.remoteLinkRequired')
                .url('scheduledExams.validation.remoteLocationUrl'),
            otherwise: (schema) => schema.notRequired()
        }),
    teacher_ids: yup.array().of(
        yup
            .number()
            .transform(transformNumber)
            .integer()
            .positive()
    ),
    students: yup
        .array()
        .of(studentSchema)
        .min(1, 'scheduledExams.validation.studentsMin')
        .test('unique-student', 'scheduledExams.validation.studentUnique', (value) => {
            const studentIds = (value || [])
                .map((student) => student?.student_id)
                .filter((studentId) => studentId != null);

            return new Set(studentIds).size === studentIds.length;
        })
        .required('scheduledExams.validation.studentsMin')
});

export const DEFAULT_SCHEDULED_EXAM_VALUES = {
    exam_segment_id: '',
    exam_date: '',
    time_from: '',
    time_to: '',
    responsible: 'entity',
    method: 'in_person',
    location: '',
    remote_platform_id: null,
    remote_link: '',
    teacher_ids: [],
    students: [
        {
            student_id: null,
            juz_numbers: []
        }
    ]
};
