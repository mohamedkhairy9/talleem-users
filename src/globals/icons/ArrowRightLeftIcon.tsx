import React from 'react';
import IconBase from './IconBase';
import { IconProps } from '@/globals/types';

/**
 * Arrow Right Left Icon Component (for Transfers)
 */
const ArrowRightLeftIcon: React.FC<IconProps> = ({ width, height, className, ...props }) => {
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
            <polyline points="16 3 21 3 21 8" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <polyline points="8 21 3 21 3 16" />
            <line x1="3" y1="21" x2="10" y2="14" />
        </IconBase>
    );
};

export default ArrowRightLeftIcon;

