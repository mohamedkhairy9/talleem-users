import React from 'react';
import { getDateAndTimeLines } from '@/shared/utils/helpers/dateFormatter';
import { useDateFormatStore } from '@/app/stores/dateFormat.store';
/**
 * Reusable table cell that renders date and time on two lines (date above, time below in muted style).
 * Uses global date format preference; time is parsed from the end of the display string when present.
 */
const DateCell = ({ value, format, className = '', timeClassName = 'text-gray-500' }) => {
    const dateFormat = useDateFormatStore((s) => s.dateFormat);
    const effectiveFormat = format ?? dateFormat;
    const { dateLine, timeLine } = getDateAndTimeLines(value, effectiveFormat);
    return (<div className={`flex flex-col gap-0.5 whitespace-normal ${className}`.trim()}>
            <span>{dateLine}</span>
            {timeLine !== '-' && <span className={timeClassName}>{timeLine}</span>}
        </div>);
};
export default DateCell;
