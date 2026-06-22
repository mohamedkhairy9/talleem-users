import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { XIcon, BookOpenIcon } from '@/shared/icons';
import InlineMushafSegmentPicker from './InlineMushafSegmentPicker';
import MushafPageModal from './MushafPageModal';
import { verseKeysBetween } from '@/shared/utils/helpers/surahHelper';
/**
 * Modal that combines segment selection (InlineMushafSegmentPicker) and mushaf viewer.
 * Used from the plan form to pick segments and view the mushaf in one place.
 */
const MushafSegmentPickerModal = ({ isOpen, onClose, selectedStartSegment, selectedEndSegment, onSelectStartSegment, onSelectEndSegment, planType, direction = 'incremental', getSurahName }) => {
    const { t } = useTranslation();
    const [viewerPage, setViewerPage] = useState(1);
    const [navigablePages, setNavigablePages] = useState(() => Array.from({ length: 604 }, (_, i) => i + 1));
    const [selectionVerseKeyFromMushaf, setSelectionVerseKeyFromMushaf] = useState(null);
    const [currentSelectionFromPicker, setCurrentSelectionFromPicker] = useState(null);
    const handleNavigablePagesChange = useCallback((pages) => {
        setNavigablePages((prev) => prev.length === pages.length && prev.every((p, i) => p === pages[i]) ? prev : [...pages]);
    }, []);
    // Sync viewer page when modal opens (segment picker will call onPageChange with its current page)
    useEffect(() => {
        if (isOpen) {
            const initialPage = direction === 'decremental' ? 604 : 1;
            setViewerPage((prev) => (prev === initialPage ? prev : initialPage));
            setNavigablePages(Array.from({ length: 604 }, (_, i) => i + 1));
            setSelectionVerseKeyFromMushaf(null);
            setCurrentSelectionFromPicker(null);
        }
    }, [direction, isOpen]);
    // Verse keys to highlight in mushaf: start segment, end segment, and current selection (from list or word click)
    const selectedAyahsForViewer = useMemo(() => {
        const set = new Set();
        if (selectedStartSegment) {
            verseKeysBetween(selectedStartSegment.first_verse_key, selectedStartSegment.last_verse_key).forEach((k) => set.add(k));
        }
        if (selectedEndSegment) {
            verseKeysBetween(selectedEndSegment.first_verse_key, selectedEndSegment.last_verse_key).forEach((k) => set.add(k));
        }
        if (currentSelectionFromPicker) {
            verseKeysBetween(currentSelectionFromPicker.first_verse_key, currentSelectionFromPicker.last_verse_key).forEach((k) => set.add(k));
        }
        return set;
    }, [selectedStartSegment, selectedEndSegment, currentSelectionFromPicker]);
    return (<>
            {isOpen && (<div className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain">
                    <div className="fixed inset-0 bg-black transition-opacity" style={{ opacity: 0.75 }} onClick={onClose} aria-hidden="true"/>
                    <div className="relative flex min-h-[100dvh] items-start justify-center pt-20 pb-8 px-4 z-10">
                        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[calc(100dvh-6rem)] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-gray-200 px-4 sm:px-6 py-4 bg-white shrink-0">
                            <div className="flex items-center gap-2">
                                    <BookOpenIcon className="text-gray-600" width={22} height={22}/>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {planType === 'daily_amount'
                                            ? t('quran.selectFaceAndViewMushaf', 'Select face & view Mushaf')
                                            : t('quran.selectSegmentAndViewMushaf', 'Select segment & view Mushaf')}
                                    </h3>
                                </div>
                                <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600" aria-label={t('common.close')}>
                                    <XIcon width={20} height={20}/>
                                </button>
                            </div>

                            {/* Body: single scroll over full content so segment picker + mushaf are both visible */}
                            <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
                                <InlineMushafSegmentPicker selectedStartSegment={selectedStartSegment} selectedEndSegment={selectedEndSegment} onSelectStartSegment={onSelectStartSegment} onSelectEndSegment={onSelectEndSegment} planType={planType} direction={direction} getSurahName={getSurahName} hideInlineMushaf onPageChange={setViewerPage} onNavigablePagesChange={handleNavigablePagesChange} viewerPageSync={viewerPage} selectionVerseKeyFromOutside={selectionVerseKeyFromMushaf ?? undefined} onCurrentSelectionChange={setCurrentSelectionFromPicker}/>
                                <div className="border-t border-gray-200 pt-4">
                                    <MushafPageModal isOpen={isOpen} onClose={onClose} pageNumber={viewerPage} navigablePageNumbers={navigablePages} onPageChange={setViewerPage} selectedAyahs={selectedAyahsForViewer} onVerseKeyClick={(verseKey) => setSelectionVerseKeyFromMushaf(verseKey)} embedded/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>)}
        </>);
};
export default MushafSegmentPickerModal;
