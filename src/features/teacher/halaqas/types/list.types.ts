/**
 * Teacher Halaqas API types
 * Response structure: { data: TeacherHalaqaItem[] }
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

export interface Teacher {
    id: number;
    name?: BilingualName;
}

export interface Platform {
    id: number;
    name?: BilingualName;
}

export interface Student {
    id: number;
    name?: BilingualName;
    joined_at?: AppDate | string;
}

export interface DailyScheduleItem {
    day: number;
    date: AppDate | string;
    text: string;
    to_text: string;
    day_name: string;
    from_text: string;
    to_verse_id: number;
    from_verse_id: number;
}

export interface Plan {
    id: number;
    activity: 'hifz' | 'tasbit' | 'murajaa';
    plan_type: 'daily_amount' | 'start_end';
    unit: 'segments' | 'parts' | 'surahs';
    direction: 'incremental' | 'decremental';
    daily_amount: number;
    start_verse_id: number;
    end_verse_id: number;
    daily_schedule: DailyScheduleItem[];
}

export interface Halaqa {
    id: number;
    name?: BilingualName;
    memorization_program_entity_type?: MemorizationProgramEntityType;
    period?: string;
    teacher?: Teacher;
    start_date?: AppDate | string;
    end_date?: AppDate | string;
    duration_in_days?: number;
    weekly_holiday?: string;
    evaluation_system?: string;
    total_mark?: number;
    teaching_method?: string;
    platform?: Platform;
    max_students?: number;
    current_students_count?: number;
    activities?: string[];
    session_time?: string;
    session_from?: string;
    session_to?: string;
    students?: Student[];
    plans?: Plan[];
}

export interface TeacherHalaqaItem {
    halaqa: Halaqa;
    can_record: boolean;
    current_time: string;
}

/** API response shape: { data: TeacherHalaqaItem[] } */
export interface TeacherHalaqasListResponse {
    data: TeacherHalaqaItem[];
}

