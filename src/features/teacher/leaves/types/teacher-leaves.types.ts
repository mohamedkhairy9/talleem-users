/**
 * Teacher Leaves API types
 * GET /teacher/leaves, POST /teacher/leaves (form-data), POST /teacher/leaves/:id/cancel
 */

import type { AppDate } from '@/globals/types';

export interface LeaveTypeOption {
    key: string;
    label: string;
}

export interface LeavePeriod {
    type: 'days' | 'hours';
    from_date?: string;
    to_date?: string;
    date?: string;
    from_time?: string;
    to_time?: string;
    display: string;
}

export interface LeaveDuration {
    value: number | string;
    unit: string;
    display: string;
}

export interface TeacherLeaveItem {
    id: number;
    leave_type: LeaveTypeOption;
    leave_sub_type: LeaveTypeOption | null;
    period: LeavePeriod;
    duration: LeaveDuration;
    status: string;
    notes: string;
    medical_report_url: string;
    /** API may return string or object with gregorian / hijri / hijri_indic */
    created_at: string | AppDate;
}

export interface TeacherLeavesListResponse {
    success: boolean;
    data: TeacherLeaveItem[];
}

export interface CreateLeaveFormValues {
    leave_type: 'leave';
    leave_sub_type: string;
    from_date: string;
    to_date: string;
    notes: string;
    medical_report?: FileList | File[] | null;
}

export interface CreatePtoFormValues {
    leave_type: 'pto';
    date: string;
    from_time: string;
    to_time: string;
    notes: string;
}

export type CreateLeavePayload = CreateLeaveFormValues | CreatePtoFormValues;
