/**
 * Teacher Calendar API types
 * GET /teacher/calendar
 */

export interface BilingualTitle {
    ar?: string;
    en?: string;
}

export interface CalendarHalaqaItem {
    id: number;
    title: BilingualTitle;
    start_date: string;
    end_date: string;
    session_time: string;
    type: string;
}

export interface TeacherCalendarResponse {
    data: {
        halaqas: CalendarHalaqaItem[];
    };
}
