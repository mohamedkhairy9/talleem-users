import React from 'react';
import IconBase from './IconBase';
/**
 * Check Icon Component
 */
const CheckIcon = ({ width, height, className, ...props }) => {
    return (<IconBase width={width} height={height} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <polyline points="20 6 9 17 4 12"/>
        </IconBase>);
};
export default CheckIcon;
