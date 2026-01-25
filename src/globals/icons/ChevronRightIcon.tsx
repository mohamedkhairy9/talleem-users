import React from 'react';
import IconBase from './IconBase';
import { IconProps } from '@/globals/types';

/**
 * Chevron Right Icon Component
 */
const ChevronRightIcon: React.FC<IconProps> = ({ width, height, className, ...props }) => {
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
            <polyline points="9 18 15 12 9 6" />
        </IconBase>
    );
};

export default ChevronRightIcon;

