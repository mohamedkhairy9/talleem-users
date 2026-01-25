import React from 'react';
import IconBase from './IconBase';
import { IconProps } from '@/globals/types';

/**
 * Chevron Down Icon Component
 */
const ChevronDownIcon: React.FC<IconProps> = ({ width, height, className, ...props }) => {
    return (
        <IconBase
            width={width}
            height={height}
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <polyline points="6 9 12 15 18 9" />
        </IconBase>
    );
};

export default ChevronDownIcon;

