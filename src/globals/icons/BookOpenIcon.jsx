import React from 'react';
import IconBase from './IconBase';
/**
 * Book Open Icon Component (for Diary)
 */
const BookOpenIcon = ({ width, height, className, ...props }) => {
    return (<IconBase width={width} height={height} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </IconBase>);
};
export default BookOpenIcon;
