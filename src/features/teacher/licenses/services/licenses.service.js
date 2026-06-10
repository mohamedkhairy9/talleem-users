import { axiosInstance } from '@/shared/api/axiosInstance';
/**
 * Teacher Licenses Service
 * GET /teacher/licenses, GET /teacher/licenses/current
 */
export const teacherLicensesService = {
    /**
     * Get all licenses for the current teacher
     * GET /teacher/licenses
     */
    getLicenses: () => {
        return axiosInstance.get('/teacher/licenses');
    },
    /**
     * Get current (active) license for the teacher
     * GET /teacher/licenses/current
     */
    getCurrentLicense: () => {
        return axiosInstance.get('/teacher/licenses/current');
    }
};
