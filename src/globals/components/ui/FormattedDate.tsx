import React from 'react';
import { useDateFormatStore } from '@/stores/dateFormat.store';
import { getDisplayDate } from '@/utils/helpers/dateFormatter';
import type { AppDate } from '@/globals/types';

export interface FormattedDateProps {
    /** API date object or plain date string */
    value: AppDate | string | Date | null | undefined;
    /** Optional override for display format (default: use global preference from store) */
    format?: 'gregorian' | 'hijri' | 'hijri_indic';
    /** Optional class for the wrapper span */
    className?: string;
    /** When true, render nothing when value is empty (default: false, renders '-') */
    hideWhenEmpty?: boolean;
}

/**
 * Renders a date using the global date format preference.
 * Re-renders when the user changes the date format in the navbar.
 */
const FormattedDate: React.FC<FormattedDateProps> = ({
    value,
    format,
    className,
    hideWhenEmpty = false
}) => {
    const dateFormat = useDateFormatStore((s) => s.dateFormat);
    const effectiveFormat = format ?? dateFormat;
    const display = getDisplayDate(value, effectiveFormat);

    if (hideWhenEmpty && (display === '-' || !display)) return null;

    return <span className={className}>{display}</span>;
};

export default FormattedDate;
