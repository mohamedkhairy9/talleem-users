/**
 * Teacher Certificates API types
 * GET /teacher/halaqas/students, GET /student-certificates/:id
 */

export interface BilingualName {
    en?: string;
    ar?: string;
}

/** Student item in GET /teacher/halaqas/students list */
export interface TeacherStudentListItem {
    id: number;
    name: BilingualName;
    national_id: string;
    halaqas: Array<{
        id: number;
        name: BilingualName;
    }>;
}

export interface TeacherStudentsListResponse {
    data: TeacherStudentListItem[];
    meta: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
    };
}

export interface TeacherStudentsListParams {
    page?: number;
    per_page?: number;
}

/** Single certificate in GET /student-certificates/:id */
export interface StudentCertificateItem {
    id: number;
    certificate_name: BilingualName;
    issued_from: string;
    issued_date: {
        gregorian?: string;
        hijri?: string;
        hijri_indic?: string;
    };
    is_active: boolean;
    image_url: string;
    created_at: { gregorian?: string; hijri?: string; hijri_indic?: string };
    updated_at: { gregorian?: string; hijri?: string; hijri_indic?: string };
}

/** Full response from GET /student-certificates/:id */
export interface StudentCertificatesDetail {
    id: number;
    name: BilingualName;
    phone: string;
    identity: BilingualName;
    main_program: {
        id: number;
        name: BilingualName;
        code: number;
        status: boolean;
        created_at?: unknown;
        updated_at?: unknown;
    };
    branch: BilingualName | string;
    certificates: StudentCertificateItem[];
}

export interface StudentCertificatesResponse {
    data: StudentCertificatesDetail;
}
