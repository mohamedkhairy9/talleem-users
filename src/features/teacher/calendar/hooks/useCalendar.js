import { useQuery } from '@tanstack/react-query';
import { useDateFormatStore } from '@/app/stores/dateFormat.store';
import { teacherCalendarService } from '../services/calendar.service';
/**
 * Get teacher's calendar data (halaqas with start/end dates and session time)
 * GET /teacher/calendar
 */
export function useTeacherCalendar() {
    const dateFormat = useDateFormatStore((state) => state.dateFormat);

    const query = useQuery({
        queryKey: ['teacher-calendar', dateFormat],
        queryFn: () => teacherCalendarService.getCalendar(),
        staleTime: 2 * 60 * 1000
    });
    const halaqas = Array.isArray(query.data?.data?.halaqas)
        ? query.data.data.halaqas
        : [];
    return {
        ...query,
        halaqas
    };
}
