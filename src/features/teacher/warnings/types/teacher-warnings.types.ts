/**
 * Teacher Warnings API types
 * GET /teacher/warnings - read-only list for teacher role
 */

export interface BilingualName {
    en?: string;
    ar?: string;
}

export interface TeacherWarningBranch {
    id: number;
    name: BilingualName;
    city_id?: number;
    neighborhood_id?: number;
    code?: number;
    status?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface TeacherWarningProgram {
    id: number;
    name: BilingualName;
    code?: number;
    status?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface TeacherWarningReason {
    id: number;
    name: BilingualName;
    main_program_id?: number;
    status?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface TeacherWarningCreatedBy {
    id: number;
    name: BilingualName;
}

/** Teacher object as returned in warning (subset) */
export interface TeacherWarningTeacher {
    id: number;
    user_id?: number;
    name: BilingualName;
    status?: string;
    licence_number?: string;
    national_id?: string;
    email?: string;
    [key: string]: unknown;
}

export interface TeacherWarningResponse {
    id: number;
    branch: TeacherWarningBranch;
    program: TeacherWarningProgram;
    teacher: TeacherWarningTeacher | null;
    warning_reason: TeacherWarningReason;
    warning_type: 'student' | 'teacher' | 'entity';
    date: string;
    note: string;
    status: boolean;
    created_by: TeacherWarningCreatedBy;
    updated_by: TeacherWarningCreatedBy | null;
    created_at: string;
    updated_at: string;
}

export interface TeacherWarningsListResponse {
    data: TeacherWarningResponse[];
    meta: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
    };
}

export interface TeacherWarningsListParams {
    page?: number;
    per_page?: number;
}
