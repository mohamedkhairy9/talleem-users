import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpenIcon } from '@/shared/icons';
import { dbLoader } from '@/shared/utils/helpers/databaseLoader';
import { fontLoader } from '@/shared/utils/helpers/fontLoader';
import {
    getJuzNumberForVerseKey,
    getPageForVerseKey,
    getVerseKeyDisplay,
    loadMushafPages,
    verseKeysBetween
} from '@/shared/utils/helpers/surahHelper';
import MushafPage from '@/features/entity-manager/halaqas/components/MushafPage';
import MushafPageNavigator from '@/features/entity-manager/halaqas/components/MushafPageNavigator';

const CARD_CLASS = 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm';

function normalizeSegments(segments) {
    return (Array.isArray(segments) ? segments : [])
        .map((segment, index) => {
            const firstVerseKey = segment?.first_verse_key?.trim() || null;
            const lastVerseKey = segment?.last_verse_key?.trim() || firstVerseKey;

            if (!firstVerseKey || !lastVerseKey) {
                return null;
            }

            return {
                id: segment?.id ?? `${firstVerseKey}-${lastVerseKey}-${index}`,
                order: segment?.order ?? index + 1,
                juzNumber: segment?.juz_number ?? null,
                firstVerseKey,
                lastVerseKey,
                columnTotal: segment?.column_total ?? 0
            };
        })
        .filter(Boolean);
}

function buildPageNumbers(startPage, endPage) {
    if (!Number.isFinite(startPage) || !Number.isFinite(endPage)) {
        return [];
    }

    const from = Math.min(startPage, endPage);
    const to = Math.max(startPage, endPage);

    return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}

function formatVerseKeyLabel(verseKey, surahData, currentLang, t) {
    if (!verseKey) {
        return '-';
    }

    const display = getVerseKeyDisplay(verseKey, surahData, currentLang);

    if (!display) {
        return verseKey;
    }

    return `${display.surahName} - ${t('quran.ayah', 'Ayah')} ${display.ayahNumber}`;
}

function formatVerseRange(segment, surahData, currentLang, t) {
    const first = formatVerseKeyLabel(segment?.firstVerseKey, surahData, currentLang, t);

    if (!segment?.lastVerseKey || segment.firstVerseKey === segment.lastVerseKey) {
        return first;
    }

    const last = formatVerseKeyLabel(segment.lastVerseKey, surahData, currentLang, t);
    return `${first} ${t('examConduction.to', 'to')} ${last}`;
}

function formatPageRange(pageNumbers, t) {
    if (!Array.isArray(pageNumbers) || pageNumbers.length === 0) {
        return '-';
    }

    if (pageNumbers.length === 1) {
        return `${t('quran.page', 'Page')} ${pageNumbers[0]}`;
    }

    return `${t('quran.page', 'Page')} ${pageNumbers[0]} - ${pageNumbers[pageNumbers.length - 1]}`;
}

function loadPageLines(linesDb, pageNumber) {
    const query = `SELECT * FROM pages WHERE page_number = ${pageNumber} ORDER BY line_number`;
    const result = linesDb.exec(query);

    if (!result?.length || !result[0]?.values?.length) {
        return [];
    }

    const firstResult = result[0];
    const columns = Array.isArray(firstResult.columns)
        ? firstResult.columns
        : ['page_number', 'line_number', 'line_type', 'surah_number', 'first_word_id', 'last_word_id', 'is_centered'];

    return firstResult.values.map((row) => {
        const line = {};

        columns.forEach((column, index) => {
            line[column] = row[index];
        });

        return line;
    });
}

const ExamMushafViewer = ({ segments, selectedSegmentId, onSelectSegment }) => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'ar';
    const [linesDb, setLinesDb] = useState(null);
    const [wordsDb, setWordsDb] = useState(null);
    const [surahData, setSurahData] = useState(null);
    const [mushafPages, setMushafPages] = useState([]);
    const [pageLines, setPageLines] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isFontLoading, setIsFontLoading] = useState(false);
    const [error, setError] = useState(null);
    const [internalSelectedSegmentId, setInternalSelectedSegmentId] = useState(null);

    const normalizedSegments = useMemo(() => normalizeSegments(segments), [segments]);
    const resolvedSelectedSegmentId = selectedSegmentId ?? internalSelectedSegmentId;

    const handleSelectSegment = useCallback((segmentId) => {
        if (onSelectSegment) {
            onSelectSegment(segmentId);
            return;
        }

        setInternalSelectedSegmentId(segmentId);
    }, [onSelectSegment]);

    useEffect(() => {
        let cancelled = false;

        setIsLoading(true);
        setError(null);

        Promise.all([dbLoader.initialize(), loadMushafPages()])
            .then(([dbData, pages]) => {
                if (cancelled) {
                    return;
                }

                setLinesDb(dbData?.linesDb ?? null);
                setWordsDb(dbData?.wordsDb ?? null);
                setSurahData(dbData?.surahData ?? null);
                setMushafPages(Array.isArray(pages) ? pages : []);
            })
            .catch((requestError) => {
                if (!cancelled) {
                    setError(requestError?.message || t('quran.loadError', 'Failed to load Quran databases'));
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setIsLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [t]);

    useEffect(() => {
        if (normalizedSegments.length === 0) {
            return;
        }

        const hasSelection = normalizedSegments.some((segment) => String(segment.id) === String(resolvedSelectedSegmentId));

        if (!hasSelection) {
            handleSelectSegment(normalizedSegments[0].id);
        }
    }, [handleSelectSegment, normalizedSegments, resolvedSelectedSegmentId]);

    const selectedSegment = useMemo(() => (
        normalizedSegments.find((segment) => String(segment.id) === String(resolvedSelectedSegmentId)) ?? normalizedSegments[0] ?? null
    ), [normalizedSegments, resolvedSelectedSegmentId]);

    const selectedSegmentPages = useMemo(() => {
        if (!selectedSegment || mushafPages.length === 0) {
            return [];
        }

        const startPage = getPageForVerseKey(selectedSegment.firstVerseKey, mushafPages);
        const endPage = getPageForVerseKey(selectedSegment.lastVerseKey, mushafPages);

        return buildPageNumbers(startPage, endPage);
    }, [mushafPages, selectedSegment]);

    useEffect(() => {
        if (selectedSegmentPages.length === 0) {
            return;
        }

        if (!selectedSegmentPages.includes(currentPage)) {
            setCurrentPage(selectedSegmentPages[0]);
        }
    }, [currentPage, selectedSegmentPages]);

    useEffect(() => {
        if (!selectedSegmentPages.length) {
            return;
        }

        setCurrentPage(selectedSegmentPages[0]);
    }, [resolvedSelectedSegmentId, selectedSegmentPages]);

    useEffect(() => {
        if (!linesDb || currentPage < 1 || currentPage > 604) {
            return;
        }

        let cancelled = false;

        const loadCurrentPage = async () => {
            setIsFontLoading(true);

            try {
                fontLoader.loadPageFont(currentPage);
                fontLoader.preloadNearbyPages(currentPage);

                if (document.fonts) {
                    await document.fonts.load(`1em QuranicFont-${currentPage}`);
                    await new Promise((resolve) => setTimeout(resolve, 100));
                } else {
                    await new Promise((resolve) => setTimeout(resolve, 300));
                }

                const lines = loadPageLines(linesDb, currentPage);

                if (!cancelled) {
                    setPageLines(lines);
                    fontLoader.clearUnusedFonts(currentPage, 2);
                }
            } catch (_error) {
                if (!cancelled) {
                    setPageLines(loadPageLines(linesDb, currentPage));
                }
            } finally {
                if (!cancelled) {
                    setIsFontLoading(false);
                }
            }
        };

        loadCurrentPage();

        return () => {
            cancelled = true;
        };
    }, [currentPage, linesDb]);

    const selectedAyahs = useMemo(() => {
        if (!selectedSegment || mushafPages.length === 0) {
            return new Set();
        }

        const pageEntry = mushafPages.find((page) => Number(page?.page) === Number(currentPage));

        if (!pageEntry?.start_verse_key || !pageEntry?.end_verse_key) {
            return new Set();
        }

        return new Set(
            verseKeysBetween(
                selectedSegment.firstVerseKey,
                selectedSegment.lastVerseKey,
                pageEntry.start_verse_key,
                pageEntry.end_verse_key
            )
        );
    }, [currentPage, mushafPages, selectedSegment]);

    const juzRangeLabel = useMemo(() => {
        if (!selectedSegment) {
            return '-';
        }

        const firstJuz = getJuzNumberForVerseKey(selectedSegment.firstVerseKey);
        const lastJuz = getJuzNumberForVerseKey(selectedSegment.lastVerseKey);

        if (firstJuz === lastJuz) {
            return `${t('quran.juz', 'Juz')} ${firstJuz}`;
        }

        return `${t('quran.juz', 'Juz')} ${firstJuz} - ${lastJuz}`;
    }, [selectedSegment, t]);

    if (normalizedSegments.length === 0) {
        return (
            <section className={CARD_CLASS}>
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7f5f3] text-primary-600">
                        <BookOpenIcon width={20} height={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            {t('examConduction.mushafViewerTitle', 'Interactive Mushaf')}
                        </h2>
                        <p className="text-sm text-gray-500">
                            {t('examConduction.noMushafData', 'No verse range is available for this exam yet.')}
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    if (isLoading) {
        return (
            <section className={`${CARD_CLASS} flex min-h-[260px] items-center justify-center`}>
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
                    <p className="text-sm text-gray-600">{t('common.loading', 'Loading...')}</p>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className={CARD_CLASS}>
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
                    {error}
                </div>
            </section>
        );
    }

    return (
        <section className={CARD_CLASS}>
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                        {t('examConduction.mushafViewerTitle', 'Interactive Mushaf')}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        {t('examConduction.mushafViewerSubtitle', 'Choose the segment and preview exactly what the student will be reciting.')}
                    </p>
                </div>
                <div className="rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700">
                    {selectedSegment
                        ? `${t('examConduction.segmentLabel', 'Segment')} #${selectedSegment.order}`
                        : '-'}
                </div>
            </div>

            <div className="mb-5 flex gap-3 overflow-x-auto pb-2">
                {normalizedSegments.map((segment) => {
                    const isSelected = String(segment.id) === String(selectedSegment?.id);

                    return (
                        <button
                            key={segment.id}
                            type="button"
                            onClick={() => handleSelectSegment(segment.id)}
                            className={`min-w-[220px] rounded-2xl border px-4 py-3 text-start transition-colors ${
                                isSelected
                                    ? 'border-primary-600 bg-primary-50 shadow-sm'
                                    : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-gray-50'
                            }`}
                        >
                            <p className="text-sm font-semibold text-gray-900">
                                {t('examConduction.segmentLabel', 'Segment')} #{segment.order}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                {formatVerseRange(segment, surahData, currentLang, t)}
                            </p>
                        </button>
                    );
                })}
            </div>

            {selectedSegment ? (
                <>
                    <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                                {t('examConduction.listeningRange', 'Listening Range')}
                            </p>
                            <p className="mt-2 text-sm font-medium text-sky-950">
                                {formatVerseRange(selectedSegment, surahData, currentLang, t)}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                {t('examConduction.listeningPages', 'Pages')}
                            </p>
                            <p className="mt-2 text-sm font-medium text-emerald-950">
                                {formatPageRange(selectedSegmentPages, t)}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                                {t('examConduction.juzLabel', 'Juz')}
                            </p>
                            <p className="mt-2 text-sm font-medium text-amber-950">
                                {selectedSegment.juzNumber ? `${t('quran.juz', 'Juz')} ${selectedSegment.juzNumber}` : juzRangeLabel}
                            </p>
                        </div>
                    </div>

                    <div className="mb-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                        <MushafPageNavigator
                            value={currentPage}
                            onChange={setCurrentPage}
                            pageNumbers={selectedSegmentPages}
                            className="w-full"
                        />

                        {selectedSegmentPages.length > 1 ? (
                            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                                {selectedSegmentPages.map((pageNumber) => {
                                    const isActive = Number(pageNumber) === Number(currentPage);

                                    return (
                                        <button
                                            key={pageNumber}
                                            type="button"
                                            onClick={() => setCurrentPage(pageNumber)}
                                            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                                                isActive
                                                    ? 'border-primary-600 bg-primary-600 text-white'
                                                    : 'border-gray-300 bg-white text-gray-700 hover:border-primary-300'
                                            }`}
                                        >
                                            {t('quran.page', 'Page')} {pageNumber}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : null}
                    </div>

                    <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-gradient-to-br from-[#f4fbff] via-white to-[#f6fff9] p-4">
                        <MushafPage
                            pageLines={pageLines}
                            currentPage={currentPage}
                            wordsDb={wordsDb}
                            surahData={surahData}
                            selectedAyahs={selectedAyahs}
                            isFontLoading={isFontLoading}
                        />
                    </div>
                </>
            ) : null}
        </section>
    );
};

export default ExamMushafViewer;
