/**
 * Teacher Halaqa Students API types
 * Response structure: { halaqa: {...}, students: [...], attendance_types: [], date: string, time: string }
 */

import type { Halaqa, BilingualName } from './list.types';

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
}

export interface TeacherHalaqaStudentsResponse {
    halaqa: Halaqa;
    students: HalaqaStudent[];
    attendance_types: AttendanceType[];
    date: string;
    time: string;
}

