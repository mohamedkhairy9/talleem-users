import { axiosInstance } from '@/shared/api/axiosInstance';
export async function getConfigurations(program, key) {
    const response = await axiosInstance.get(`/configurations/${program}/key/${key}`);
    const maybeWrapped = response && typeof response === 'object' ? response.data : undefined;
    const item = (maybeWrapped && typeof maybeWrapped === 'object' ? maybeWrapped : response);
    return item;
}
const VALID_ACTIVITIES = ['tasbit', 'hifz', 'murajaa'];
/**
 * Parse auto_include_activities value (e.g. "tasbit, murajaa") into an array of HalaqaActivity.
 * Excludes "none" and any value not in tasbit | hifz | murajaa.
 */
export function parseAutoIncludeActivitiesValue(value) {
    if (!value)
        return [];
    const asString = Array.isArray(value) ? value.join(',') : String(value);
    return asString
        .split(/[,،]/)
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s &&
        s !== 'none' &&
        VALID_ACTIVITIES.includes(s));
}
/**
 * Get auto-include activities for tahfiz program from the configurations API.
 * Returns e.g. ['tasbit', 'murajaa'] from the config value "tasbit, murajaa".
 */
export async function getAutoIncludeActivitiesForTahfiz() {
    const item = await getConfigurations('tahfiz', 'auto_include_activities');
    const raw = item?.value ?? (item?.options ?? undefined);
    return parseAutoIncludeActivitiesValue(raw);
}
