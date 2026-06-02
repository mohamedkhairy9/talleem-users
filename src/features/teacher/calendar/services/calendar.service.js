import { axiosInstance } from '@/api/axiosInstance';
/**
 * Teacher Calendar Service
 * GET /teacher/calendar
 */
export const teacherCalendarService = {
    /**
     * Get calendar data (halaqas with dates) for the current teacher
     * GET /teacher/calendar
     */
    getCalendar: () => {
        return axiosInstance.get('/teacher/calendar');
    }
};
