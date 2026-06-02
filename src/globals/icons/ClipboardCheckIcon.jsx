import React from 'react';
import IconBase from './IconBase';
/**
 * Clipboard Check Icon Component (for Evaluations)
 */
const ClipboardCheckIcon = ({ width, height, className, ...props }) => {
    return (<IconBase width={width} height={height} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
            <rect x="9" y="3" width="6" height="4" rx="2"/>
            <polyline points="9 12 11 14 15 10"/>
        </IconBase>);
};
export default ClipboardCheckIcon;
