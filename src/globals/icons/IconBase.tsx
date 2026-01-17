import React from 'react';
import { IconBaseProps } from '@/globals/types';

/**
 * Base Icon Component
 * Wrapper for SVG icons with consistent props
 */
const IconBase: React.FC<IconBaseProps> = ({
    children,
    width = 24,
    height = 24,
    className = '',
    viewBox = '0 0 24 24',
    fill = 'currentColor',
    stroke = 'none',
    strokeWidth = 0,
    ...props
}) => {
    return (
        <svg
            width={width}
            height={height}
            viewBox={viewBox}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            className={className}
            {...props}
        >
            {children}
        </svg>
    );
};

export default IconBase;
