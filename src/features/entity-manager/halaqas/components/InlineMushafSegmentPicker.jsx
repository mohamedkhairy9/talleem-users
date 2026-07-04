import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { dbLoader } from '@/shared/utils/helpers/databaseLoader';
import { fontLoader } from '@/shared/utils/helpers/fontLoader';
import {
    compareVerseKeys,
    verseKeysBetween,
    getVerseKeyDisplay,
    getJuzNumberForVerseKey,
    getSurahNumbersInJuz,
    getPageNumbersForJuzAndSurah,
    loadMushafPages,
    loadJuzPages,
    getSurahNameForPage
} from '@/shared/utils/helpers/surahHelper';
import { quranSegmentsService } from '../services/quran-segments.service';
import { CheckIcon } from '@/shared/icons';
import { ReactSelect } from '@/shared/components';
import MushafPage from './MushafPage';
import MushafPageNavigator from './MushafPageNavigator';

function findSegmentForVerseKey(verseKey, segments) {
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

function verseKeysForSegment(seg) {
    const keys = verseKeysBetween(seg.first_verse_key.trim(), seg.last_verse_key.trim());
    return new Set(keys);
}

function segmentLabel(seg) {
    return seg.first_verse_key === seg.last_verse_key
        ? seg.first_verse_key
        : `${seg.first_verse_key} - ${seg.last_verse_key}`;
}

function formatVerseKeyForDisplay(verseKey, surahData, lang, t) {
    if (!verseKey?.trim()) {
        return verseKey ?? '-';
    }

    const display = getVerseKeyDisplay(verseKey.trim(), surahData, lang);
    const juz = getJuzNumberForVerseKey(verseKey);

    if (display) {
        return `${display.surahName}, ${t('quran.ayah', 'Ayah')} ${display.ayahNumber} · ${t('quran.juzShort', { number: juz })}`;
    }

    return verseKey;
}

function formatSegmentVerseLabel(seg, surahData, lang, t) {
    const first = formatVerseKeyForDisplay(seg.first_verse_key, surahData, lang, t);

    if (seg.first_verse_key === seg.last_verse_key) {
        return first;
    }

    const last = formatVerseKeyForDisplay(seg.last_verse_key, surahData, lang, t);
    return `${first} - ${last}`;
}

function isSameSegment(a, b) {
    if (!a || !b) {
        return false;
    }

    if (a.id && b.id && a.id === b.id) {
        return true;
    }

    return a.first_verse_key === b.first_verse_key && a.last_verse_key === b.last_verse_key;
}

const InlineMushafSegmentPicker = ({
    selectedStartSegment,
    selectedEndSegment,
    onSelectStartSegment,
    onSelectEndSegment,
    planType,
    direction = 'incremental',
    hideInlineMushaf = false,
    onPageChange,
    selectionVerseKeyFromOutside,
    onCurrentSelectionChange,
    onNavigablePagesChange,
    viewerPageSync
}) => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'ar';
    const isDailyAmountPlan = planType === 'daily_amount';
    const supportsEndSelection = planType === 'start_end';

    const [currentPage, setCurrentPage] = useState(direction === 'decremental' ? 604 : 1);
    const [selectedJuz, setSelectedJuz] = useState('all');
    const [selectedSurah, setSelectedSurah] = useState('all');
    const [mushafPages, setMushafPages] = useState([]);
    const [juzPages, setJuzPages] = useState([]);
    const [pageLines, setPageLines] = useState([]);
    const [linesDb, setLinesDb] = useState(null);
    const [wordsDb, setWordsDb] = useState(null);
    const [surahData, setSurahData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFontLoading, setIsFontLoading] = useState(false);
    const [error, setError] = useState(null);
    const [segmentsByPageCache, setSegmentsByPageCache] = useState({});
    const [currentPageSegments, setCurrentPageSegments] = useState([]);
    const [isLoadingSegments, setIsLoadingSegments] = useState(false);
    const [currentSelection, setCurrentSelection] = useState(null);

    const initialPageSignatureRef = useRef(null);
    const isPageControlled = typeof viewerPageSync === 'number' && typeof onPageChange === 'function';
    const activePage = isPageControlled && viewerPageSync > 0 ? viewerPageSync : currentPage;

    const setPage = useCallback((nextPage) => {
        const previousPage = activePage;
        const resolvedNextPage = typeof nextPage === 'function' ? nextPage(previousPage) : nextPage;
        const normalizedNextPage = Number(resolvedNextPage);

        if (!Number.isFinite(normalizedNextPage) || normalizedNextPage === previousPage) {
            return;
        }

        if (!isPageControlled) {
            setCurrentPage(normalizedNextPage);
        }

        onPageChange?.(normalizedNextPage);
    }, [activePage, isPageControlled, onPageChange]);

    useEffect(() => {
        let cancelled = false;

        setIsLoading(true);
        setError(null);

        dbLoader
            .initialize()
            .then(({ linesDb: lDb, wordsDb: wDb, surahData: sData }) => {
                if (cancelled) {
                    return;
                }

                if (!lDb || !wDb || !sData) {
                    throw new Error('Failed to initialize databases');
                }

                setLinesDb(lDb);
                setWordsDb(wDb);
                setSurahData(sData);
                setIsLoading(false);
            })
            .catch((err) => {
                if (!cancelled) {
                    console.error('Error initializing databases:', err);
                    setError(err?.message || t('quran.loadError'));
                    setIsLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [t]);

    useEffect(() => {
        let cancelled = false;

        Promise.all([loadMushafPages(), loadJuzPages()])
            .then(([mPages, jPages]) => {
                if (cancelled) {
                    return;
                }

                setMushafPages(mPages);
                setJuzPages(jPages);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const pageNumbers = useMemo(() => {
        if (!mushafPages.length) {
            return Array.from({ length: 604 }, (_, i) => i + 1);
        }

        return getPageNumbersForJuzAndSurah(selectedJuz, selectedSurah, mushafPages, juzPages);
    }, [selectedJuz, selectedSurah, mushafPages, juzPages]);

    const pageRangeSignature = useMemo(() => {
        const firstPage = pageNumbers[0] ?? '';
        const lastPage = pageNumbers[pageNumbers.length - 1] ?? '';

        return [direction, selectedJuz, selectedSurah, firstPage, lastPage, pageNumbers.length].join('|');
    }, [direction, pageNumbers, selectedJuz, selectedSurah]);

    useEffect(() => {
        if (selectedStartSegment || selectedEndSegment || currentSelection) {
            return;
        }

        if (!pageNumbers.length) {
            return;
        }

        const targetPage = direction === 'decremental'
            ? pageNumbers[pageNumbers.length - 1]
            : pageNumbers[0];

        if (initialPageSignatureRef.current === pageRangeSignature) {
            return;
        }

        initialPageSignatureRef.current = pageRangeSignature;
        setPage(targetPage);
    }, [currentSelection, direction, pageNumbers, pageRangeSignature, selectedEndSegment, selectedStartSegment, setPage]);

    useEffect(() => {
        if (pageNumbers.length === 0) {
            return;
        }

        if (!pageNumbers.includes(activePage)) {
            setPage(pageNumbers[0]);
        }
    }, [activePage, pageNumbers, setPage]);

    useEffect(() => {
        onNavigablePagesChange?.(pageNumbers);
    }, [pageNumbers, onNavigablePagesChange]);

    useEffect(() => {
        if (!selectionVerseKeyFromOutside?.trim()) {
            return;
        }

        if (!currentPageSegments.length) {
            return;
        }

        const segment = findSegmentForVerseKey(selectionVerseKeyFromOutside, currentPageSegments);

        if (!isSameSegment(currentSelection, segment)) {
            setCurrentSelection(segment ?? null);
        }
    }, [currentPageSegments, currentSelection, selectionVerseKeyFromOutside]);

    useEffect(() => {
        onCurrentSelectionChange?.(currentSelection);
    }, [currentSelection, onCurrentSelectionChange]);

    useEffect(() => {
        if (!supportsEndSelection && selectedEndSegment) {
            onSelectEndSegment(null);
        }
    }, [onSelectEndSegment, selectedEndSegment, supportsEndSelection]);

    useEffect(() => {
        if (selectedJuz === 'all' || selectedSurah === 'all') {
            return;
        }

        const surahsInJuz = getSurahNumbersInJuz(selectedJuz);

        if (!surahsInJuz.includes(selectedSurah)) {
            setSelectedSurah('all');
        }
    }, [selectedJuz, selectedSurah]);

    const surahOptionsForSelect = useMemo(() => {
        const allOption = { value: 'all', label: t('quran.surahAll', 'All') };
        const surahNums = selectedJuz === 'all'
            ? Array.from({ length: 114 }, (_, i) => i + 1)
            : getSurahNumbersInJuz(selectedJuz);

        const surahOpts = surahNums.map((num) => ({
            value: num,
            label: getSurahNameForPage(num, surahData, currentLang) || `${t('quran.surah', 'Surah')} ${num}`
        }));

        return [allOption, ...surahOpts];
    }, [selectedJuz, surahData, currentLang, t]);

    const juzOptionsForSelect = useMemo(() => {
        const allOption = { value: 'all', label: t('quran.juzAll', 'All') };
        const juzOpts = Array.from({ length: 30 }, (_, i) => i + 1).map((j) => ({
            value: j,
            label: `${t('quran.juz', 'Juz')} ${j}`
        }));

        return [allOption, ...juzOpts];
    }, [t]);

    useEffect(() => {
        if (!linesDb || activePage < 1 || activePage > 604) {
            return;
        }

        const loadPage = (pageNum) => {
            if (!linesDb) {
                return;
            }

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

                const lines = firstResult.values.map((row) => {
                    const line = {};
                    columns.forEach((col, idx) => {
                        line[col] = row[idx];
                    });
                    return line;
                });

                setPageLines(lines);
            } catch (err) {
                console.error('Error loading page:', err);
                setPageLines([]);
            }
        };

        const loadPageWithFont = async () => {
            setIsFontLoading(true);

            try {
                fontLoader.loadPageFont(activePage);

                if (document.fonts) {
                    await document.fonts.load(`1em QuranicFont-${activePage}`);
                    await new Promise((resolve) => setTimeout(resolve, 100));
                } else {
                    await new Promise((resolve) => setTimeout(resolve, 300));
                }

                loadPage(activePage);
            } catch {
                loadPage(activePage);
            } finally {
                setIsFontLoading(false);
            }
        };

        loadPageWithFont();
    }, [activePage, linesDb]);

    useEffect(() => {
        if (activePage < 1 || activePage > 604) {
            return;
        }

        const cached = segmentsByPageCache[activePage];

        if (cached !== undefined) {
            setCurrentPageSegments(cached);
            setIsLoadingSegments(false);
            return;
        }

        let cancelled = false;
        setIsLoadingSegments(true);
        setCurrentPageSegments([]);

        quranSegmentsService
            .getSegmentsByPage(activePage)
            .then((data) => {
                if (cancelled) {
                    return;
                }

                const segs = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
                setSegmentsByPageCache((prev) => ({ ...prev, [activePage]: segs }));
                setCurrentPageSegments(segs);
            })
            .catch((err) => {
                if (!cancelled) {
                    console.error('Error loading segments:', err);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setIsLoadingSegments(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [activePage, segmentsByPageCache]);

    const selectedAyahs = useMemo(() => {
        const set = new Set();

        if (selectedStartSegment?.page_number === activePage) {
            verseKeysForSegment(selectedStartSegment).forEach((k) => set.add(k));
        }

        if (selectedEndSegment?.page_number === activePage) {
            verseKeysForSegment(selectedEndSegment).forEach((k) => set.add(k));
        }

        if (currentSelection?.page_number === activePage) {
            verseKeysForSegment(currentSelection).forEach((k) => set.add(k));
        }

        return set;
    }, [activePage, selectedStartSegment, selectedEndSegment, currentSelection]);

    const handleWordClick = useCallback((_wordId, location) => {
        const segment = findSegmentForVerseKey(location, currentPageSegments);

        if (!segment) {
            return;
        }

        setCurrentSelection(segment);
    }, [currentPageSegments]);

    const handleSetStart = useCallback(() => {
        if (currentSelection) {
            onSelectStartSegment(currentSelection);
        }
    }, [currentSelection, onSelectStartSegment]);

    const handleSetEnd = useCallback(() => {
        if (currentSelection) {
            onSelectEndSegment(currentSelection);
        }
    }, [currentSelection, onSelectEndSegment]);

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

    const isCurrentStart = currentSelection && isSameSegment(currentSelection, selectedStartSegment);
    const isCurrentEnd = supportsEndSelection && currentSelection && isSameSegment(currentSelection, selectedEndSegment);
    const gridCols = hideInlineMushaf
        ? 'grid-cols-1 md:grid-cols-[minmax(220px,1fr)_minmax(200px,260px)]'
        : 'grid-cols-1 lg:grid-cols-[1fr_minmax(220px,280px)_minmax(200px,260px)]';

    return (
        <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
                <div className={`grid gap-3 ${supportsEndSelection ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                    <div className="rounded-lg border-2 border-emerald-200 bg-emerald-50/50 px-3 py-2">
                        <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700 mb-0.5">
                            {t('quran.startSegment', 'Start')}
                        </div>
                        <div className="text-sm font-medium text-emerald-900">
                            {selectedStartSegment
                                ? `${t('quran.segment', 'Segment')} ${selectedStartSegment.segment_number}${selectedStartSegment.page_number != null ? ` · ${t('quran.page', 'Page')} ${selectedStartSegment.page_number}` : ''} (${surahData ? formatSegmentVerseLabel(selectedStartSegment, surahData, currentLang, t) : segmentLabel(selectedStartSegment)})`
                                : `- ${t('quran.notSet', 'Not set')}`}
                        </div>
                    </div>

                    {supportsEndSelection ? (
                        <div className="rounded-lg border-2 border-blue-200 bg-blue-50/50 px-3 py-2">
                            <div className="text-xs font-semibold uppercase tracking-wide text-blue-700 mb-0.5">
                                {t('quran.endSegment', 'End')}
                            </div>
                            <div className="text-sm font-medium text-blue-900">
                                {selectedEndSegment
                                    ? `${t('quran.segment', 'Segment')} ${selectedEndSegment.segment_number}${selectedEndSegment.page_number != null ? ` · ${t('quran.page', 'Page')} ${selectedEndSegment.page_number}` : ''} (${surahData ? formatSegmentVerseLabel(selectedEndSegment, surahData, currentLang, t) : segmentLabel(selectedEndSegment)})`
                                    : `- ${t('quran.notSet', 'Not set')}`}
                            </div>
                        </div>
                    ) : null}
                </div>

                <div className="border-t border-gray-100 pt-3 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('quran.juz', 'Juz')}</label>
                            <ReactSelect
                                value={selectedJuz}
                                onChange={(val) => setSelectedJuz(val === null || val === 'all' ? 'all' : Number(val))}
                                options={juzOptionsForSelect}
                                placeholder={t('quran.juz', 'Juz')}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('quran.surah', 'Surah')}</label>
                            <ReactSelect
                                value={selectedSurah}
                                onChange={(val) => setSelectedSurah(val === null || val === 'all' ? 'all' : Number(val))}
                                options={surahOptionsForSelect}
                                placeholder={t('quran.surah', 'Surah')}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end w-full">
                        <MushafPageNavigator
                            value={activePage}
                            onChange={setPage}
                            pageNumbers={pageNumbers.length > 0 ? pageNumbers : undefined}
                            className="w-full"
                        />
                    </div>
                </div>
            </div>

            <p className="text-sm text-gray-500">
                {isDailyAmountPlan
                    ? t('quran.hintSelectStartOnly', 'Click a segment (on the page or in the list), then click "Set as Start". The system will determine the end automatically.')
                    : supportsEndSelection
                    ? t('quran.hintStartEnd', 'Click a segment (on the page or in the list), then click "Set as Start" or "Set as End".')
                    : t('quran.clickSegmentThenSet', 'Click a segment (on the page or in the list), then set it as the selected segment.')}
            </p>

            <div className={`grid ${gridCols} gap-4 items-start`}>
                {!hideInlineMushaf ? (
                    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white min-w-0">
                        {isLoadingSegments && currentPageSegments.length === 0 ? (
                            <div className="flex justify-center py-12">
                                <div className="spinner" />
                            </div>
                        ) : (
                            <MushafPage
                                pageLines={pageLines}
                                currentPage={activePage}
                                wordsDb={wordsDb}
                                surahData={surahData}
                                selectedAyahs={selectedAyahs}
                                onWordClick={handleWordClick}
                                isFontLoading={isFontLoading}
                            />
                        )}
                    </div>
                ) : null}

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        {`${t('quran.segmentsForPage', 'Segments for Page')} ${activePage}`}
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
                                        onClick={() => setCurrentSelection(seg)}
                                        className={`rounded-lg px-3 py-2 text-left text-sm border-2 transition-colors ${
                                            isSelected
                                                ? 'border-primary-500 bg-primary-50 text-primary-900'
                                                : currentSelection?.id === seg.id
                                                    ? 'border-primary-400 bg-primary-50/70 text-primary-900'
                                                    : 'border-gray-200 bg-white hover:border-primary-300'
                                        }`}
                                    >
                                        <span className="font-medium">{t('quran.segment', 'Segment')} {seg.segment_number}</span>
                                        <span className="text-gray-500 ml-1">
                                            ({seg.first_verse_key}
                                            {seg.first_verse_key !== seg.last_verse_key ? ` - ${seg.last_verse_key}` : ''})
                                        </span>
                                        {isStart || isEnd ? (
                                            <span className="ml-1 text-primary-600 text-xs block mt-0.5">
                                                {isStart
                                                    ? ` [${t('quran.startSegment', 'Start')}]`
                                                    : ` [${t('quran.endSegment', 'End')}]`}
                                            </span>
                                        ) : null}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 py-2">{t('quran.noSegmentsFound', 'No segments found for this page')}</p>
                    )}
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-3 min-w-0 space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700">
                        {t('quran.selectSegment', 'Select segment')}
                    </h4>

                    {currentSelection ? (
                        <>
                            <div className="text-sm text-gray-800">
                                <span className="font-medium">{t('quran.segment', 'Segment')} {currentSelection.segment_number}</span>
                                {currentSelection.page_number != null ? (
                                    <span className="text-gray-500 font-normal ml-1">
                                        · {t('quran.page', 'Page')} {currentSelection.page_number}
                                    </span>
                                ) : null}
                                <p className="text-gray-600 mt-0.5 text-xs leading-snug">
                                    {surahData ? formatSegmentVerseLabel(currentSelection, surahData, currentLang, t) : segmentLabel(currentSelection)}
                                </p>
                            </div>

                            <div className="flex flex-col gap-2">
                                <button
                                    type="button"
                                    onClick={handleSetStart}
                                    className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium shadow-sm transition-colors w-full ${
                                        isCurrentStart
                                            ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-400 cursor-default'
                                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                    }`}
                                >
                                    {isCurrentStart ? <CheckIcon width={16} height={16} className="shrink-0" /> : null}
                                    {isCurrentStart ? t('quran.alreadySetAsStart', 'Set as Start') : t('quran.setAsStart', 'Set as Start')}
                                </button>

                                {supportsEndSelection ? (
                                    <button
                                        type="button"
                                        onClick={handleSetEnd}
                                        className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium shadow-sm transition-colors w-full ${
                                            isCurrentEnd
                                                ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-400 cursor-default'
                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                    >
                                        {isCurrentEnd ? <CheckIcon width={16} height={16} className="shrink-0" /> : null}
                                        {isCurrentEnd ? t('quran.alreadySetAsEnd', 'Set as End') : t('quran.setAsEnd', 'Set as End')}
                                    </button>
                                ) : null}
                            </div>

                            {isCurrentStart || isCurrentEnd ? (
                                <p className="text-xs text-gray-600 flex items-start gap-1.5">
                                    <CheckIcon width={14} height={14} className="text-emerald-600 shrink-0 mt-0.5" />
                                    <span>
                                        {isCurrentStart && isCurrentEnd
                                                ? t('quran.thisSegmentIsStartAndEnd', 'This segment is set as both Start and End.')
                                                : isCurrentStart
                                                    ? t('quran.thisSegmentIsStart', 'This segment is currently the start.')
                                                    : t('quran.thisSegmentIsEnd', 'This segment is currently the end.')}
                                    </span>
                                </p>
                            ) : null}
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-gray-500 italic">
                                {t('quran.clickSegmentFirst', 'Click a segment in the page or list')}
                            </p>
                            <button
                                type="button"
                                disabled
                                className="rounded-lg px-3 py-2 text-sm font-medium bg-gray-200 text-gray-500 cursor-not-allowed w-full"
                            >
                                {t('quran.setAsStart', 'Set as Start')}
                            </button>
                            {supportsEndSelection ? (
                                <button
                                    type="button"
                                    disabled
                                    className="rounded-lg px-3 py-2 text-sm font-medium bg-gray-200 text-gray-500 cursor-not-allowed w-full"
                                >
                                    {t('quran.setAsEnd', 'Set as End')}
                                </button>
                            ) : null}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InlineMushafSegmentPicker;
