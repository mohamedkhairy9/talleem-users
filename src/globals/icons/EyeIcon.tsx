import React from 'react';
import IconBase from './IconBase';
import { IconProps } from '@/globals/types';

/**
 * Eye Icon Component
 * Used for showing password visibility
 */
const EyeIcon: React.FC<IconProps> = ({ width, height, className, ...props }) => {
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
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </IconBase>
    );
};

export default EyeIcon;

