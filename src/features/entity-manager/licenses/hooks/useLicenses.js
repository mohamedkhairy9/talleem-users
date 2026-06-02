import { useQuery } from '@tanstack/react-query';
import { entityLicensesService } from '../services/licenses.service';
/**
 * Get entity's licenses list
 * GET /entity/licenses
 */
export function useEntityLicenses() {
    const query = useQuery({
        queryKey: ['entity-licenses'],
        queryFn: () => entityLicensesService.getLicenses(),
        staleTime: 2 * 60 * 1000
    });
    const list = Array.isArray(query.data?.data) ? query.data.data : [];
    return {
        ...query,
        list
    };
}
/**
 * Get entity's current (active) license
 * GET /entity/licenses/current
 */
export function useEntityCurrentLicense() {
    const query = useQuery({
        queryKey: ['entity-licenses-current'],
        queryFn: () => entityLicensesService.getCurrentLicense(),
        staleTime: 2 * 60 * 1000
    });
    const currentLicense = query.data?.data ?? null;
    return {
        ...query,
        currentLicense
    };
}
