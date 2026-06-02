import React from 'react';
import IconBase from './IconBase';
/**
 * Calendar Icon Component (for Absences)
 */
const CalendarIcon = ({ width, height, className, ...props }) => {
    return (<IconBase width={width} height={height} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
        </IconBase>);
};
export default CalendarIcon;
