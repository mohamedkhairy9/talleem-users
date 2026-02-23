import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { dbLoader } from '@/utils/helpers/databaseLoader';
import { fontLoader } from '@/utils/helpers/fontLoader';
import { compareVerseKeys, verseKeysBetween } from '@/utils/helpers/surahHelper';
import { quranSegmentsService, type QuranSegment } from '../services/quran-segments.service';
import MushafPage from './MushafPage';
import { ChevronRightIcon } from '@/globals/icons';
import type { Database } from 'sql.js';

interface InlineMushafSegmentPickerProps {
    selectedStartSegment: QuranSegment | null;
    selectedEndSegment: QuranSegment | null;
    onSelectStartSegment: (segment: QuranSegment | null) => void;
    onSelectEndSegment: (segment: QuranSegment | null) => void;
    planType: 'daily_amount' | 'start_end';
    getSurahName?: (surahNumber: number) => string;
}

/**
 * Find the segment that contains the given verse key.
 */
function findSegmentForVerseKey(verseKey: string, segments: QuranSegment[]): QuranSegment | null {
    const key = verseKey.trim();
    for (const seg of segments) {
        const first = seg.first_verse_key.trim();
        const last = seg.last_verse_key.trim();
        if (compareVerseKeys(key, first) >= 0 && compareVerseKeys(key, last) <= 0) {
            return seg;
        }
    }
    return null;
}

/** Build set of verse keys for a segment (for highlighting). */
function verseKeysForSegment(seg: QuranSegment): Set<string> {
    const keys = verseKeysBetween(seg.first_verse_key.trim(), seg.last_verse_key.trim());
    return new Set(keys);
}

/**
 * Inline mushaf viewer for segment selection. Shows one page at a time with arrows.
 * Fetches segments per page from API (cached). User clicks on the page to select a segment.
 */
const InlineMushafSegmentPicker: React.FC<InlineMushafSegmentPickerProps> = ({
    selectedStartSegment,
    selectedEndSegment,
    onSelectStartSegment,
    onSelectEndSegment,
    planType,
}) => {
    const { t } = useTranslation();
    const [currentPage, setCurrentPage] = useState(1);
    const [pageLines, setPageLines] = useState<any[]>([]);
    const [linesDb, setLinesDb] = useState<Database | null>(null);
    const [wordsDb, setWordsDb] = useState<Database | null>(null);
    const [surahData, setSurahData] = useState<Record<string, any> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFontLoading, setIsFontLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [segmentsByPageCache, setSegmentsByPageCache] = useState<Record<number, QuranSegment[]>>({});
    const [currentPageSegments, setCurrentPageSegments] = useState<QuranSegment[]>([]);
    const [isLoadingSegments, setIsLoadingSegments] = useState(false);
    const [selectionMode, setSelectionMode] = useState<'start' | 'end'>('start');

    // Initialize databases on mount
    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        setError(null);
        dbLoader
            .initialize()
            .then(({ linesDb: lDb, wordsDb: wDb, surahData: sData }) => {
                if (cancelled) return;
                if (!lDb || !wDb || !sData) throw new Error('Failed to initialize databases');
                setLinesDb(lDb);
                setWordsDb(wDb);
                setSurahData(sData);
                setIsLoading(false);
            })
            .catch((err) => {
                if (!cancelled) {
                    console.error('Error initializing databases:', err);
                    setError(err?.message || 'Failed to load Quran databases');
                    setIsLoading(false);
                }
            });
        return () => { cancelled = true; };
    }, []);

    // Load page lines and font when currentPage or DB changes
    useEffect(() => {
        if (!linesDb || currentPage < 1 || currentPage > 604) return;

        const loadPage = (pageNum: number) => {
            if (!linesDb) return;
            try {
                const query = `SELECT * FROM pages WHERE page_number = ${pageNum} ORDER BY line_number`;
                const result = linesDb.exec(query);
                if (!result?.length || !result[0].values?.length) {
                    setPageLines([]);
                    return;
                }
                const firstResult = result[0];
                let columns = firstResult.columns;
                if (!columns || !Array.isArray(columns)) {
                    columns = ['page_number', 'line_number', 'line_type', 'surah_number', 'first_word_id', 'last_word_id', 'is_centered'];
                }
                const lines = firstResult.values.map((row: any) => {
                    const line: any = {};
                    columns.forEach((col: string, idx: number) => { line[col] = row[idx]; });
                    return line;
                });
                setPageLines(lines);
            } catch (err: any) {
                console.error('Error loading page:', err);
                setPageLines([]);
            }
        };

        const loadPageWithFont = async () => {
            setIsFontLoading(true);
            try {
                fontLoader.loadPageFont(currentPage);
                if (document.fonts) {
                    await document.fonts.load(`1em QuranicFont-${currentPage}`);
                    await new Promise((r) => setTimeout(r, 100));
                } else {
                    await new Promise((r) => setTimeout(r, 300));
                }
                loadPage(currentPage);
            } catch (e) {
                loadPage(currentPage);
            } finally {
                setIsFontLoading(false);
            }
        };

        loadPageWithFont();
    }, [currentPage, linesDb]);

    // Fetch segments for current page (cached)
    useEffect(() => {
        if (currentPage < 1 || currentPage > 604) return;

        const cached = segmentsByPageCache[currentPage];
        if (cached !== undefined) {
            setCurrentPageSegments(cached);
            return;
        }

        let cancelled = false;
        setIsLoadingSegments(true);
        setCurrentPageSegments([]);

        quranSegmentsService
            .getSegmentsByPage(currentPage)
            .then((data: any) => {
                if (cancelled) return;
                const segs: QuranSegment[] = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
                setSegmentsByPageCache((prev) => ({ ...prev, [currentPage]: segs }));
                setCurrentPageSegments(segs);
            })
            .catch((err) => {
                if (!cancelled) console.error('Error loading segments:', err);
            })
            .finally(() => {
                if (!cancelled) setIsLoadingSegments(false);
            });

        return () => { cancelled = true; };
    }, [currentPage, segmentsByPageCache]);

    const goPrev = useCallback(() => setCurrentPage((p) => Math.max(1, p - 1)), []);
    const goNext = useCallback(() => setCurrentPage((p) => Math.min(604, p + 1)), []);

    // Highlight: selected start and end segments when they are on current page
    const selectedAyahs = useMemo(() => {
        const set = new Set<string>();
        if (selectedStartSegment?.page_number === currentPage) {
            verseKeysForSegment(selectedStartSegment).forEach((k) => set.add(k));
        }
        if (selectedEndSegment?.page_number === currentPage) {
            verseKeysForSegment(selectedEndSegment).forEach((k) => set.add(k));
        }
        return set;
    }, [currentPage, selectedStartSegment, selectedEndSegment]);

    const handleWordClick = useCallback(
        (_wordId: number, location: string) => {
            const segment = findSegmentForVerseKey(location, currentPageSegments);
            if (!segment) return;
            if (selectionMode === 'start') {
                onSelectStartSegment(segment);
            } else {
                onSelectEndSegment(segment);
            }
        },
        [currentPageSegments, selectionMode, onSelectStartSegment, onSelectEndSegment]
    );

    if (isLoading || error) {
        return (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center">
                {error ? (
                    <p className="text-red-600">{error}</p>
                ) : (
                    <>
                        <div className="spinner mx-auto mb-2" />
                        <p className="text-gray-500">{t('common.loading', 'Loading...')}</p>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Selection mode + page navigation */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">{t('quran.selectSegment', 'Select segment')}:</span>
                    <button
                        type="button"
                        onClick={() => setSelectionMode('start')}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                            selectionMode === 'start'
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {t('quran.startSegment', 'Start')}
                    </button>
                    {planType === 'start_end' && (
                        <button
                            type="button"
                            onClick={() => setSelectionMode('end')}
                            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                selectionMode === 'end'
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {t('quran.endSegment', 'End')}
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={goPrev}
                        disabled={currentPage <= 1}
                        className="rounded-lg p-2 border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={t('quran.previousPage', 'Previous Page')}
                    >
                        <ChevronRightIcon width={20} height={20} className="text-gray-600 rotate-180" />
                    </button>
                    <span className="text-sm font-medium text-gray-700 min-w-[4rem] text-center">
                        {t('quran.page', 'Page')} {currentPage} / 604
                    </span>
                    <button
                        type="button"
                        onClick={goNext}
                        disabled={currentPage >= 604}
                        className="rounded-lg p-2 border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={t('quran.nextPage', 'Next Page')}
                    >
                        <ChevronRightIcon width={20} height={20} className="text-gray-600" />
                    </button>
                </div>
            </div>

            {/* Hint */}
            <p className="text-sm text-gray-500">
                {selectionMode === 'start'
                    ? t('quran.clickSegmentToSelectStart', 'Click on any segment in the page to set it as start.')
                    : t('quran.clickSegmentToSelectEnd', 'Click on any segment in the page to set it as end.')}
            </p>

            {/* Grid: mushaf page and segments on the same row */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(220px,280px)] gap-4 items-start">
                {/* Mushaf page */}
                <div className="rounded-xl border border-gray-200 overflow-hidden bg-white min-w-0">
                    {isLoadingSegments && currentPageSegments.length === 0 ? (
                        <div className="flex justify-center py-12">
                            <div className="spinner" />
                        </div>
                    ) : (
                        <MushafPage
                            pageLines={pageLines}
                            currentPage={currentPage}
                            wordsDb={wordsDb}
                            surahData={surahData}
                            selectedAyahs={selectedAyahs}
                            onWordClick={handleWordClick}
                            isFontLoading={isFontLoading}
                        />
                    )}
                </div>

                {/* Segments list for current page (same row) */}
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        {t('quran.segmentsForPage', 'Segments for Page')} {currentPage}
                    </h4>
                    {currentPageSegments.length > 0 ? (
                        <div className="flex flex-col gap-2 max-h-[min(70vh,520px)] overflow-y-auto">
                            {currentPageSegments.map((seg) => {
                                const isStart = selectedStartSegment?.id === seg.id;
                                const isEnd = selectedEndSegment?.id === seg.id;
                                const isSelected = isStart || isEnd;
                                return (
                                    <button
                                        key={seg.id}
                                        type="button"
                                        onClick={() => {
                                            if (selectionMode === 'start') onSelectStartSegment(seg);
                                            else onSelectEndSegment(seg);
                                        }}
                                        className={`rounded-lg px-3 py-2 text-left text-sm border-2 transition-colors ${
                                            isSelected
                                                ? 'border-primary-500 bg-primary-50 text-primary-900'
                                                : 'border-gray-200 bg-white hover:border-primary-300'
                                        }`}
                                    >
                                        <span className="font-medium">{t('quran.segment', 'Segment')} {seg.segment_number}</span>
                                        <span className="text-gray-500 ml-1">
                                            ({seg.first_verse_key}
                                            {seg.first_verse_key !== seg.last_verse_key ? ` – ${seg.last_verse_key}` : ''})
                                        </span>
                                        {(isStart || isEnd) && (
                                            <span className="ml-1 text-primary-600 text-xs block mt-0.5">
                                                {isStart ? ` [${t('quran.startSegment', 'Start')}]` : ` [${t('quran.endSegment', 'End')}]`}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 py-2">{t('quran.noSegmentsFound', 'No segments found for this page')}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InlineMushafSegmentPicker;
