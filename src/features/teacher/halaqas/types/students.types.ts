/**
 * Teacher Halaqa Students API types
 * Response structure: { halaqa: {...}, students: [...], attendance_types: [], date: string, time: string }
 */

import type { Halaqa, BilingualName } from './list.types';

// Re-export BilingualName for convenience
export type { BilingualName };

export interface AttendanceType {
    id: number;
    name?: BilingualName;
    [key: string]: unknown;
}

export interface HalaqaStudent {
    id: number;
    name?: BilingualName;
    is_present: boolean | null;
    attendance_type_id: number | null;
    can_memorize: boolean;
    activities?: string[];
}

export interface TeacherHalaqaStudentsResponse {
    halaqa: Halaqa;
    students: HalaqaStudent[];
    attendance_types: AttendanceType[];
    date: string;
    time: string;
}

export interface TodaySchedule {
    day_number: number;
    date: string;
    day_name_ar: string;
    day_name_en: string;
    juz_numbers: number[];
    from_verse_id: number;
    to_verse_id: number;
    text: string;
}

export interface StudentPlanResponse {
    plan: {
        id: number;
        activity: string;
        daily_amount: number;
        unit: string;
        direction: string;
    };
    today_schedule: TodaySchedule;
    evaluation_system: string;
    total_mark: number;
}

