import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { XIcon, ChevronRightIcon } from '@/globals/icons';
import MushafPage from './MushafPage';
import { dbLoader } from '@/utils/helpers/databaseLoader';
import { fontLoader } from '@/utils/helpers/fontLoader';
import type { Database } from 'sql.js';

interface MushafPageModalProps {
    isOpen: boolean;
    onClose: () => void;
    pageNumber?: number; // Optional for single page view
    selectedAyahs?: Set<string>;
    // Plan view mode
    startVerseKey?: string; // Format: "surah:ayah" (e.g., "1:1")
    endVerseKey?: string; // Format: "surah:ayah" (e.g., "1:7")
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
    endVerseKey
}) => {
    const { t } = useTranslation();
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
    
    // Determine if we're in plan view mode
    const isPlanView = !!startVerseKey && !!endVerseKey;
    const currentPage = isPlanView && planPages.length > 0 
        ? planPages[currentPageIndex] 
        : (pageNumber || 1);
    
    // Generate selected ayahs for plan view (all verses between start and end)
    const planSelectedAyahs = useMemo(() => {
        if (!isPlanView || !startVerseKey || !endVerseKey) return new Set<string>();
        
        const ayahs = new Set<string>();
        const [startSurah, startAyah] = startVerseKey.split(':').map(Number);
        const [endSurah, endAyah] = endVerseKey.split(':').map(Number);
        
        for (let s = startSurah; s <= endSurah; s++) {
            const startA = (s === startSurah) ? startAyah : 1;
            const endA = (s === endSurah) ? endAyah : 999;
            for (let a = startA; a <= endA; a++) {
                ayahs.add(`${s}:${a}`);
            }
        }
        
        return ayahs;
    }, [isPlanView, startVerseKey, endVerseKey]);
    
    const displaySelectedAyahs = isPlanView ? planSelectedAyahs : selectedAyahs;

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
                setError(err?.message || 'Failed to load Quran databases');
                setIsLoading(false);
            }
        };

        initializeDatabases();

        return () => {
            // Don't cleanup on unmount - keep databases loaded for performance
            // dbLoader.cleanup();
        };
    }, [isOpen]);

    // Helper function to get page number from verse key
    const getPageNumberFromVerseKey = React.useCallback((verseKey: string): number | null => {
        if (!wordsDb || !linesDb || !verseKey) return null;
        
        try {
            const [surah] = verseKey.split(':').map(Number);
            const wordsQuery = `SELECT id FROM words WHERE location = '${verseKey}' ORDER BY id LIMIT 1`;
            const wordsResult = wordsDb.exec(wordsQuery);
            
            if (!wordsResult || wordsResult.length === 0 || !wordsResult[0].values || wordsResult[0].values.length === 0) {
                return Math.max(1, Math.min(604, Math.floor((surah - 1) * 2) + 1));
            }
            
            const wordId = wordsResult[0].values[0][0] as number;
            const pageQuery = `SELECT DISTINCT page_number FROM pages WHERE first_word_id <= ${wordId} AND last_word_id >= ${wordId} LIMIT 1`;
            const pageResult = linesDb.exec(pageQuery);
            
            if (pageResult && pageResult.length > 0 && pageResult[0].values && pageResult[0].values.length > 0) {
                const columns = pageResult[0].columns;
                const pageIndex = columns && Array.isArray(columns) ? columns.indexOf('page_number') : 0;
                return pageResult[0].values[0][pageIndex] as number;
            }
            
            return Math.max(1, Math.min(604, Math.floor((surah - 1) * 2) + 1));
        } catch (error) {
            console.error('Error querying database for verse key:', error);
            return null;
        }
    }, [wordsDb, linesDb]);

    // Get all pages between start and end verse keys using word IDs (more efficient)
    const getAllPagesInRange = React.useCallback(async (startKey: string, endKey: string): Promise<number[]> => {
        if (!wordsDb || !linesDb) return [];
        
        try {
            // Get first word ID from start verse key
            const startWordsQuery = `SELECT MIN(id) as first_word_id FROM words WHERE location = '${startKey}'`;
            const startWordsResult = wordsDb.exec(startWordsQuery);
            let firstWordId: number | null = null;
            
            if (startWordsResult && startWordsResult.length > 0 && startWordsResult[0].values && startWordsResult[0].values.length > 0) {
                firstWordId = startWordsResult[0].values[0][0] as number;
            }
            
            // Get last word ID from end verse key
            const endWordsQuery = `SELECT MAX(id) as last_word_id FROM words WHERE location = '${endKey}'`;
            const endWordsResult = wordsDb.exec(endWordsQuery);
            let lastWordId: number | null = null;
            
            if (endWordsResult && endWordsResult.length > 0 && endWordsResult[0].values && endWordsResult[0].values.length > 0) {
                lastWordId = endWordsResult[0].values[0][0] as number;
            }
            
            // If we can't find word IDs, fallback to getting pages from verse keys
            if (!firstWordId || !lastWordId) {
                const startPage = getPageNumberFromVerseKey(startKey);
                const endPage = getPageNumberFromVerseKey(endKey);
                
                if (startPage && endPage) {
                    // Return all pages between start and end (inclusive)
                    const pages: number[] = [];
                    for (let p = Math.min(startPage, endPage); p <= Math.max(startPage, endPage); p++) {
                        pages.push(p);
                    }
                    return pages;
                }
                return [];
            }
            
            // Query all pages that contain words in the range
            // A page contains words in range if:
            // - page's first_word_id <= lastWordId AND page's last_word_id >= firstWordId
            const pagesQuery = `SELECT DISTINCT page_number FROM pages 
                WHERE (first_word_id <= ${lastWordId} AND last_word_id >= ${firstWordId})
                ORDER BY page_number`;
            const pagesResult = linesDb.exec(pagesQuery);
            
            if (pagesResult && pagesResult.length > 0 && pagesResult[0].values && pagesResult[0].values.length > 0) {
                const columns = pagesResult[0].columns;
                const pageIndex = columns && Array.isArray(columns) ? columns.indexOf('page_number') : 0;
                return pagesResult[0].values.map((row: any) => row[pageIndex] as number);
            }
            
            // Fallback: if query fails, get start and end pages and return range
            const startPage = getPageNumberFromVerseKey(startKey);
            const endPage = getPageNumberFromVerseKey(endKey);
            
            if (startPage && endPage) {
                const pages: number[] = [];
                for (let p = Math.min(startPage, endPage); p <= Math.max(startPage, endPage); p++) {
                    pages.push(p);
                }
                return pages;
            }
            
            return [];
        } catch (error) {
            console.error('Error getting pages in range:', error);
            // Fallback: try to get at least start and end pages
            try {
                const startPage = getPageNumberFromVerseKey(startKey);
                const endPage = getPageNumberFromVerseKey(endKey);
                
                if (startPage && endPage) {
                    const pages: number[] = [];
                    for (let p = Math.min(startPage, endPage); p <= Math.max(startPage, endPage); p++) {
                        pages.push(p);
                    }
                    return pages;
                }
            } catch (fallbackError) {
                console.error('Fallback error:', fallbackError);
            }
            return [];
        }
    }, [wordsDb, linesDb, getPageNumberFromVerseKey]);

    // Load plan pages when in plan view mode
    useEffect(() => {
        if (!isOpen || !isPlanView || !wordsDb || !linesDb || !startVerseKey || !endVerseKey) return;
        
        setIsLoadingPlanPages(true);
        getAllPagesInRange(startVerseKey, endVerseKey)
            .then((pages) => {
                setPlanPages(pages);
                setCurrentPageIndex(0);
                setIsLoadingPlanPages(false);
            })
            .catch((error) => {
                console.error('Error loading plan pages:', error);
                setIsLoadingPlanPages(false);
            });
    }, [isOpen, isPlanView, wordsDb, linesDb, startVerseKey, endVerseKey, getAllPagesInRange]);

    // Load page data when page number or databases change
    useEffect(() => {
        if (!isOpen || !linesDb || currentPage < 1 || currentPage > 604) return;

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
                setError(err?.message || 'Failed to load page data');
                setIsLoading(false);
            }
        };

        loadPageWithFont();
    }, [currentPage, linesDb, isOpen]);

    // Navigation handlers
    const goToNextPage = () => {
        if (isPlanView && currentPageIndex < planPages.length - 1) {
            setCurrentPageIndex(currentPageIndex + 1);
        }
    };

    const goToPrevPage = () => {
        if (isPlanView && currentPageIndex > 0) {
            setCurrentPageIndex(currentPageIndex - 1);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black transition-opacity"
                style={{ opacity: 0.75 }}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal */}
            <div className="relative flex min-h-full items-center justify-center p-4 pt-20 md:pt-24 z-10">
                <div className="relative bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[calc(100vh-5rem)] md:max-h-[calc(100vh-6rem)] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-white">
                        <div className="flex items-center gap-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {isPlanView 
                                    ? t('quran.planView', 'Plan View')
                                    : `${t('quran.mushafPage', 'Mushaf Page')} - ${t('quran.page', 'Page')} ${currentPage}`
                                }
                            </h3>
                            {isPlanView && planPages.length > 0 && (
                                <span className="text-sm text-gray-500">
                                    {t('quran.page', 'Page')} {currentPage} {t('quran.of', 'of')} {planPages.length}
                                </span>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                            aria-label="Close"
                        >
                            <XIcon width={20} height={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="relative px-2 sm:px-4 md:px-6 py-2 sm:py-4 overflow-y-auto max-h-[calc(100vh-12rem)]">
                        {/* Navigation buttons for plan view */}
                        {isPlanView && planPages.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    onClick={goToPrevPage}
                                    disabled={currentPageIndex === 0}
                                    className={`absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white shadow-lg border border-gray-300 transition-all ${
                                        currentPageIndex === 0
                                            ? 'opacity-50 cursor-not-allowed'
                                            : 'hover:bg-gray-50 hover:shadow-xl'
                                    }`}
                                    aria-label={t('quran.previousPage', 'Previous Page')}
                                >
                                    <ChevronRightIcon 
                                        width={24} 
                                        height={24} 
                                        className="text-gray-700 rotate-180" 
                                    />
                                </button>
                                <button
                                    type="button"
                                    onClick={goToNextPage}
                                    disabled={currentPageIndex === planPages.length - 1}
                                    className={`absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white shadow-lg border border-gray-300 transition-all ${
                                        currentPageIndex === planPages.length - 1
                                            ? 'opacity-50 cursor-not-allowed'
                                            : 'hover:bg-gray-50 hover:shadow-xl'
                                    }`}
                                    aria-label={t('quran.nextPage', 'Next Page')}
                                >
                                    <ChevronRightIcon 
                                        width={24} 
                                        height={24} 
                                        className="text-gray-700" 
                                    />
                                </button>
                            </>
                        )}
                        
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
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MushafPageModal;

