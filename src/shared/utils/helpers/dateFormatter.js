import { useDateFormatStore } from '@/app/stores/dateFormat.store';
/**
 * Type guard: value is the API date object (gregorian + hijri + hijri_indic)
 */
export function isAppDate(value) {
    return (value != null &&
        typeof value === 'object' &&
        'gregorian' in value &&
        typeof value.gregorian === 'string' &&
        'hijri' in value &&
        'hijri_indic' in value);
}
/**
 * Get the gregorian date string from an API date or plain string.
 * Use for form inputs (value/defaultValue) and API payloads.
 */
export function getGregorianDate(value) {
    if (!value)
        return '';
    if (isAppDate(value))
        return value.gregorian;
    return typeof value === 'string' ? value : '';
}
/**
 * Format a plain date string to DD/MM/YYYY (legacy display).
 */
export function formatDate(date) {
    if (!date)
        return '-';
    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(dateObj.getTime()))
            return typeof date === 'string' ? date : '-';
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        return `${day}/${month}/${year}`;
    }
    catch {
        return typeof date === 'string' ? date : '-';
    }
}
/**
 * Get the display string for a date using the current user preference (gregorian / hijri / hijri_indic).
 * Accepts API date object or plain string; reads format from dateFormat store when format is omitted.
 */
export function getDisplayDate(value, format) {
    if (value == null)
        return '-';
    if (isAppDate(value)) {
        const preferred = format ?? useDateFormatStore.getState().dateFormat;
        const out = value[preferred];
        return out ?? value.gregorian ?? '-';
    }
    if (typeof value === 'string')
        return formatDate(value);
    return formatDate(value);
}
/**
 * Normalize date to ISO format (YYYY-MM-DD) for API payloads and form inputs.
 * Pass-through if already YYYY-MM-DD or empty; otherwise parses and formats.
 */
export function normalizeDate(dateStr) {
    if (!dateStr)
        return dateStr;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr))
        return dateStr;
    const date = new Date(dateStr);
    if (isNaN(date.getTime()))
        return dateStr;
    return date.toISOString().split('T')[0];
}
/**
 * Normalize session time to 24-hour format (HH:MM-HH:MM).
 * Pass-through if already in that format or empty; parses AM/PM if present.
 */
export function normalizeSessionTime(timeStr) {
    if (!timeStr)
        return timeStr;
    if (/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(timeStr))
        return timeStr;
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?-(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (match) {
        let startHour = parseInt(match[1], 10);
        const startMin = match[2];
        const startPeriod = match[3]?.toUpperCase();
        let endHour = parseInt(match[4], 10);
        const endMin = match[5];
        const endPeriod = match[6]?.toUpperCase();
        if (startPeriod === 'PM' && startHour !== 12)
            startHour += 12;
        if (startPeriod === 'AM' && startHour === 12)
            startHour = 0;
        if (endPeriod === 'PM' && endHour !== 12)
            endHour += 12;
        if (endPeriod === 'AM' && endHour === 12)
            endHour = 0;
        return `${String(startHour).padStart(2, '0')}:${startMin}-${String(endHour).padStart(2, '0')}:${endMin}`;
    }
    return timeStr;
}
/**
 * Format time string to HH:MM (drops seconds).
 * e.g. "16:17:25" -> "16:17", "09:00" -> "09:00"
 */
export function formatTimePart(timeStr) {
    if (!timeStr)
        return '-';
    const parts = timeStr.split(':');
    if (parts.length >= 2)
        return `${parts[0].trim()}:${parts[1].trim()}`;
    return timeStr;
}
/** Time at end of display string: HH:MM or HH:MM:SS (ASCII or Arabic numerals) */
const TIME_AT_END_REGEX = /\s+([\d\u0660-\u0669]{1,2}:[\d\u0660-\u0669]{2}(?::[\d\u0660-\u0669]{2})?)\s*$/;
/**
 * Split a date value into date line and time line for two-line table display.
 * Uses current date format preference; time is extracted from the end of the display string when present.
 */
export function getDateAndTimeLines(value, format) {
    const displayStr = getDisplayDate(value, format);
    if (!displayStr || displayStr === '-')
        return { dateLine: '-', timeLine: '-' };
    const timeMatch = displayStr.match(TIME_AT_END_REGEX);
    if (timeMatch) {
        const timePart = timeMatch[1];
        const datePart = displayStr.slice(0, timeMatch.index).trim();
        return { dateLine: datePart || '-', timeLine: formatTimePart(timePart) };
    }
    return { dateLine: displayStr, timeLine: '-' };
}
