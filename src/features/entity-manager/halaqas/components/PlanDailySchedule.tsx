import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarIcon, BookOpenIcon } from '@/globals/icons';
import MushafPageModal from './MushafPageModal';
import { toast } from 'react-toastify';
import { dbLoader } from '@/utils/helpers/databaseLoader';
import { getDisplayDate, getGregorianDate } from '@/utils';
import { useDateFormatStore } from '@/stores';
import type { DailyScheduleItem } from '../types/list.types';

interface PlanDailyScheduleProps {
    dailySchedule: DailyScheduleItem[];
    currentDate?: string; // Optional: highlight current/today's schedule
    compact?: boolean; // Show compact view
    maxItems?: number; // Maximum items to show initially
}

const PlanDailySchedule: React.FC<PlanDailyScheduleProps> = ({
    dailySchedule,
    currentDate,
    compact = false,
    maxItems = 10
}) => {
    const { t } = useTranslation();
    useDateFormatStore((s) => s.dateFormat); // re-render when date format changes
    const [showAll, setShowAll] = React.useState(false);
    
    // Mushaf modal state
    const [showMushafModal, setShowMushafModal] = useState(false);
    const [mushafPageNumber, setMushafPageNumber] = useState<number | undefined>(undefined);
    const [selectedAyahsForMushaf, setSelectedAyahsForMushaf] = useState<Set<string>>(new Set());
    
    // Database state
    const [wordsDb, setWordsDb] = useState<any>(null);
    const [linesDb, setLinesDb] = useState<any>(null);
    
    // Initialize database
    useEffect(() => {
        dbLoader.initialize().then(({ wordsDb: wDb, linesDb: lDb }) => {
            setWordsDb(wDb);
            setLinesDb(lDb);
        }).catch((error) => {
            console.error('Error initializing database:', error);
        });
    }, []);
    
    // Helper function to get page number from verse key using local database
    const getPageNumberFromVerseKey = React.useCallback(async (verseKey: string): Promise<number | null> => {
        if (!wordsDb || !linesDb || !verseKey) return null;
        
        try {
            // verse_key format: "surah:ayah" (e.g., "1:1")
            const [surah] = verseKey.split(':').map(Number);
            
            // Step 1: Find word IDs that belong to this verse location
            const wordsQuery = `SELECT id FROM words WHERE location = '${verseKey}' ORDER BY id LIMIT 1`;
            const wordsResult = wordsDb.exec(wordsQuery);
            
            if (!wordsResult || wordsResult.length === 0 || !wordsResult[0].values || wordsResult[0].values.length === 0) {
                // Fallback: approximate page based on surah
                const fallbackPage = Math.max(1, Math.min(604, Math.floor((surah - 1) * 2) + 1));
                return fallbackPage;
            }
            
            const wordId = wordsResult[0].values[0][0] as number;
            
            // Step 2: Query lines database to find which page contains this word
            // Pages table has first_word_id and last_word_id, so we find the page where wordId falls in that range
            const pageQuery = `SELECT DISTINCT page_number FROM pages WHERE first_word_id <= ${wordId} AND last_word_id >= ${wordId} LIMIT 1`;
            const pageResult = linesDb.exec(pageQuery);
            
            let pageNumber = 1; // Default
            if (pageResult && pageResult.length > 0 && pageResult[0].values && pageResult[0].values.length > 0) {
                const columns = pageResult[0].columns;
                const pageIndex = columns && Array.isArray(columns) ? columns.indexOf('page_number') : 0;
                pageNumber = pageResult[0].values[0][pageIndex] as number;
            } else {
                // Fallback: approximate based on surah (rough estimation)
                pageNumber = Math.max(1, Math.min(604, Math.floor((surah - 1) * 2) + 1));
            }
            
            return pageNumber;
        } catch (error) {
            console.error('Error querying database for verse key:', error);
            return null;
        }
    }, [wordsDb, linesDb]);

    // Get today's date in YYYY-MM-DD format
    const today = useMemo(() => {
        if (currentDate) return currentDate;
        return new Date().toISOString().split('T')[0];
    }, [currentDate]);

    // Find today's schedule item (date may be string or AppDate)
    const todaySchedule = useMemo(() => {
        return dailySchedule.find((item) => getGregorianDate(item.date) === today);
    }, [dailySchedule, today]);

    // Get items to display
    const itemsToShow = useMemo(() => {
        if (showAll || compact) return dailySchedule;
        return dailySchedule.slice(0, maxItems);
    }, [dailySchedule, showAll, compact, maxItems]);

    if (!dailySchedule || dailySchedule.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <p className="text-sm">{t('plan.noSchedule', 'No daily schedule available')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Today's Schedule Highlight */}
            {todaySchedule && (
                <div className="bg-primary-50 border-2 border-primary-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <CalendarIcon width={18} height={18} className="text-primary-600" />
                        <h3 className="text-sm font-semibold text-primary-900">
                            {t('plan.todaySchedule', "Today's Schedule")}
                        </h3>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium text-gray-700">
                                {t('plan.day', 'Day')} {todaySchedule.day}:
                            </span>
                            <span className="text-gray-600">
                                {getDisplayDate(todaySchedule.date)} ({todaySchedule.day_name})
                            </span>
                        </div>
                        <div className="text-sm text-gray-700">
                            <span className="font-medium">
                                {t('plan.verses', 'Verses')} {todaySchedule.from_verse_key} - {todaySchedule.to_verse_key}
                            </span>
                            {todaySchedule.juz_numbers && todaySchedule.juz_numbers.length > 0 && (
                                <span className="ml-2 text-primary-600">
                                    ({t('plan.juz', 'Juz')} {todaySchedule.juz_numbers.join(', ')})
                                </span>
                            )}
                        </div>
                        {todaySchedule.from_text && (
                            <div className="mt-2 p-2 bg-white rounded border border-primary-100">
                                <p className="text-xs text-gray-500 mb-1">{t('plan.startVerse', 'Start')}:</p>
                                <p className="text-sm text-gray-800 leading-relaxed" dir="rtl">
                                    {todaySchedule.from_text}
                                </p>
                            </div>
                        )}
                        <div className="mt-3">
                            <button
                                type="button"
                                onClick={async () => {
                                    if (!wordsDb || !linesDb) {
                                        toast.error(t('quran.databaseNotReady', 'Database is not ready. Please wait...'));
                                        return;
                                    }
                                    
                                    try {
                                        // Get page number from verse keys using local database
                                        const fromPage = await getPageNumberFromVerseKey(todaySchedule.from_verse_key);
                                        
                                        if (!fromPage) {
                                            toast.error(t('quran.verseNotFound', 'Verse information not found'));
                                            return;
                                        }
                                        
                                        // Use the page number from the first verse
                                        setMushafPageNumber(fromPage);
                                        
                                        // Create set of ayahs from first to last verse
                                        const ayahs = new Set<string>();
                                        const [startSurah, startAyah] = todaySchedule.from_verse_key.split(':').map(Number);
                                        const [endSurah, endAyah] = todaySchedule.to_verse_key.split(':').map(Number);
                                        
                                        for (let s = startSurah; s <= endSurah; s++) {
                                            const startA = (s === startSurah) ? startAyah : 1;
                                            const endA = (s === endSurah) ? endAyah : 999;
                                            for (let a = startA; a <= endA; a++) {
                                                ayahs.add(`${s}:${a}`);
                                            }
                                        }
                                        
                                        setSelectedAyahsForMushaf(ayahs);
                                        setShowMushafModal(true);
                                    } catch (error: any) {
                                        console.error('Error loading verse information:', error);
                                        toast.error(t('quran.errorLoadingVerse', 'Error loading verse information'));
                                    }
                                }}
                                className="px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-100 rounded-lg hover:bg-primary-200 transition-colors"
                                disabled={!wordsDb}
                            >
                                {t('quran.viewInMushaf', 'View in Mushaf')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Schedule List */}
            <div className="space-y-2">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">
                        {t('plan.fullSchedule', 'Full Schedule')} ({dailySchedule.length} {t('plan.days', 'days')})
                    </h3>
                    {!compact && dailySchedule.length > maxItems && (
                        <button
                            type="button"
                            onClick={() => setShowAll(!showAll)}
                            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                            {showAll
                                ? t('plan.showLess')
                                : t('plan.showAll', { count: dailySchedule.length })}
                        </button>
                    )}
                </div>

                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {itemsToShow.map((item) => {
                        const isToday = getGregorianDate(item.date) === today;
                        const isPast = new Date(getGregorianDate(item.date)) < new Date(today);

                        return (
                            <div
                                key={item.day}
                                className={`p-3 rounded-lg border transition-all ${
                                    isToday
                                        ? 'bg-primary-50 border-primary-300 shadow-sm'
                                        : isPast
                                        ? 'bg-gray-50 border-gray-200'
                                        : 'bg-white border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span
                                                className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                                    isToday
                                                        ? 'bg-primary-600 text-white'
                                                        : isPast
                                                        ? 'bg-gray-400 text-white'
                                                        : 'bg-gray-200 text-gray-700'
                                                }`}
                                            >
                                                {t('plan.day', 'Day')} {item.day}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {getDisplayDate(item.date)}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {item.day_name}
                                            </span>
                                            {isToday && (
                                                <span className="text-xs font-medium text-primary-600">
                                                    {t('plan.today', 'Today')}
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-2 space-y-1">
                                            <div className="flex items-center gap-2 text-sm">
                                                <BookOpenIcon width={14} height={14} className="text-gray-400" />
                                                <span className="text-gray-700">
                                                    <span className="font-medium">
                                                        {t('plan.verses', 'Verses')} {item.from_verse_key} - {item.to_verse_key}
                                                    </span>
                                                    {item.juz_numbers && item.juz_numbers.length > 0 && (
                                                        <span className="ml-2 text-primary-600">
                                                            ({t('plan.juz', 'Juz')} {item.juz_numbers.join(', ')})
                                                        </span>
                                                    )}
                                                </span>
                                            </div>

                                            {!compact && item.from_text && (
                                                <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-100">
                                                    <p className="text-xs text-gray-500 mb-1">
                                                        {t('plan.startVerse', 'Start')}: {item.from_text.substring(0, 50)}
                                                        {item.from_text.length > 50 ? '...' : ''}
                                                    </p>
                                                    {item.to_text && (
                                                        <p className="text-xs text-gray-500">
                                                            {t('plan.endVerse', 'End')}: {item.to_text.substring(0, 50)}
                                                            {item.to_text.length > 50 ? '...' : ''}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                if (!wordsDb) {
                                                    toast.error(t('quran.databaseNotReady', 'Database is not ready. Please wait...'));
                                                    return;
                                                }
                                                
                                                try {
                                                    // Get page number from verse keys using local database
                                                    const fromPage = await getPageNumberFromVerseKey(item.from_verse_key);
                                                    
                                                    if (!fromPage) {
                                                        toast.error(t('quran.verseNotFound', 'Verse information not found'));
                                                        return;
                                                    }
                                                    
                                                    // Use the page number from the first verse
                                                    setMushafPageNumber(fromPage);
                                                    
                                                    // Create set of ayahs from first to last verse
                                                    const ayahs = new Set<string>();
                                                    const [startSurah, startAyah] = item.from_verse_key.split(':').map(Number);
                                                    const [endSurah, endAyah] = item.to_verse_key.split(':').map(Number);
                                                    
                                                    for (let s = startSurah; s <= endSurah; s++) {
                                                        const startA = (s === startSurah) ? startAyah : 1;
                                                        const endA = (s === endSurah) ? endAyah : 999;
                                                        for (let a = startA; a <= endA; a++) {
                                                            ayahs.add(`${s}:${a}`);
                                                        }
                                                    }
                                                    
                                                    setSelectedAyahsForMushaf(ayahs);
                                                    setShowMushafModal(true);
                                                } catch (error: any) {
                                                    console.error('Error loading verse information:', error);
                                                    toast.error(t('quran.errorLoadingVerse', 'Error loading verse information'));
                                                }
                                            }}
                                            className="px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-100 rounded-lg hover:bg-primary-200 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                                            title={t('quran.viewInMushaf', 'View in Mushaf')}
                                            disabled={!wordsDb || !linesDb}
                                        >
                                            {t('quran.viewInMushaf', 'View in Mushaf')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            {/* Mushaf Modal */}
            {showMushafModal && mushafPageNumber && (
                <MushafPageModal
                    isOpen={showMushafModal}
                    onClose={() => {
                        setShowMushafModal(false);
                        setMushafPageNumber(undefined);
                        setSelectedAyahsForMushaf(new Set());
                    }}
                    pageNumber={mushafPageNumber}
                    selectedAyahs={selectedAyahsForMushaf}
                />
            )}
        </div>
    );
};

export default PlanDailySchedule;

