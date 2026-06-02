import { useQuery } from '@tanstack/react-query';
import { teacherLicensesService } from '../services/licenses.service';
/**
 * Get teacher's licenses list
 * GET /teacher/licenses
 */
export function useTeacherLicenses() {
    const query = useQuery({
        queryKey: ['teacher-licenses'],
        queryFn: () => teacherLicensesService.getLicenses(),
        staleTime: 2 * 60 * 1000
    });
    const list = Array.isArray(query.data?.data) ? query.data.data : [];
    return {
        ...query,
        list
    };
}
/**
 * Get teacher's current (active) license
 * GET /teacher/licenses/current
 */
export function useTeacherCurrentLicense() {
    const query = useQuery({
        queryKey: ['teacher-licenses-current'],
        queryFn: () => teacherLicensesService.getCurrentLicense(),
        staleTime: 2 * 60 * 1000
    });
    const currentLicense = query.data?.data ?? null;
    return {
        ...query,
        currentLicense
    };
}
