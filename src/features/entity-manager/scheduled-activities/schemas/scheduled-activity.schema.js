import * as yup from 'yup';

export const RESPONSIBLE_VALUES = ['entity', 'branch', 'general_management'];
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

export const createScheduledActivitySchema = yup.object({
    name: yup
        .string()
        .trim()
        .required('scheduledActivities.validation.nameRequired'),
    date_from: yup.string().required('scheduledActivities.validation.dateFromRequired'),
    date_to: yup
        .string()
        .required('scheduledActivities.validation.dateToRequired')
        .test('is-after-start', 'scheduledActivities.validation.dateToAfterFrom', function validateEndDate(value) {
            const { date_from: dateFrom } = this.parent;
            if (!dateFrom || !value) {
                return true;
            }

            return new Date(value) >= new Date(dateFrom);
        }),
    time_from: yup
        .string()
        .required('scheduledActivities.validation.timeFromRequired')
        .matches(TIME_24H_REGEX, 'scheduledActivities.validation.timeFromRequired'),
    time_to: yup
        .string()
        .required('scheduledActivities.validation.timeToRequired')
        .matches(TIME_24H_REGEX, 'scheduledActivities.validation.timeToRequired')
        .test('end-after-start', 'scheduledActivities.validation.timeToAfterFrom', function validateEndTime(value) {
            const { time_from: timeFrom } = this.parent;
            const startMinutes = toMinutes(timeFrom);
            const endMinutes = toMinutes(value);

            if (startMinutes == null || endMinutes == null) {
                return true;
            }

            return endMinutes >= startMinutes;
        }),
    responsible: yup
        .string()
        .oneOf(RESPONSIBLE_VALUES, 'scheduledActivities.validation.responsibleInvalid')
        .required('scheduledActivities.validation.responsibleRequired'),
    teacher_ids: yup.array().of(
        yup
            .number()
            .transform(transformNumber)
            .integer()
            .positive()
    ),
    student_ids: yup
        .array()
        .of(
            yup
                .number()
                .transform(transformNumber)
                .typeError('scheduledActivities.validation.studentRequired')
                .integer('scheduledActivities.validation.studentRequired')
                .positive('scheduledActivities.validation.studentRequired')
                .required('scheduledActivities.validation.studentRequired')
        )
        .min(1, 'scheduledActivities.validation.studentsMin')
        .test('unique-student', 'scheduledActivities.validation.studentUnique', (value) => {
            const studentIds = (value || []).filter((studentId) => studentId != null);
            return new Set(studentIds).size === studentIds.length;
        })
        .required('scheduledActivities.validation.studentsMin')
});

export const DEFAULT_SCHEDULED_ACTIVITY_VALUES = {
    name: '',
    date_from: '',
    date_to: '',
    time_from: '',
    time_to: '',
    responsible: 'entity',
    teacher_ids: [],
    student_ids: []
};

