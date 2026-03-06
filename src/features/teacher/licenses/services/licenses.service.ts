import { axiosInstance } from '@/api/axiosInstance';
import type {
    TeacherLicensesListResponse,
    TeacherCurrentLicenseResponse
} from '../types/licenses.types';

/**
 * Teacher Licenses Service
 * GET /teacher/licenses, GET /teacher/licenses/current
 */
export const teacherLicensesService = {
    /**
     * Get all licenses for the current teacher
     * GET /teacher/licenses
     */
    getLicenses: (): Promise<TeacherLicensesListResponse> => {
        return axiosInstance.get('/teacher/licenses');
    },

    /**
     * Get current (active) license for the teacher
     * GET /teacher/licenses/current
     */
    getCurrentLicense: (): Promise<TeacherCurrentLicenseResponse> => {
        return axiosInstance.get('/teacher/licenses/current');
    }
};
