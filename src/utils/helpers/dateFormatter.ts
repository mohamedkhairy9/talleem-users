import type { AppDate, DateFormatPreference } from '@/globals/types';
import { useDateFormatStore } from '@/stores/dateFormat.store';

/**
 * Type guard: value is the API date object (gregorian + hijri + hijri_indic)
 */
export function isAppDate(
    value: AppDate | string | Date | null | undefined
): value is AppDate {
    return (
        value != null &&
        typeof value === 'object' &&
        'gregorian' in value &&
        typeof (value as AppDate).gregorian === 'string' &&
        'hijri' in value &&
        'hijri_indic' in value
    );
}

/**
 * Get the gregorian date string from an API date or plain string.
 * Use for form inputs (value/defaultValue) and API payloads.
 */
export function getGregorianDate(
    value: AppDate | string | null | undefined
): string {
    if (!value) return '';
    if (isAppDate(value)) return value.gregorian;
    return typeof value === 'string' ? value : '';
}

/**
 * Format a plain date string to DD/MM/YYYY (legacy display).
 */
export function formatDate(date: string | Date | null | undefined): string {
    if (!date) return '-';

    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;

        if (isNaN(dateObj.getTime())) return '-';

        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();

        return `${day}/${month}/${year}`;
    } catch {
        return '-';
    }
}

/**
 * Get the display string for a date using the current user preference (gregorian / hijri / hijri_indic).
 * Accepts API date object or plain string; reads format from dateFormat store when format is omitted.
 */
export function getDisplayDate(
    value: AppDate | string | Date | null | undefined,
    format?: DateFormatPreference
): string {
    if (value == null) return '-';
    if (isAppDate(value)) {
        const preferred = format ?? useDateFormatStore.getState().dateFormat;
        const out = value[preferred];
        return out ?? value.gregorian ?? '-';
    }
    if (typeof value === 'string') return formatDate(value);
    return formatDate(value);
}
