import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Verse } from '../services/quran-segments.service';
import './SegmentViewer.css';

interface SegmentViewerProps {
    verses: Verse[];
    segmentInfo?: {
        first_verse_key: string;
        last_verse_key: string;
        surah_number?: number;
    };
    className?: string;
}

/**
 * SegmentViewer Component
 * Displays the ayahs (verses) of a segment
 */
const SegmentViewer: React.FC<SegmentViewerProps> = ({
    verses,
    segmentInfo,
    className = ''
}) => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'ar';
    const isRTL = currentLang === 'ar';

    if (!verses || verses.length === 0) {
        return (
            <div className={`segment-viewer empty ${className}`}>
                <p className="text-gray-500 text-center py-4">
                    {t('quran.noVerses', 'No verses available')}
                </p>
            </div>
        );
    }

    return (
        <div className={`segment-viewer ${className}`} dir={isRTL ? 'rtl' : 'ltr'}>
            {segmentInfo && (
                <div className="segment-header mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                            {t('quran.segment', 'Segment')}: {segmentInfo.first_verse_key} - {segmentInfo.last_verse_key}
                        </span>
                        {segmentInfo.surah_number && (
                            <span className="text-sm text-gray-600">
                                {t('quran.surah', 'Surah')} {segmentInfo.surah_number}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SegmentViewer;

