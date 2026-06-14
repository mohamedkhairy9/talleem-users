import { useQuery } from '@tanstack/react-query';
import { entityLicensesService } from '../services/licenses.service';

const isLicenseRecord = (value) => {
    return Boolean(value)
        && typeof value === 'object'
        && !Array.isArray(value)
        && ('license_number' in value || 'license_type' in value || 'issue_date' in value);
};

const getPayload = (response) => {
    if (response?.data?.data && !Array.isArray(response.data.data)) {
        return response.data.data;
    }

    if (response?.data !== undefined) {
        return response.data;
    }

    if (response?.item && !Array.isArray(response.item)) {
        return response.item;
    }

    return response;
};

const extractLicenseRecords = (payload) => {
    if (Array.isArray(payload)) {
        return payload.filter(isLicenseRecord);
    }

    return Object.entries(payload).reduce((licenses, [key, value]) => {
        if (isLicenseRecord(value)) {
            licenses.push({
                ...value,
                __licenseGroup: key
            });
        }

        return licenses;
    }, []);
};

const extractLicensesList = (response) => {
    const payload = getPayload(response);

    if (Array.isArray(payload?.items)) {
        return payload.items.filter(isLicenseRecord);
    }

    if (Array.isArray(payload?.data)) {
        return payload.data.filter(isLicenseRecord);
    }

    if (!payload || typeof payload !== 'object') {
        return [];
    }

    if (isLicenseRecord(payload)) {
        return [payload];
    }

    return extractLicenseRecords(payload);
};

const extractCurrentLicenses = (response) => {
    const payload = getPayload(response);

    if (Array.isArray(payload?.items)) {
        return payload.items.filter(isLicenseRecord);
    }

    if (Array.isArray(payload?.data)) {
        return payload.data.filter(isLicenseRecord);
    }

    if (Array.isArray(payload)) {
        return payload.filter(isLicenseRecord);
    }

    if (!payload || typeof payload !== 'object') {
        return [];
    }

    if (isLicenseRecord(payload)) {
        return [payload];
    }

    return extractLicenseRecords(payload);
};

const extractCurrentLicense = (response) => {
    const licenses = extractCurrentLicenses(response);
    return licenses[0] ?? null;
};

const getEntityLicenses = async () => {
    try {
        return await entityLicensesService.getLicenses();
    } catch (error) {
        try {
            return await entityLicensesService.getCurrentLicense();
        } catch {
            throw error;
        }
    }
};
/**
 * Get entity's licenses list
 * GET /entity/licenses
 */
export function useEntityLicenses() {
    const query = useQuery({
        queryKey: ['entity-licenses'],
        queryFn: getEntityLicenses,
        staleTime: 2 * 60 * 1000
    });
    const list = extractLicensesList(query.data);

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
    const currentLicenses = extractCurrentLicenses(query.data);
    const currentLicense = extractCurrentLicense(query.data);

    return {
        ...query,
        currentLicenses,
        currentLicense
    };
}
