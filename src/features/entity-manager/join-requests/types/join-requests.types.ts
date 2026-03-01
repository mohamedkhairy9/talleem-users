import type { BilingualName } from '@/globals/types';

/**
 * Join request as returned from list/detail API
 */
export interface JoinRequestResponse {
    id: number;
    request_type_id?: number;
    request_type?: { id: number; name?: BilingualName };
    form?: { id: number; name?: BilingualName };
    current_phase?: { id: number; name?: BilingualName };
    status_text?: string;
    created_at?: string;
    submitted_data?: Record<string, unknown>;
}

export interface JoinRequestsListResponse {
    data: JoinRequestResponse[];
    meta?: {
        total?: number;
        current_page?: number;
        per_page?: number;
        last_page?: number;
    };
}

export interface JoinRequestsListParams {
    page?: number;
    per_page?: number;
    search?: string;
}

/**
 * Process step payload (approve / reject / need review / need upload)
 */
export type ProcessStepStatus = 1 | 2 | 3 | 4; // 1=Approved, 2=Rejected, 3=Need Review, 4=Need Upload

export interface ProcessStepPayload {
    status: ProcessStepStatus;
    notes?: string | null;
    files?: FileList | File[] | null;
}
