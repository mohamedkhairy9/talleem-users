import { axiosInstance } from '@/shared/api/axiosInstance';

export const userNotificationsService = {
    getUserNotifications: () => axiosInstance.get('/user-notifications'),
    markAsRead: (id) => axiosInstance.post(`/user-notifications/${id}/read`),
    markAllAsRead: () => axiosInstance.post('/user-notifications/mark-all-read')
};

export default userNotificationsService;
