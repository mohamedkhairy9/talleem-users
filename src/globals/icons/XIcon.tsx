import React from 'react';
import IconBase from './IconBase';
import { IconProps } from '@/globals/types';

/**
 * X Icon Component (Close Icon)
 * Used for closing mobile navigation
 */
const XIcon: React.FC<IconProps> = ({ width, height, className, ...props }) => {
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
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </IconBase>
    );
};

export default XIcon;

