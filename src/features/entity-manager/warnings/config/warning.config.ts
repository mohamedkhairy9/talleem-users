/**
 * Warning Configuration
 * Static options for Warning form with localization keys
 */

export const WARNING_TYPES = [
    { value: 'student', labelKey: 'warning.type.student' },
    { value: 'teacher', labelKey: 'warning.type.teacher' }
] as const;

export const WARNING_STATUS_OPTIONS = [
    { value: true, labelKey: 'common.active' },
    { value: false, labelKey: 'common.inactive' }
] as const;

export type WarningType = typeof WARNING_TYPES[number]['value'];
export type WarningStatus = typeof WARNING_STATUS_OPTIONS[number]['value'];

