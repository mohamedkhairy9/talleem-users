import { axiosInstance } from '@/api/axiosInstance';
import type { TeacherCalendarResponse } from '../types/calendar.types';

/**
 * Teacher Calendar Service
 * GET /teacher/calendar
 */
export const teacherCalendarService = {
    /**
     * Get calendar data (halaqas with dates) for the current teacher
     * GET /teacher/calendar
     */
    getCalendar: (): Promise<TeacherCalendarResponse> => {
        return axiosInstance.get('/teacher/calendar');
    }
};
