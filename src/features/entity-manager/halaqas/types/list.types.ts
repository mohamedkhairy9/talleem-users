/**
 * Halaqas list API types
 * Centralized and extensible for pagination and filters
 */

import type { AppDate } from '@/globals/types';

export interface BilingualName {
    en?: string;
    ar?: string;
}

export interface MemorizationProgramEntityType {
    id: number;
    name?: BilingualName;
    code?: number;
}

/**
 * Full Student object structure as returned in plan data
 */
export interface Student {
    id: number;
    name?: BilingualName;
    user_id?: number;
    main_program_id?: number;
    education_program_entity_type_id?: number | null;
    branch_id?: number;
    memorization_program_entity_type_id?: number;
    registration_date?: string;
    entity_id?: number;
    national_id?: string;
    phone?: string;
    nationality_id?: number;
    email?: string;
    specification_id?: number;
    school_name?: string;
    city_id?: number;
    address?: string;
    date_of_birth?: string;
    has_medical_issues?: boolean;
    issue_description?: string;
    academic_level_id?: number;
    status?: boolean;
    gender?: string;
    created_at?: string;
    updated_at?: string;
    joined_at?: AppDate | string;
}

/**
 * Daily schedule item structure
 */
export interface DailyScheduleItem {
    day: number;
    date: AppDate | string;
    text: string;
    to_text: string;
    day_name: string;
    from_text: string;
    to_verse_key: string; // Format: "surah:ayah" (e.g., "1:2")
    from_verse_key: string; // Format: "surah:ayah" (e.g., "1:1")
    juz_numbers?: number[];
}

/**
 * Plan interface with full student object support
 */
export interface Plan {
    id?: number;
    activity: string;
    student_id?: number;
    student?: Student; // Full student object from plan data
    students?: Student[]; // Array of students (for multiple students per plan)
    plan_type: string;
    unit: string;
    direction: string;
    daily_amount?: number;
    start_verse_key?: string; // Format: "surah:ayah" (e.g., "1:1")
    end_verse_key?: string; // Format: "surah:ayah" (e.g., "1:2")
    daily_schedule?: DailyScheduleItem[];
}

/** Student with missing plans (from halaqa detail API) */
export interface StudentWithMissingPlans {
    student_id: number;
    student_name: BilingualName;
    missing_activities: string[];
}

export interface HalaqaListItem {
    id: number;
    name?: BilingualName;
    memorization_program_entity_type?: MemorizationProgramEntityType;
    period?: string;
    teacher?: { id: number; name?: BilingualName };
    start_date?: AppDate | string;
    end_date?: AppDate | string;
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
    students?: Student[];
    plans?: Plan[];
    students_with_missing_plans?: StudentWithMissingPlans[];
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
