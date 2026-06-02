import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarIcon, BookOpenIcon } from '@/globals/icons';
import MushafPageModal from './MushafPageModal';
import { getDisplayDate, getGregorianDate } from '@/utils';
import { useDateFormatStore } from '@/stores';
import { loadSurahData, loadMushafPages, loadJuzPages, getVerseKeyDisplay, getJuzForVerseKey } from '@/utils/helpers/surahHelper';
const PlanDailySchedule = ({ dailySchedule, currentDate, compact = false, maxItems = 10 }) => {
    const { t, i18n } = useTranslation();
    const lang = i18n.language || 'ar';
    useDateFormatStore((s) => s.dateFormat); // re-render when date format changes
    const [showAll, setShowAll] = React.useState(false);
    const [surahData, setSurahData] = useState(null);
    const [mushafPages, setMushafPages] = useState([]);
    const [juzPages, setJuzPages] = useState([]);
    useEffect(() => {
        loadSurahData().then(setSurahData).catch(() => setSurahData(null));
    }, []);
    useEffect(() => {
        loadMushafPages().then(setMushafPages).catch(() => setMushafPages([]));
        loadJuzPages().then(setJuzPages).catch(() => setJuzPages([]));
    }, []);
    const formatVerseRange = useMemo(() => {
        const locale = lang === 'ar' ? 'ar' : 'en';
        const formatAyahNum = (n) => new Intl.NumberFormat(locale).format(n);
        return (fromKey, toKey) => {
            const from = getVerseKeyDisplay(fromKey, surahData, lang);
            const to = getVerseKeyDisplay(toKey, surahData, lang);
            const fromStr = from
                ? t('quran.surahAyahLabel', '{{surah}}, {{ayahLabel}}: {{number}}', {
                    surah: from.surahName,
                    ayahLabel: t('quran.ayah', 'Ayah'),
                    number: formatAyahNum(from.ayahNumber)
                })
                : fromKey;
            const toStr = to
                ? t('quran.surahAyahLabel', '{{surah}}, {{ayahLabel}}: {{number}}', {
                    surah: to.surahName,
                    ayahLabel: t('quran.ayah', 'Ayah'),
                    number: formatAyahNum(to.ayahNumber)
                })
                : toKey;
            let range = t('plan.fromVerseToVerse', 'From {{from}} to {{to}}', { from: fromStr, to: toStr });
            if (mushafPages.length > 0 && juzPages.length > 0) {
                const juzFrom = getJuzForVerseKey(fromKey, mushafPages, juzPages);
                const juzTo = getJuzForVerseKey(toKey, mushafPages, juzPages);
                const juzLabel = juzFrom === juzTo
                    ? t('quran.juzShort', 'Juz {{number}}', { number: juzFrom })
                    : t('plan.juzRange', 'Juz {{from}}–{{to}}', { from: juzFrom, to: juzTo });
                range = `${range} (${juzLabel})`;
            }
            return range;
        };
    }, [surahData, mushafPages, juzPages, lang, t]);
    // Mushaf modal: open with daily range (start/end verse keys) so viewer shows only that range
    const [mushafRange, setMushafRange] = useState(null);
    // Get today's date in YYYY-MM-DD format
    const today = useMemo(() => {
        if (currentDate)
            return currentDate;
        return new Date().toISOString().split('T')[0];
    }, [currentDate]);
    // Find today's schedule item (date may be string or AppDate)
    const todaySchedule = useMemo(() => {
        return dailySchedule.find((item) => getGregorianDate(item.date) === today);
    }, [dailySchedule, today]);
    // Get items to display
    const itemsToShow = useMemo(() => {
        if (showAll || compact)
            return dailySchedule;
        return dailySchedule.slice(0, maxItems);
    }, [dailySchedule, showAll, compact, maxItems]);
    if (!dailySchedule || dailySchedule.length === 0) {
        return (<div className="text-center py-8 text-gray-500">
                <p className="text-sm">{t('plan.noSchedule', 'No daily schedule available')}</p>
            </div>);
    }
    return (<div className="space-y-4">
            {/* Today's Schedule Highlight */}
            {todaySchedule && (<div className="bg-primary-50 border-2 border-primary-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <CalendarIcon width={18} height={18} className="text-primary-600"/>
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
                                {getDisplayDate(todaySchedule.date)}
                            </span>
                        </div>
                        <div className="text-sm text-gray-700">
                            <span className="font-medium">
                                {formatVerseRange(todaySchedule.from_verse_key, todaySchedule.to_verse_key)} 
                            </span>
                        </div>
                        {todaySchedule.from_text && (<div className="mt-2 p-2 bg-white rounded border border-primary-100">
                                <p className="text-xs text-gray-500 mb-1">{t('plan.startVerse', 'Start')}:</p>
                                <p className="text-sm text-gray-800 leading-relaxed" dir="rtl">
                                    {todaySchedule.from_text}
                                </p>
                            </div>)}
                        <div className="mt-3">
                            <button type="button" onClick={() => {
                setMushafRange({
                    from_verse_key: todaySchedule.from_verse_key,
                    to_verse_key: todaySchedule.to_verse_key
                });
            }} className="px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-100 rounded-lg hover:bg-primary-200 transition-colors">
                                {t('quran.viewInMushaf', 'View in Mushaf')}
                            </button>
                        </div>
                    </div>
                </div>)}

            {/* Schedule List */}
            <div className="space-y-2">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">
                        {t('plan.fullSchedule', 'Full Schedule')} ({dailySchedule.length} {t('plan.days', 'days')})
                    </h3>
                    {!compact && dailySchedule.length > maxItems && (<button type="button" onClick={() => setShowAll(!showAll)} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                            {showAll
                ? t('plan.showLess')
                : t('plan.showAll', { count: dailySchedule.length })}
                        </button>)}
                </div>

                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {itemsToShow.map((item) => {
            const isToday = getGregorianDate(item.date) === today;
            const isPast = new Date(getGregorianDate(item.date)) < new Date(today);
            return (<div key={item.day} className={`p-3 rounded-lg border transition-all ${isToday
                    ? 'bg-primary-50 border-primary-300 shadow-sm'
                    : isPast
                        ? 'bg-gray-50 border-gray-200'
                        : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${isToday
                    ? 'bg-primary-600 text-white'
                    : isPast
                        ? 'bg-gray-400 text-white'
                        : 'bg-gray-200 text-gray-700'}`}>
                                                {t('plan.day', 'Day')} {item.day}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {getDisplayDate(item.date)}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {item.day_name}
                                            </span>
                                            {isToday && (<span className="text-xs font-medium text-primary-600">
                                                    {t('plan.today', 'Today')}
                                                </span>)}
                                        </div>

                                        <div className="mt-2 space-y-1">
                                            <div className="flex items-center gap-2 text-sm">
                                                <BookOpenIcon width={14} height={14} className="text-gray-400"/>
                                                <span className="text-gray-700">
                                                    <span className="font-medium">
                                                        {formatVerseRange(item.from_verse_key, item.to_verse_key)}
                                                    </span>
                                                </span>
                                            </div>

                                            {!compact && item.from_text && (<div className="mt-2 p-2 bg-gray-50 rounded border border-gray-100">
                                                    <p className="text-xs text-gray-500 mb-1">
                                                        {t('plan.startVerse', 'Start')}: {item.from_text.substring(0, 50)}
                                                        {item.from_text.length > 50 ? '...' : ''}
                                                    </p>
                                                    {item.to_text && (<p className="text-xs text-gray-500">
                                                            {t('plan.endVerse', 'End')}: {item.to_text.substring(0, 50)}
                                                            {item.to_text.length > 50 ? '...' : ''}
                                                        </p>)}
                                                </div>)}
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <button type="button" onClick={() => {
                    setMushafRange({
                        from_verse_key: item.from_verse_key,
                        to_verse_key: item.to_verse_key
                    });
                }} className="px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-100 rounded-lg hover:bg-primary-200 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed" title={t('quran.viewInMushaf', 'View in Mushaf')}>
                                            {t('quran.viewInMushaf', 'View in Mushaf')}
                                        </button>
                                    </div>
                                </div>
                            </div>);
        })}
                </div>
            </div>
            
            {/* Mushaf Modal: open with daily range only (plan view) */}
            {mushafRange && (<MushafPageModal isOpen={!!mushafRange} onClose={() => setMushafRange(null)} startVerseKey={mushafRange.from_verse_key} endVerseKey={mushafRange.to_verse_key}/>)}
        </div>);
};
export default PlanDailySchedule;
