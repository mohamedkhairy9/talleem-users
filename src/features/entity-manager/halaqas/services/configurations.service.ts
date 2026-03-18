import { axiosInstance } from '@/api/axiosInstance';
import type { HalaqaActivity } from '../config';

export interface ConfigurationItem {
    id: number;
    program: string;
    key: string;
    label?: string;
    value?: string;
    type?: string;
    // API returns an array like ["tasbit","murajaa","none"]
    options?: string[] | string;
}

export async function getConfigurations(program: string, key: string): Promise<ConfigurationItem> {
    const response = await axiosInstance.get<any>(`/configurations/${program}/key/${key}`);
    const maybeWrapped = response && typeof response === 'object' ? (response as any).data : undefined;
    const item = (maybeWrapped && typeof maybeWrapped === 'object' ? maybeWrapped : response) as ConfigurationItem;
    return item;
}

const VALID_ACTIVITIES: HalaqaActivity[] = ['tasbit', 'hifz', 'murajaa'];

/**
 * Parse auto_include_activities value (e.g. "tasbit, murajaa") into an array of HalaqaActivity.
 * Excludes "none" and any value not in tasbit | hifz | murajaa.
 */
export function parseAutoIncludeActivitiesValue(
    value: string | string[] | undefined
): HalaqaActivity[] {
    if (!value) return [];

    const asString = Array.isArray(value) ? value.join(',') : String(value);

    return asString
        .split(/[,،]/)
        .map((s) => s.trim().toLowerCase())
        .filter(
            (s) =>
                s &&
                s !== 'none' &&
                VALID_ACTIVITIES.includes(s as HalaqaActivity)
        ) as HalaqaActivity[];
}

/**
 * Get auto-include activities for tahfiz program from the configurations API.
 * Returns e.g. ['tasbit', 'murajaa'] from the config value "tasbit, murajaa".
 */
export async function getAutoIncludeActivitiesForTahfiz(): Promise<HalaqaActivity[]> {
    const item = await getConfigurations('tahfiz', 'auto_include_activities');
    const raw = item?.value ?? (item?.options ?? undefined);
    return parseAutoIncludeActivitiesValue(raw);
}
