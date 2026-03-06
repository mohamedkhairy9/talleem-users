/**
 * Teacher Requests API types
 * GET /teacher-requests, POST /teacher-requests, GET /teacher-requests/request-types
 */

import type { BilingualName } from '@/features/teacher/halaqas/types/list.types';

export interface RequestTypeOption {
    id: number;
    name: BilingualName;
    status?: boolean;
    created_at?: { gregorian?: string; hijri?: string; hijri_indic?: string };
    updated_at?: { gregorian?: string; hijri?: string; hijri_indic?: string };
}

export interface RequestTypesListResponse {
    data: RequestTypeOption[];
}

export interface TeacherRequestCurrentPhase {
    id: number;
    name: BilingualName;
    order?: number;
}

export interface TeacherRequestCurrentStep {
    id: number;
    name: BilingualName;
    order?: number;
    step_type?: string;
    assigned_to_type?: string;
    assigned_to_id?: number;
    assigned_to?: { id: number; name: string };
}

export interface TeacherRequestItem {
    id: number;
    request_type_id: number;
    request_type: {
        id: number;
        name: BilingualName;
    };
    join_request_form_id: number | null;
    last_status: number;
    request_status: number;
    status_text: string;
    current_phase: TeacherRequestCurrentPhase | null;
    current_step: TeacherRequestCurrentStep | null;
    submitted_data: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
}

/** Single request detail from GET /teacher-requests/:id */
export interface TeacherRequestDetail {
    id: number;
    request_type_id: number;
    request_type: { id: number; name: BilingualName };
    join_request_form_id: number | null;
    files: unknown[];
    profile_image: string | null;
    last_status: number;
    request_status: number;
    status_text: string;
    current_phase: TeacherRequestCurrentPhase | null;
    current_step: TeacherRequestCurrentStep | null;
    submitted_data: Record<string, unknown> | null;
    created_at: string | BilingualDate;
    updated_at: string | BilingualDate;
}

export interface BilingualDate {
    gregorian?: string;
    hijri?: string;
    hijri_indic?: string;
}

export interface TeacherRequestDetailResponse {
    data: TeacherRequestDetail;
}

export interface TeacherRequestsListResponse {
    data: TeacherRequestItem[];
    meta: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
    };
}

export interface TeacherRequestsListParams {
    page?: number;
    per_page?: number;
}

export interface CreateTeacherRequestPayload {
    request_type_id: number;
    submitted_data: Record<string, unknown>[];
}

/** Dynamic form field from GET /join-request-forms/:id (data.fields) */
export interface JoinRequestFormField {
    key: string;
    label: string;
    type: string;
    required?: boolean;
    default?: string;
    order?: number;
    /** For select: field key this one depends on (e.g. entity depends on branch) */
    depends_on?: { field: string };
}

/** Response from GET /join-request-forms/:id */
export interface JoinRequestForm {
    id: number;
    name: BilingualName;
    description?: BilingualName;
    data: {
        fields: JoinRequestFormField[];
    };
    status?: number;
    created_at?: { gregorian?: string; hijri?: string; hijri_indic?: string };
}

export interface JoinRequestFormResponse {
    id: number;
    name: BilingualName;
    description?: BilingualName;
    data: {
        fields: JoinRequestFormField[];
    };
    status?: number;
    created_at?: { gregorian?: string; hijri?: string; hijri_indic?: string };
}
