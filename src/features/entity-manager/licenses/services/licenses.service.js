import { axiosInstance } from '@/shared/api/axiosInstance';
/**
 * Entity Manager Licenses Service
 * GET /entity/licenses, GET /entity/licenses/current
 */
export const entityLicensesService = {
    /**
     * Get all licenses for the current entity
     * GET /entity/licenses
     */
    getLicenses: () => {
        return axiosInstance.get('/entity/licenses');
    },
    /**
     * Get current (active) license for the entity
     * GET /entity/licenses/current
     */
    getCurrentLicense: () => {
        return axiosInstance.get('/entity/licenses/current');
    }
};
