import React from 'react';
import { useDateFormatStore } from '@/app/stores/dateFormat.store';
import { getDisplayDate } from '@/shared/utils/helpers/dateFormatter';
/**
 * Renders a date using the global date format preference.
 * Re-renders when the user changes the date format in the navbar.
 */
const FormattedDate = ({ value, format, className, hideWhenEmpty = false }) => {
    const dateFormat = useDateFormatStore((s) => s.dateFormat);
    const effectiveFormat = format ?? dateFormat;
    const display = getDisplayDate(value, effectiveFormat);
    if (hideWhenEmpty && (display === '-' || !display))
        return null;
    return <span className={className}>{display}</span>;
};
export default FormattedDate;
