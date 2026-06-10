/**
 * Warning Configuration
 * Static options for Warning form with localization keys
 */
export const WARNING_FORM_TYPES = [
    { value: 'student', labelKey: 'warning.type.student' },
    { value: 'teacher', labelKey: 'warning.type.teacher' }
];
export const WARNING_FILTER_TYPES = [
    ...WARNING_FORM_TYPES,
    { value: 'entity', labelKey: 'warning.type.entity' }
];
export const WARNING_STATUS_OPTIONS = [
    { value: true, labelKey: 'common.active' },
    { value: false, labelKey: 'common.inactive' }
];
