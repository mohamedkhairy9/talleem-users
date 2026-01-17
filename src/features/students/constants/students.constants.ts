/**
 * Students Feature Constants
 */

export const STUDENT_STATUSES = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended'
} as const;

export const STUDENT_ROLES = {
    STUDENT: 'student',
    PRE_STUDENT: 'pre_student'
} as const;

export const DEFAULT_FILTERS = {
    page: 1,
    per_page: 10,
    search: '',
    status: ''
} as const;
