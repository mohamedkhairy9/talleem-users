import { axiosInstance } from '@/shared/api/axiosInstance';

export const entityManagerCalendarService = {
    getCalendar: (params = {}) => {
        return axiosInstance.get('/entity-manager/calendar', { params });
    }
};

export default entityManagerCalendarService;
