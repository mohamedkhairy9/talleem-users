import { axiosInstance } from '@/shared/api/axiosInstance';
export async function getConfigurations(program, key) {
    const response = await axiosInstance.get(`/configurations/${program}/key/${key}`);
    const maybeWrapped = response && typeof response === 'object' ? response.data : undefined;
    const item = (maybeWrapped && typeof maybeWrapped === 'object' ? maybeWrapped : response);
    return item;
}

function getConfigurationRawValue(item) {
    return item?.value ?? item?.options ?? undefined;
}

function parseBooleanFlagValue(value) {
    return String(value ?? '').trim() === '1';
}

function parseNumericValue(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function parseStringArrayValue(value) {
    if (!value) {
        return [];
    }

    const asString = Array.isArray(value) ? value.join(',') : String(value);
    return asString
        .split(/[,،]/)
        .map((item) => item.trim())
        .filter(Boolean);
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
    const raw = getConfigurationRawValue(item);
    return parseAutoIncludeActivitiesValue(raw);
}

export async function getTotalMarkForTahfiz() {
    const item = await getConfigurations('tahfiz', 'total_mark');
    return parseNumericValue(getConfigurationRawValue(item));
}

export async function getEditableEvaluationSystemForTahfiz() {
    const item = await getConfigurations('tahfiz', 'editable_evaluation_system');
    return parseBooleanFlagValue(getConfigurationRawValue(item));
}

export async function getMaxStudentsPerHalaqaForTahfiz() {
    const item = await getConfigurations('tahfiz', 'max_students_per_halaqa');
    return parseNumericValue(getConfigurationRawValue(item));
}

export async function getEditableMaxStudentsForTahfiz() {
    const item = await getConfigurations('tahfiz', 'editable_max_students');
    return parseBooleanFlagValue(getConfigurationRawValue(item));
}

export async function getWeeklyHolidayForTahfiz() {
    const item = await getConfigurations('tahfiz', 'weekly_holiday');
    return parseStringArrayValue(getConfigurationRawValue(item));
}

export async function getEditableWeeklyHolidayForTahfiz() {
    const item = await getConfigurations('tahfiz', 'editable_weekly_holiday');
    return parseBooleanFlagValue(getConfigurationRawValue(item));
}

export async function getExamTimeBeforeSessionForTahfiz() {
    const item = await getConfigurations('tahfiz', 'exam_time_before_session');
    return parseNumericValue(getConfigurationRawValue(item));
}

export async function getExamTimeAfterSessionForTahfiz() {
    const item = await getConfigurations('tahfiz', 'exam_time_after_session');
    return parseNumericValue(getConfigurationRawValue(item));
}
