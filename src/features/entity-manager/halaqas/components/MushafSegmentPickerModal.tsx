import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { XIcon, BookOpenIcon } from '@/globals/icons';
import InlineMushafSegmentPicker from './InlineMushafSegmentPicker';
import MushafPageModal from './MushafPageModal';
import type { QuranSegment } from '../services/quran-segments.service';

export interface MushafSegmentPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedStartSegment: QuranSegment | null;
    selectedEndSegment: QuranSegment | null;
    onSelectStartSegment: (segment: QuranSegment | null) => void;
    onSelectEndSegment: (segment: QuranSegment | null) => void;
    planType: 'daily_amount' | 'start_end';
    getSurahName?: (surahNumber: number) => string;
}

/**
 * Modal that combines segment selection (InlineMushafSegmentPicker) and mushaf viewer.
 * Used from the plan form to pick segments and view the mushaf in one place.
 */
const MushafSegmentPickerModal: React.FC<MushafSegmentPickerModalProps> = ({
    isOpen,
    onClose,
    selectedStartSegment,
    selectedEndSegment,
    onSelectStartSegment,
    onSelectEndSegment,
    planType,
    getSurahName
}) => {
    const { t } = useTranslation();

    const { startVerseKey, endVerseKey, pageNumber } = useMemo(() => {
        const start = selectedStartSegment?.first_verse_key;
        const end =
            planType === 'start_end' && selectedEndSegment
                ? selectedEndSegment.last_verse_key
                : selectedStartSegment?.last_verse_key;
        if (start && end) return { startVerseKey: start, endVerseKey: end, pageNumber: undefined };
        return { startVerseKey: undefined, endVerseKey: undefined, pageNumber: 1 };
    }, [selectedStartSegment, selectedEndSegment, planType]);

    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 z-[60] overflow-y-auto">
                    <div
                        className="fixed inset-0 bg-black transition-opacity"
                        style={{ opacity: 0.75 }}
                        onClick={onClose}
                        aria-hidden="true"
                    />
                    <div className="relative flex min-h-full items-center justify-center p-4 pt-12 pb-12 z-10">
                        <div
                            className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[calc(100vh-3rem)] overflow-hidden flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-gray-200 px-4 sm:px-6 py-4 bg-white shrink-0">
                                <div className="flex items-center gap-2">
                                    <BookOpenIcon className="text-gray-600" width={22} height={22} />
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {t('quran.selectSegmentAndViewMushaf', 'Select segment & view Mushaf')}
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                                    aria-label={t('common.close')}
                                >
                                    <XIcon width={20} height={20} />
                                </button>
                            </div>

                            {/* Body: segment picker + embedded mushaf */}
                            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
                                <InlineMushafSegmentPicker
                                    selectedStartSegment={selectedStartSegment}
                                    selectedEndSegment={selectedEndSegment}
                                    onSelectStartSegment={onSelectStartSegment}
                                    onSelectEndSegment={onSelectEndSegment}
                                    planType={planType}
                                    getSurahName={getSurahName}
                                    hideInlineMushaf
                                />
                                <div className="border-t border-gray-200 pt-4">
                                    <MushafPageModal
                                        isOpen={isOpen}
                                        onClose={onClose}
                                        startVerseKey={startVerseKey}
                                        endVerseKey={endVerseKey}
                                        pageNumber={pageNumber}
                                        embedded
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default MushafSegmentPickerModal;
