import { axiosInstance } from '@/shared/api/axiosInstance';

const ACCOUNT_TYPE_ENDPOINTS = {
    teacher: '/entity-manager/mirror/teachers',
    student: '/entity-manager/mirror/students'
};

const STUDENT_SECTION_ENDPOINTS = {
    profile: 'profile',
    plans: 'plans',
    grades: 'grades',
    certificates: 'certificates',
    absences: 'absences',
    warnings: 'warnings',
    requests: 'requests'
};

const TEACHER_SECTION_ENDPOINTS = {
    profile: 'profile',
    currentLicense: 'licenses/current',
    halaqas: 'halaqas',
    warnings: 'warnings',
    leaves: 'leaves',
    absences: 'absences',
    requests: 'requests'
};

function resolveEndpoint(accountType) {
    return ACCOUNT_TYPE_ENDPOINTS[accountType] ?? ACCOUNT_TYPE_ENDPOINTS.teacher;
}

function resolveStudentSectionEndpoint(studentId, sectionKey) {
    const resolvedSection = STUDENT_SECTION_ENDPOINTS[sectionKey] ?? STUDENT_SECTION_ENDPOINTS.profile;
    return `/entity-manager/mirror/students/${studentId}/${resolvedSection}`;
}

function resolveTeacherSectionEndpoint(teacherId, sectionKey) {
    const resolvedSection = TEACHER_SECTION_ENDPOINTS[sectionKey] ?? TEACHER_SECTION_ENDPOINTS.profile;
    return `/entity-manager/mirror/teachers/${teacherId}/${resolvedSection}`;
}

function resolveTeacherStudentNestedEndpoint(teacherId, halaqaId, studentId, sectionKey) {
    const resolvedSection = sectionKey === 'history' ? 'history' : 'plan';
    return `/entity-manager/mirror/teachers/${teacherId}/halaqas/${halaqaId}/students/${studentId}/${resolvedSection}`;
}

export const accountManagementService = {
    getAccounts: (accountType = 'teacher', params = {}) => {
        return axiosInstance.get(resolveEndpoint(accountType), { params });
    },
    getStudentSection: (studentId, sectionKey) => {
        return axiosInstance.get(resolveStudentSectionEndpoint(studentId, sectionKey));
    },
    getTeacherSection: (teacherId, sectionKey) => {
        return axiosInstance.get(resolveTeacherSectionEndpoint(teacherId, sectionKey));
    },
    getTeacherStudentNestedSection: (teacherId, halaqaId, studentId, sectionKey) => {
        return axiosInstance.get(resolveTeacherStudentNestedEndpoint(teacherId, halaqaId, studentId, sectionKey));
    }
};
