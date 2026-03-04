/**
 * Teacher Requests API types
 * GET /teacher-requests, POST /teacher-requests, GET /request-types
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
