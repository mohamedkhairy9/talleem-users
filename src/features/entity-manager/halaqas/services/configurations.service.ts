import { axiosInstance } from '@/api/axiosInstance';
import type { HalaqaActivity } from '../config';

export interface ConfigurationItem {
    id: number;
    program: string;
    key: string;
    label?: string;
    value?: string;
    type?: string;
    options?: string;
}

export interface ConfigurationsResponse {
    program: string;
    data: ConfigurationItem[][];
}

/**
 * Fetch configurations for a program and key.
 * GET /configurations?program=tahfiz&key=auto_include_activities
 */
export async function getConfigurations(program: string, key: string): Promise<ConfigurationsResponse> {
    const { data } = await axiosInstance.get<ConfigurationsResponse>('/configurations', {
        params: { program, key }
    });
    return data;
}

const VALID_ACTIVITIES: HalaqaActivity[] = ['tasbit', 'hifz', 'murajaa'];

/**
 * Parse auto_include_activities value (e.g. "tasbit, murajaa") into an array of HalaqaActivity.
 * Excludes "none" and any value not in tasbit | hifz | murajaa.
 */
export function parseAutoIncludeActivitiesValue(value: string | undefined): HalaqaActivity[] {
    if (!value || typeof value !== 'string') return [];
    return value
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s && s !== 'none' && VALID_ACTIVITIES.includes(s as HalaqaActivity)) as HalaqaActivity[];
}

/**
 * Get auto-include activities for tahfiz program from the configurations API.
 * Returns e.g. ['tasbit', 'murajaa'] from the config value "tasbit, murajaa".
 */
export async function getAutoIncludeActivitiesForTahfiz(): Promise<HalaqaActivity[]> {
    const res = await getConfigurations('tahfiz', 'auto_include_activities');
    const firstRow = res?.data?.[0];
    const item = Array.isArray(firstRow) ? firstRow[0] : firstRow;
    const value = item && typeof item === 'object' && 'value' in item ? (item as ConfigurationItem).value : undefined;
    return parseAutoIncludeActivitiesValue(value);
}
