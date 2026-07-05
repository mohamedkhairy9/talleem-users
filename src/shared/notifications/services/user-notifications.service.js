import { axiosInstance } from '@/shared/api/axiosInstance';

export const userNotificationsService = {
    getUserNotifications: () => axiosInstance.get('/user-notifications'),
    markAsRead: (id) => axiosInstance.patch(`/user-notifications/${id}/read`),
    markAllAsRead: () => axiosInstance.patch('/user-notifications/mark-all-read')
};

export default userNotificationsService;
