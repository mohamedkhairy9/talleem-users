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
    const currentLang = i18n.language || 'en';
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

            <div className="verses-container space-y-3">
                {verses.map((verse, index) => (
                    <div
                        key={`${verse.verse_key}-${index}`}
                        className="verse-item p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                    >
                        <div className="flex items-start gap-3">
                            <div className="verse-number flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold">
                                {verse.ayah_number}
                            </div>
                            <div className="verse-text flex-1 text-right" dir="rtl">
                                <p className="text-lg leading-relaxed text-gray-800" style={{ fontFamily: 'Cairo, Arial, sans-serif' }}>
                                    {verse.text}
                                </p>
                                <p className="text-xs text-gray-500 mt-2">
                                    {verse.verse_key}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SegmentViewer;

