/**
 * Halaqas list API types
 * Centralized and extensible for pagination and filters
 */

export interface BilingualName {
    en?: string;
    ar?: string;
}

export interface MemorizationProgramEntityType {
    id: number;
    name?: BilingualName;
    code?: number;
}

export interface HalaqaListItem {
    id: number;
    name?: BilingualName;
    memorization_program_entity_type?: MemorizationProgramEntityType;
    period?: string;
    teacher?: { id: number; name?: BilingualName };
    start_date?: string;
    end_date?: string;
    duration_in_days?: number;
    weekly_holiday?: string;
    evaluation_system?: string;
    total_mark?: number;
    teaching_method?: string;
    platform?: { id: number; name?: BilingualName };
    max_students?: number;
    current_students_count?: number;
    activities?: string[];
    session_time?: string;
    session_from?: string;
    session_to?: string;
    students?: Array<{ id: number; name?: BilingualName; joined_at?: string }>;
    plans?: unknown[];
    [key: string]: unknown;
}

/** API meta for paginated list */
export interface HalaqasListMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from?: number;
    to?: number;
}

/** Params for GET /halaqas - pagination + filters (easy to extend) */
export interface HalaqasListParams {
    page?: number;
    per_page?: number;
    search?: string;
    period?: string;
    teacher_id?: number;
    platform_id?: number;
    teaching_method?: string;
    start_date_from?: string;
    start_date_to?: string;
    [key: string]: string | number | undefined;
}

/** API response shape: { data: Halaqa[], meta: HalaqasListMeta } */
export interface HalaqasListResponse {
    data: HalaqaListItem[];
    meta?: HalaqasListMeta;
}
