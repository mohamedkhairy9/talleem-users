import { axiosInstance } from '@/shared/api/axiosInstance';

function buildQueryParams(params = {}) {
    const result = {};

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
            result[key] = value;
        }
    });

    return result;
}

export const scheduledActivitiesService = {
    getScheduledActivities: (params = {}) => {
        const queryParams = buildQueryParams(params);
        return axiosInstance.get('/scheduled-activities', { params: queryParams });
    },
    getScheduledActivity: (activityId) => axiosInstance.get(`/scheduled-activities/${activityId}`),
    updateScheduledActivity: (activityId, data) => axiosInstance.put(`/scheduled-activities/${activityId}`, data),
    deleteScheduledActivity: (activityId) => axiosInstance.delete(`/scheduled-activities/${activityId}`),
    createScheduledActivity: (data) => axiosInstance.post('/scheduled-activities', data)
};

