import React from 'react';
import { getDateAndTimeLines } from '@/utils/helpers/dateFormatter';
import type { AppDate } from '@/globals/types';
import type { DateFormatPreference } from '@/globals/types';
import { useDateFormatStore } from '@/stores/dateFormat.store';

export interface DateCellProps {
    /** API date object or plain date string (with or without time) */
    value: AppDate | string | Date | null | undefined;
    /** Optional override for display format (default: use global preference from store) */
    format?: DateFormatPreference;
    /** Optional class for the wrapper div */
    className?: string;
    /** Optional class for the time line (second line) */
    timeClassName?: string;
}

/**
 * Reusable table cell that renders date and time on two lines (date above, time below in muted style).
 * Uses global date format preference; time is parsed from the end of the display string when present.
 */
const DateCell: React.FC<DateCellProps> = ({
    value,
    format,
    className = '',
    timeClassName = 'text-gray-500'
}) => {
    const dateFormat = useDateFormatStore((s) => s.dateFormat);
    const effectiveFormat = format ?? dateFormat;
    const { dateLine, timeLine } = getDateAndTimeLines(value, effectiveFormat);

    return (
        <div className={`flex flex-col gap-0.5 whitespace-normal ${className}`.trim()}>
            <span>{dateLine}</span>
            {timeLine !== '-' && <span className={timeClassName}>{timeLine}</span>}
        </div>
    );
};

export default DateCell;
