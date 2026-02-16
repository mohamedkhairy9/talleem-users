import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { XIcon } from '@/globals/icons';
import MushafPage from './MushafPage';
import { dbLoader } from '@/utils/helpers/databaseLoader';
import { fontLoader } from '@/utils/helpers/fontLoader';
import type { Database } from 'sql.js';

interface MushafPageModalProps {
    isOpen: boolean;
    onClose: () => void;
    pageNumber: number;
    selectedAyahs?: Set<string>;
}

/**
 * MushafPageModal Component
 * Displays a mushaf page in a modal with database and font loading
 */
const MushafPageModal: React.FC<MushafPageModalProps> = ({
    isOpen,
    onClose,
    pageNumber,
    selectedAyahs = new Set()
}) => {
    const { t } = useTranslation();
    const [pageLines, setPageLines] = useState<any[]>([]);
    const [linesDb, setLinesDb] = useState<Database | null>(null);
    const [wordsDb, setWordsDb] = useState<Database | null>(null);
    const [surahData, setSurahData] = useState<Record<string, any> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFontLoading, setIsFontLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    // Load page data when page number or databases change
    useEffect(() => {
        if (!isOpen || !linesDb || pageNumber < 1 || pageNumber > 604) return;

        const loadPageWithFont = async () => {
            try {
                setIsFontLoading(true);
                
                // Load font for the page
                fontLoader.loadPageFont(pageNumber);
                
                // Wait for font to load
                if (document.fonts) {
                    await document.fonts.load(`1em QuranicFont-${pageNumber}`);
                    await new Promise(resolve => setTimeout(resolve, 100));
                } else {
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
                
                // Load page lines
                loadPage(pageNumber);
                setIsFontLoading(false);
            } catch (error) {
                console.error('Error loading font:', error);
                loadPage(pageNumber);
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
    }, [pageNumber, linesDb, isOpen]);

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
                <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[calc(100vh-5rem)] md:max-h-[calc(100vh-6rem)] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-white">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {t('quran.mushafPage', 'Mushaf Page')} - {t('quran.page', 'Page')} {pageNumber}
                        </h3>
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
                    <div className="px-6 py-4 overflow-y-auto max-h-[calc(100vh-12rem)]">
                        {isLoading ? (
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
                                currentPage={pageNumber}
                                wordsDb={wordsDb}
                                surahData={surahData}
                                selectedAyahs={selectedAyahs}
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

