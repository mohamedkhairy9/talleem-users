import { useQuery } from '@tanstack/react-query';
import { teacherCalendarService } from '../services/calendar.service';
import type { CalendarHalaqaItem } from '../types/calendar.types';

/**
 * Get teacher's calendar data (halaqas with start/end dates and session time)
 * GET /teacher/calendar
 */
export function useTeacherCalendar() {
    const query = useQuery({
        queryKey: ['teacher-calendar'],
        queryFn: () => teacherCalendarService.getCalendar(),
        staleTime: 2 * 60 * 1000
    });

    const halaqas: CalendarHalaqaItem[] = Array.isArray(query.data?.data?.halaqas)
        ? query.data.data.halaqas
        : [];

    return {
        ...query,
        halaqas
    };
}
