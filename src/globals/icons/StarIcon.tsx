import React from 'react';
import IconBase from './IconBase';
import { IconProps } from '@/globals/types';

/**
 * Star Icon Component (for Grades)
 */
const StarIcon: React.FC<IconProps> = ({ width, height, className, ...props }) => {
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
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </IconBase>
    );
};

export default StarIcon;

