import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { XIcon, ChevronRightIcon } from '@/globals/icons';
import MushafPage from './MushafPage';
import { dbLoader } from '@/utils/helpers/databaseLoader';
import { fontLoader } from '@/utils/helpers/fontLoader';
import { loadMushafPages, getPageForVerseKey, verseKeysBetween, compareVerseKeys } from '@/utils/helpers/surahHelper';
import { quranSegmentsService, type QuranSegment } from '../services/quran-segments.service';
import type { Database } from 'sql.js';

interface MushafPageModalProps {
    isOpen: boolean;
    onClose: () => void;
    pageNumber?: number; // Optional for single page view
    selectedAyahs?: Set<string>;
    // Plan view mode
    startVerseKey?: string; // Format: "surah:ayah" (e.g., "1:1")
    endVerseKey?: string; // Format: "surah:ayah" (e.g., "1:7")
    /** When set, verse keys in range are clickable; on verse click calls this with verse key (e.g. "2:255") */
    onSelectVerseKey?: (verseKey: string) => void;
    /** When set (e.g. in segment picker modal), any word click calls this with verse key; no range check */
    onVerseKeyClick?: (verseKey: string) => void;
    /** When true, render only inner viewer (no overlay/backdrop); for use inside another modal */
    embedded?: boolean;
    /** Pages the user may browse (e.g. Juz/Surah filter). Omit for full mushaf 1–604. */
    navigablePageNumbers?: number[];
    /** When set, prev/next calls this so parent can sync (e.g. embedded viewer + segment picker). */
    onPageChange?: (page: number) => void;
}

/**
 * MushafPageModal Component
 * Displays a mushaf page in a modal with database and font loading
 */
const MushafPageModal: React.FC<MushafPageModalProps> = ({
    isOpen,
    onClose,
    pageNumber,
    selectedAyahs = new Set(),
    startVerseKey,
    endVerseKey,
    onSelectVerseKey,
    onVerseKeyClick,
    embedded = false,
    navigablePageNumbers,
    onPageChange
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = (i18n.language || 'ar').startsWith('ar');
    const [pageLines, setPageLines] = useState<any[]>([]);
    const [linesDb, setLinesDb] = useState<Database | null>(null);
    const [wordsDb, setWordsDb] = useState<Database | null>(null);
    const [surahData, setSurahData] = useState<Record<string, any> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFontLoading, setIsFontLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Plan view mode state
    const [planPages, setPlanPages] = useState<number[]>([]);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [isLoadingPlanPages, setIsLoadingPlanPages] = useState(false);
    // Verse keys to highlight from API segments only (per plan range)
    const [planSegmentVerseKeys, setPlanSegmentVerseKeys] = useState<Set<string>>(new Set());
    // Memoized segments per page (pageNumber -> segments) to avoid re-requesting when navigating
    const [segmentsByPageCache, setSegmentsByPageCache] = useState<Record<number, QuranSegment[]>>({});

    // When in select-verse mode: local selection before confirm (show in hint, then confirm to apply)
    const [selectedVerseKeyInModal, setSelectedVerseKeyInModal] = useState<string | null>(null);

    // Determine if we're in plan view mode
    const isPlanView = !!startVerseKey && !!endVerseKey;
    // Single-page view: track selected page (e.g. when user changes dropdown)
    const [singlePage, setSinglePage] = useState<number>(1);
    useEffect(() => {
        if (isOpen && !isPlanView && pageNumber != null) setSinglePage(pageNumber);
    }, [isOpen, isPlanView, pageNumber]);
    const currentPage = isPlanView && planPages.length > 0
        ? planPages[currentPageIndex]
        : singlePage;

    const singleViewPagesList = useMemo(() => {
        if (isPlanView) return [];
        const list =
            navigablePageNumbers != null && navigablePageNumbers.length > 0
                ? [...new Set(navigablePageNumbers)].sort((a, b) => a - b)
                : Array.from({ length: 604 }, (_, i) => i + 1);
        return list;
    }, [isPlanView, navigablePageNumbers]);

    const singleViewPageIndex = singleViewPagesList.indexOf(currentPage);
    const canSingleGoPrev = !isPlanView && singleViewPageIndex > 0;
    const canSingleGoNext =
        !isPlanView && singleViewPageIndex >= 0 && singleViewPageIndex < singleViewPagesList.length - 1;

    const goSinglePrev = () => {
        if (!canSingleGoPrev) return;
        const p = singleViewPagesList[singleViewPageIndex - 1];
        if (onPageChange) onPageChange(p);
        else setSinglePage(p);
    };
    const goSingleNext = () => {
        if (!canSingleGoNext) return;
        const p = singleViewPagesList[singleViewPageIndex + 1];
        if (onPageChange) onPageChange(p);
        else setSinglePage(p);
    };

    // Keep current page inside navigable set when filter changes (e.g. Juz/Surah)
    useEffect(() => {
        if (isPlanView || !singleViewPagesList.length) return;
        if (singleViewPagesList.includes(currentPage)) return;
        const first = singleViewPagesList[0];
        if (onPageChange) onPageChange(first);
        else setSinglePage(first);
    }, [isPlanView, singleViewPagesList, currentPage, onPageChange]);

    // Plan view: highlight only verses that belong to segments from the API (not all verses in range)
    const planSelectedAyahs = useMemo(() => planSegmentVerseKeys, [planSegmentVerseKeys]);

    // When in select-verse mode, also highlight the locally selected verse
    const displaySelectedAyahs = useMemo(() => {
        const base = isPlanView ? planSelectedAyahs : selectedAyahs;
        if (onSelectVerseKey && selectedVerseKeyInModal) {
            const next = new Set(base);
            next.add(selectedVerseKeyInModal);
            return next;
        }
        return base;
    }, [isPlanView, planSelectedAyahs, selectedAyahs, onSelectVerseKey, selectedVerseKeyInModal]);

    // Initialize databases on mount
    useEffect(() => {
        if (!isOpen) return;

        const initializeDatabases = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const { linesDb: lDb, wordsDb: wDb, surahData: sData } = await dbLoader.initialize();

                if (!lDb || !wDb || !sData) {
                    throw new Error('Failed to initialize all databases');
                }

                setLinesDb(lDb);
                setWordsDb(wDb);
                setSurahData(sData);
                setIsLoading(false);
            } catch (err: any) {
                console.error('Error initializing databases:', err);
                setError(err?.message || t('quran.loadError'));
                setIsLoading(false);
            }
        };

        initializeDatabases();

        return () => {
            // Don't cleanup on unmount - keep databases loaded for performance
            // dbLoader.cleanup();
        };
    }, [isOpen]);

    // Build full page list from start page to end page (inclusive)
    const buildPageRange = React.useCallback((startPage: number, endPage: number): number[] => {
        const low = Math.max(1, Math.min(startPage, endPage));
        const high = Math.min(604, Math.max(startPage, endPage));
        const pages: number[] = [];
        for (let p = low; p <= high; p++) pages.push(p);
        return pages;
    }, []);

    // Get all mushaf pages for a verse range using global mushaf_pages.json (start/end verse key per page)
    const getAllPagesInRange = React.useCallback(async (startKey: string, endKey: string): Promise<number[]> => {
        const pages = await loadMushafPages();
        if (!pages.length) return [];
        const startPage = getPageForVerseKey(startKey.trim(), pages);
        const endPage = getPageForVerseKey(endKey.trim(), pages);
        return buildPageRange(startPage, endPage);
    }, [buildPageRange]);

    // Build verse keys set from segments clipped to plan range (shared for fetch and cache)
    const buildVerseKeysFromSegments = React.useCallback(
        (segs: QuranSegment[]) => {
            if (!startVerseKey || !endVerseKey) return new Set<string>();
            const verseKeys = new Set<string>();
            for (const seg of segs) {
                const segLast = seg.last_verse_key.trim();
                const segFirst = seg.first_verse_key.trim();
                if (compareVerseKeys(segLast, startVerseKey) < 0 || compareVerseKeys(segFirst, endVerseKey) > 0) continue;
                const keys = verseKeysBetween(segFirst, segLast, startVerseKey, endVerseKey);
                keys.forEach((k) => verseKeys.add(k));
            }
            return verseKeys;
        },
        [startVerseKey, endVerseKey]
    );

    // Load plan pages only when in plan view; clear segments cache and page lines for new plan
    useEffect(() => {
        if (!isOpen || !isPlanView || !startVerseKey || !endVerseKey) return;

        setIsLoadingPlanPages(true);
        setPlanSegmentVerseKeys(new Set());
        setSegmentsByPageCache({});
        setPageLines([]);

        getAllPagesInRange(startVerseKey, endVerseKey)
            .then((pages) => {
                setPlanPages(pages);
                setCurrentPageIndex(0);
            })
            .catch((err) => console.error('Error loading plan pages:', err))
            .finally(() => setIsLoadingPlanPages(false));
    }, [isOpen, isPlanView, startVerseKey, endVerseKey, getAllPagesInRange]);

    // Fetch segments for the current page when in plan view; use cache if already loaded
    useEffect(() => {
        if (!isOpen || !isPlanView || !startVerseKey || !endVerseKey || currentPage < 1 || currentPage > 604) {
            return;
        }

        const cached = segmentsByPageCache[currentPage];
        if (cached !== undefined) {
            setPlanSegmentVerseKeys(buildVerseKeysFromSegments(cached));
            return;
        }

        let cancelled = false;
        setPlanSegmentVerseKeys(new Set());

        quranSegmentsService
            .getSegmentsByPage(currentPage)
            .then((data: any) => {
                if (cancelled) return;
                const segs: QuranSegment[] = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
                setSegmentsByPageCache((prev) => ({ ...prev, [currentPage]: segs }));
                setPlanSegmentVerseKeys(buildVerseKeysFromSegments(segs));
            })
            .catch((err) => {
                if (!cancelled) console.error('Error loading segments for page:', currentPage, err);
            });

        return () => { cancelled = true; };
    }, [isOpen, isPlanView, startVerseKey, endVerseKey, currentPage, segmentsByPageCache, buildVerseKeysFromSegments]);

    // Load page data when page number or databases change
    useEffect(() => {
        if (!isOpen || !linesDb || currentPage < 1 || currentPage > 604) return;
        if (isPlanView && planPages.length === 0) return;

        const loadPageWithFont = async () => {
            try {
                setIsFontLoading(true);

                // Load font for the page
                fontLoader.loadPageFont(currentPage);

                // Wait for font to load
                if (document.fonts) {
                    await document.fonts.load(`1em QuranicFont-${currentPage}`);
                    await new Promise(resolve => setTimeout(resolve, 100));
                } else {
                    await new Promise(resolve => setTimeout(resolve, 300));
                }

                // Load page lines
                loadPage(currentPage);
                setIsFontLoading(false);
            } catch (error) {
                console.error('Error loading font:', error);
                loadPage(currentPage);
                setIsFontLoading(false);
            }
        };

        const loadPage = (pageNum: number) => {
            if (!linesDb) return;

            try {
                const query = `SELECT * FROM pages WHERE page_number = ${pageNum} ORDER BY line_number`;
                const result = linesDb.exec(query);

                if (!result || result.length === 0) {
                    setPageLines([]);
                    setIsLoading(false);
                    return;
                }

                const firstResult = result[0];

                if (!firstResult || !firstResult.values || firstResult.values.length === 0) {
                    console.warn('No values in result');
                    setPageLines([]);
                    setIsLoading(false);
                    return;
                }

                // Check if columns exists, if not, try to get column names from the database schema
                let columns = firstResult.columns;
                if (!columns || !Array.isArray(columns)) {
                    try {
                        const schemaQuery = `PRAGMA table_info(pages)`;
                        const schemaResult = linesDb.exec(schemaQuery);
                        if (schemaResult && schemaResult.length > 0 && schemaResult[0].columns) {
                            // Get column names from schema
                            columns = schemaResult[0].values.map((row: any) => row[1]); // column name is at index 1
                        } else {
                            // Fallback: use common column names
                            columns = ['page_number', 'line_number', 'line_type', 'surah_number', 'first_word_id', 'last_word_id', 'is_centered'];
                        }
                    } catch (schemaErr) {
                        // Fallback: use common column names
                        columns = ['page_number', 'line_number', 'line_type', 'surah_number', 'first_word_id', 'last_word_id', 'is_centered'];
                    }
                }

                const rows = firstResult.values;

                const lines = rows.map((row: any) => {
                    const line: any = {};
                    columns.forEach((col: string, idx: number) => {
                        line[col] = row[idx];
                    });
                    return line;
                });

                setPageLines(lines);
                setIsLoading(false);
            } catch (err: any) {
                console.error('Error loading page:', err);
                setError(err?.message || t('quran.loadError'));
                setIsLoading(false);
            }
        };

        loadPageWithFont();
    }, [currentPage, linesDb, isOpen, isPlanView, planPages.length]);

    /** In select mode: word location may be "surah:ayah" or "surah:ayah:wordIndex"; normalize to verse key, check range, set local selection */
    const handleWordClick = React.useCallback(
        (_wordId: number, location: string) => {
            if (!onSelectVerseKey || !startVerseKey || !endVerseKey) return;
            const parts = location.trim().split(':').filter(Boolean);
            if (parts.length < 2) return;
            const verseKey = `${parts[0]}:${parts[1]}`;
            if (!/^\d+:\d+$/.test(verseKey)) return;
            if (compareVerseKeys(verseKey, startVerseKey) < 0 || compareVerseKeys(verseKey, endVerseKey) > 0) return;
            setSelectedVerseKeyInModal(verseKey);
        },
        [onSelectVerseKey, startVerseKey, endVerseKey]
    );

    /** For segment picker: any word click → extract verse key and notify parent (no range check) */
    const handleVerseKeyClick = React.useCallback(
        (_wordId: number, location: string) => {
            if (!onVerseKeyClick) return;
            const parts = location.trim().split(':').filter(Boolean);
            if (parts.length < 2) return;
            const verseKey = `${parts[0]}:${parts[1]}`;
            if (/^\d+:\d+$/.test(verseKey)) onVerseKeyClick(verseKey);
        },
        [onVerseKeyClick]
    );

    /** Confirm selection and close (called from hint bar button) */
    const handleConfirmSelection = React.useCallback(() => {
        if (selectedVerseKeyInModal && onSelectVerseKey) {
            onSelectVerseKey(selectedVerseKeyInModal);
            setSelectedVerseKeyInModal(null);
        }
    }, [selectedVerseKeyInModal, onSelectVerseKey]);

    /** Reset local selection when opening in select mode */
    useEffect(() => {
        if (isOpen && onSelectVerseKey) setSelectedVerseKeyInModal(null);
    }, [isOpen, onSelectVerseKey]);

    if (!isOpen) return null;

    const content = (
        <div className={`relative bg-white ${embedded ? 'rounded-lg border border-gray-200 w-full min-h-0' : 'overflow-hidden rounded-xl shadow-xl max-w-3xl w-full max-h-[calc(100vh-5rem)] md:max-h-[calc(100vh-6rem)]'}`}>
            {/* Header: only when not embedded (title + close); embedded has no header */}
            {!embedded && (
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-white flex-wrap gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {onSelectVerseKey
                            ? t('grade.selectEndVerse', 'Select actual end verse')
                            : isPlanView
                                ? t('quran.planView', 'Plan View')
                                : t('quran.mushafPage', 'Mushaf Page')}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                        aria-label={t('common.close')}
                    >
                        <XIcon width={20} height={20} />
                    </button>
                </div>
            )}

            {/* Hint when selecting verse for grade: instructions + selected verse + Confirm */}
            {onSelectVerseKey && !isLoading && !isLoadingPlanPages && !error && (
                <div className="px-4 sm:px-6 py-3 bg-primary-50 border-b border-primary-100">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <p className="text-sm text-primary-800">
                            {selectedVerseKeyInModal ? (
                                <span>
                                    {t('grade.selectedVerse', 'Selected')}: <strong className="font-semibold text-primary-900">{selectedVerseKeyInModal}</strong>
                                    {' — '}
                                    {t('grade.confirmOrPickAnother', 'Click Confirm to use this verse, or click another verse.')}
                                </span>
                            ) : (
                                t('grade.clickVerseToSelect', 'Click any verse on the page to set it as the actual end verse.')
                            )}
                        </p>
                        {selectedVerseKeyInModal && (
                            <button
                                type="button"
                                onClick={handleConfirmSelection}
                                className="shrink-0 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 shadow-sm"
                            >
                                {t('grade.confirmVerse', 'Confirm')}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Single-page / embedded: prev/next within allowed pages (1–604 or Juz/Surah subset) */}
            {!isPlanView && singleViewPagesList.length > 0 && !isLoading && !error && (
                <div
                    className={`flex items-center justify-center gap-4 px-4 py-3 border-b border-gray-200 bg-gray-50 ${isRtl ? 'flex-row-reverse' : ''}`}
                >
                    <button
                        type="button"
                        onClick={goSingleNext}
                        disabled={!canSingleGoNext}
                        className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                        aria-label={t('quran.nextPage', 'Next page')}
                    >
                        <ChevronRightIcon width={20} height={20} className={isRtl ? 'rotate-180' : ''} />
                    </button>
                    <span className="text-sm font-medium text-gray-700 min-w-[10rem] text-center">
                        {t('quran.page', 'Page')} {currentPage}
                        {singleViewPagesList.length < 604
                            ? ` (${singleViewPageIndex >= 0 ? singleViewPageIndex + 1 : '—'} / ${singleViewPagesList.length})`
                            : ''}
                    </span>
                    <button
                        type="button"
                        onClick={goSinglePrev}
                        disabled={!canSingleGoPrev}
                        className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                        aria-label={t('quran.previousPage', 'Previous page')}
                    >
                        <ChevronRightIcon width={20} height={20} className={isRtl ? '' : 'rotate-180'} />
                    </button>
                </div>
            )}

            {/* Plan view: prev/next page navigation (order and arrow direction respect RTL) */}
            {isPlanView && planPages.length > 0 && !isLoading && !isLoadingPlanPages && !error && (
                <div
                    className={`flex items-center justify-center gap-4 px-4 py-3 border-b border-gray-200 bg-gray-50 ${isRtl ? 'flex-row-reverse' : ''}`}
                >
                    <button
                        type="button"
                        onClick={() => setCurrentPageIndex((i) => Math.min(planPages.length - 1, i + 1))}
                        disabled={currentPageIndex === planPages.length - 1}
                        className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                        aria-label={t('quran.nextPage', 'Next page')}
                    >
                        <ChevronRightIcon width={20} height={20}  className={isRtl ? 'rotate-180' : ''}/>
                    </button>

                    <span className="text-sm font-medium text-gray-700 min-w-[8rem] text-center">
                        {t('quran.page', 'Page')} {currentPage} ({currentPageIndex + 1} / {planPages.length})
                    </span>
                    <button
                        type="button"
                        onClick={() => setCurrentPageIndex((i) => Math.max(0, i - 1))}
                        disabled={currentPageIndex === 0}
                        className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                        aria-label={t('quran.previousPage', 'Previous page')}
                    >
                        <ChevronRightIcon width={20} height={20} className={isRtl ? '' : 'rotate-180'} />
                    </button>

                </div>
            )}

            {/* Body: when embedded, no inner scroll so parent modal content scrolls and mushaf stays visible */}
            <div className={`relative px-2 sm:px-4 md:px-6 py-2 sm:py-4 ${embedded ? '' : 'overflow-y-auto max-h-[calc(100vh-12rem)]'}`}>
                {isLoading || isLoadingPlanPages ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="spinner mx-auto mb-4"></div>
                            <p className="text-gray-500">{t('common.loading', 'Loading...')}</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <p className="text-red-600 mb-4">{error}</p>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                            >
                                {t('common.close', 'Close')}
                            </button>
                        </div>
                    </div>
                ) : (
                    <MushafPage
                        pageLines={pageLines}
                        currentPage={currentPage}
                        wordsDb={wordsDb}
                        surahData={surahData}
                        selectedAyahs={displaySelectedAyahs}
                        isFontLoading={isFontLoading}
                        onWordClick={onVerseKeyClick ? handleVerseKeyClick : onSelectVerseKey ? handleWordClick : undefined}
                    />
                )}
            </div>
        </div>
    );

    if (embedded) return content;

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
            <div
                className="fixed inset-0 bg-black transition-opacity"
                style={{ opacity: 0.75 }}
                onClick={onClose}
                aria-hidden="true"
            />
            <div className="relative flex min-h-full items-center justify-center p-4 pt-20 md:pt-24 z-10">
                {content}
            </div>
        </div>
    );
};

export default MushafPageModal;

