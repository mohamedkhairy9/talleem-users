import { axiosInstance } from '@/api/axiosInstance';
import type {
    EntityLicensesListResponse,
    EntityCurrentLicenseResponse
} from '../types/licenses.types';

/**
 * Entity Manager Licenses Service
 * GET /entity/licenses, GET /entity/licenses/current
 */
export const entityLicensesService = {
    /**
     * Get all licenses for the current entity
     * GET /entity/licenses
     */
    getLicenses: (): Promise<EntityLicensesListResponse> => {
        return axiosInstance.get('/entity/licenses');
    },

    /**
     * Get current (active) license for the entity
     * GET /entity/licenses/current
     */
    getCurrentLicense: (): Promise<EntityCurrentLicenseResponse> => {
        return axiosInstance.get('/entity/licenses/current');
    }
};
