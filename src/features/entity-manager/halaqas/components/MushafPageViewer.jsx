import React from 'react';
import './MushafPageViewer.css';
/**
 * MushafPageViewer Component
 * Displays verses in a mushaf-style layout (simplified version)
 */
const MushafPageViewer = ({ verses, pageNumber, className = '' }) => {
    if (!verses || verses.length === 0) {
        return (<div className={`mushaf-page-viewer empty ${className}`}>
                <div className="mushaf-border">
                    <div className="no-content">
                        لا يوجد محتوى
                    </div>
                </div>
            </div>);
    }
    return (<div className={`mushaf-page-viewer ${className}`}>
            <div className="mushaf-border">
                <svg className="border-svg" viewBox="0 0 600 900" preserveAspectRatio="none">
                    {/* Outer border - main frame */}
                    <rect x="0" y="0" width="600" height="900" fill="none" stroke="#8B4513" strokeWidth="4" rx="2"/>

                    {/* Inner decorative border */}
                    <rect x="12" y="12" width="576" height="876" fill="none" stroke="#A0522D" strokeWidth="2" rx="1"/>

                    {/* Second inner border for depth */}
                    <rect x="20" y="20" width="560" height="860" fill="none" stroke="#CD853F" strokeWidth="1" opacity="0.6"/>

                    {/* Corner decorations */}
                    <path d="M 0,0 L 40,0 M 0,0 L 0,40" stroke="#8B4513" strokeWidth="3" strokeLinecap="round"/>
                    <path d="M 600,0 L 560,0 M 600,0 L 600,40" stroke="#8B4513" strokeWidth="3" strokeLinecap="round"/>
                    <path d="M 0,900 L 40,900 M 0,900 L 0,860" stroke="#8B4513" strokeWidth="3" strokeLinecap="round"/>
                    <path d="M 600,900 L 560,900 M 600,900 L 600,860" stroke="#8B4513" strokeWidth="3" strokeLinecap="round"/>
                </svg>

                <div className="page-content" dir="rtl">
                    {pageNumber && (<div className="page-number">
                            {pageNumber}
                        </div>)}

                    <div className="verses-content">
                        {verses.map((verse, index) => (<div key={`${verse.verse_key}-${index}`} className="verse-line ayah">
                                <span className="verse-text">{verse.text}</span>
                            </div>))}
                    </div>
                </div>
            </div>
        </div>);
};
export default MushafPageViewer;
