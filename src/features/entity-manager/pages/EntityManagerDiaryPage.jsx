import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarIcon, ChevronDownIcon, ChevronRightIcon } from '@/shared/icons';
import { getDisplayDate, getGregorianDate } from '@/shared/utils';
import EntityManagerDiaryList from '@/features/entity-manager/calendar/components/EntityManagerDiaryList';
import { useEntityManagerCalendarMonth } from '@/features/entity-manager/calendar/hooks/useCalendar';

const DAY_NAMES_AR = ['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'];
const DAY_NAMES_EN = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const UPCOMING_FILTERS = ['all', 'halaqas', 'entity_exams', 'management_exams'];

const getTodayDate = () => new Date();

const toIsoDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const parseIsoDate = (isoDate) => {
    if (!isoDate) {
        return getTodayDate();
    }

    const [year, month, day] = isoDate.split('-').map(Number);
    return new Date(year, (month || 1) - 1, day || 1);
};

const getWeekStart = (date) => {
    const weekStart = new Date(date);
    const day = date.getDay();
    const normalizedOffset = (day + 1) % 7;
    weekStart.setDate(date.getDate() - normalizedOffset);
    return weekStart;
};

const getWeekDates = (date) => {
    const start = getWeekStart(date);
    return Array.from({ length: 7 }, (_, index) => {
        const current = new Date(start);
        current.setDate(start.getDate() + index);
        return current;
    });
};

const isSameDay = (a, b) => (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
);

const formatMonthTitle = (date, locale) => new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
    month: 'long',
    year: 'numeric'
}).format(date);

const getItemTitle = (item, currentLang, t) => {
    const candidate = item?.title ?? item?.name ?? item?.halaqa?.title ?? item?.halaqa?.name ?? item?.halaqa_title;
    if (candidate && typeof candidate === 'object') {
        return candidate[currentLang] ?? candidate.ar ?? candidate.en ?? t('entityDiary.entryTitle', 'Diary entry');
    }

    return candidate || t('entityDiary.entryTitle', 'Diary entry');
};

const classifyUpcomingItem = (item, currentLang, t) => {
    const title = String(getItemTitle(item, currentLang, t)).toLowerCase();

    if (title.includes('إدارة') || title.includes('management')) {
        return 'management_exams';
    }

    if (title.includes('اختبار') || title.includes('exam')) {
        return 'entity_exams';
    }

    return 'halaqas';
};

const sortItems = (items) => {
    return [...items].sort((a, b) => {
        const dateA = getGregorianDate(a?.date || a?.session_date || a?.start_date || '') || '';
        const dateB = getGregorianDate(b?.date || b?.session_date || b?.start_date || '') || '';
        if (dateA !== dateB) {
            return dateA.localeCompare(dateB);
        }

        const timeA = String(a?.session_time || a?.time || a?.start_time || '');
        const timeB = String(b?.session_time || b?.time || b?.start_time || '');
        return timeA.localeCompare(timeB);
    });
};

const EntityManagerDiaryPage = () => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'ar';
    const dayNames = currentLang === 'ar' ? DAY_NAMES_AR : DAY_NAMES_EN;

    const today = useMemo(() => getTodayDate(), []);
    const todayIso = useMemo(() => toIsoDate(today), [today]);

    const [selectedDate, setSelectedDate] = useState(todayIso);
    const [hasExplicitSelection, setHasExplicitSelection] = useState(false);
    const [activeUpcomingFilter, setActiveUpcomingFilter] = useState('all');

    const selectedDateObject = useMemo(() => parseIsoDate(selectedDate), [selectedDate]);
    const selectedWeekDates = useMemo(() => getWeekDates(selectedDateObject), [selectedDateObject]);
    const selectedWeekIsoDates = useMemo(() => selectedWeekDates.map((date) => toIsoDate(date)), [selectedWeekDates]);
    const selectedRequestDate = selectedDate === todayIso && !hasExplicitSelection ? undefined : selectedDate;

    const { itemsByDate, isFetching: isWeekFetching, error: weekError } = useEntityManagerCalendarMonth(selectedWeekIsoDates);

    const selectedDayItems = sortItems(itemsByDate[selectedDate] ?? itemsByDate[todayIso] ?? []);
    const upcomingItems = useMemo(() => {
        const combined = selectedWeekIsoDates
            .filter((date) => date >= selectedDate)
            .flatMap((date) => itemsByDate[date] ?? []);

        const filtered = activeUpcomingFilter === 'all'
            ? combined
            : combined.filter((item) => classifyUpcomingItem(item, currentLang, t) === activeUpcomingFilter);

        return sortItems(filtered);
    }, [selectedWeekIsoDates, selectedDate, itemsByDate, activeUpcomingFilter, currentLang, t]);

    const handleSelectDate = (date) => {
        setSelectedDate(toIsoDate(date));
        setHasExplicitSelection(true);
    };

    const handleToday = () => {
        setSelectedDate(todayIso);
        setHasExplicitSelection(false);
    };

    const handleWeekChange = (offsetDays) => {
        const nextDate = new Date(selectedDateObject);
        nextDate.setDate(nextDate.getDate() + offsetDays);
        setSelectedDate(toIsoDate(nextDate));
        setHasExplicitSelection(true);
    };

    return (
        <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-6 px-2 pb-8">
            <section className="rounded-[32px] bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                    <button
                        type="button"
                        className="flex h-11 w-11 items-center justify-center rounded-2xl text-[#0B5A5E] transition-colors hover:bg-slate-50"
                        aria-label={t('common.filter', 'Filter')}
                    >
                        <ChevronDownIcon width={24} height={24} />
                    </button>

                    <div className="text-3xl font-bold tracking-tight text-[#0B5A5E]">
                        {formatMonthTitle(selectedDateObject, currentLang)}
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-7 gap-2 text-center">
                    {dayNames.map((dayName) => (
                        <div key={dayName} className="text-lg font-medium text-slate-500">
                            {dayName}
                        </div>
                    ))}
                </div>

                <div className="mt-4 grid grid-cols-7 gap-2">
                    {selectedWeekDates.map((date) => {
                        const isoDate = toIsoDate(date);
                        const isSelected = isSameDay(date, selectedDateObject);
                        const dayItems = itemsByDate[isoDate] ?? [];

                        return (
                            <button
                                key={isoDate}
                                type="button"
                                onClick={() => handleSelectDate(date)}
                                className="flex flex-col items-center gap-3 rounded-2xl px-2 py-3 transition-colors hover:bg-slate-50"
                            >
                                <div
                                    className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold transition-colors ${isSelected
                                        ? 'bg-[#0B5A5E] text-white'
                                        : 'text-slate-800'}`}
                                >
                                    {date.getDate()}
                                </div>

                                <div className="min-h-[24px] w-full">
                                    {dayItems.length > 0 ? (
                                        <div className="mx-auto flex max-w-[72px] items-center justify-center rounded-xl bg-[#E4F2F1] px-2 py-1 text-xs font-semibold text-[#0B5A5E]">
                                            {t('entityDiary.compactCount', '{{count}}', { count: dayItems.length })}
                                        </div>
                                    ) : isWeekFetching ? (
                                        <div className="mx-auto h-2.5 w-10 rounded-full bg-slate-200" />
                                    ) : (
                                        <div className="mx-auto h-2.5 w-10 rounded-full bg-slate-200/80" />
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => handleWeekChange(-7)}
                            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50"
                            aria-label={t('entityDiary.previousWeek', 'Previous week')}
                        >
                            <ChevronRightIcon width={18} height={18} className={currentLang === 'ar' ? '' : 'rotate-180'} />
                        </button>
                        <button
                            type="button"
                            onClick={() => handleWeekChange(7)}
                            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50"
                            aria-label={t('entityDiary.nextWeek', 'Next week')}
                        >
                            <ChevronRightIcon width={18} height={18} className={currentLang === 'ar' ? 'rotate-180' : ''} />
                        </button>
                        <button
                            type="button"
                            onClick={handleToday}
                            className="rounded-2xl border border-slate-200 px-5 py-3 text-base font-semibold text-slate-800 transition-colors hover:bg-slate-50"
                        >
                            {t('entityDiary.today', 'Today')}
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                            {t('entityDiary.jumpToDate', 'Jump to date')}
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => {
                                const nextDate = parseIsoDate(e.target.value);
                                handleSelectDate(nextDate);
                            }}
                            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-base outline-none transition-colors focus:border-[#0B5A5E] focus:ring-2 focus:ring-[#0B5A5E]/10"
                        />
                    </div>
                </div>
            </section>

            <section className="rounded-[32px] bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-4xl font-bold tracking-tight text-[#0B5A5E]">
                        {t('entityDiary.todayEvents', 'Today events')}
                    </div>
                    <div className="rounded-2xl bg-[#E8F1F1] px-5 py-3 text-xl font-semibold text-slate-700">
                        {getDisplayDate(selectedDate)}
                    </div>
                </div>

                <div className="mt-5">
                    <EntityManagerDiaryList
                        date={selectedRequestDate}
                        items={selectedDayItems}
                        isLoading={isWeekFetching && selectedDayItems.length === 0}
                        error={weekError}
                        compact
                        emptyMessage={t('entityDiary.noTodayEvents', 'No events for this day.')}
                    />
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-4xl font-bold tracking-tight text-slate-900">
                            {t('entityDiary.upcomingTitle', 'Upcoming events')}
                        </h2>
                        <p className="mt-2 text-2xl text-slate-400">
                            {t('entityDiary.upcomingSubtitle', 'All your upcoming appointments sorted by time')}
                        </p>
                    </div>
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E4F2F1] text-[#0B5A5E]">
                        <CalendarIcon width={28} height={28} />
                    </div>
                </div>

                <div className="rounded-[28px] bg-white p-3 shadow-sm ring-1 ring-slate-100">
                    <div className="flex flex-wrap gap-3">
                        {UPCOMING_FILTERS.map((filterKey) => {
                            const isActive = activeUpcomingFilter === filterKey;
                            return (
                                <button
                                    key={filterKey}
                                    type="button"
                                    onClick={() => setActiveUpcomingFilter(filterKey)}
                                    className={`rounded-2xl px-6 py-4 text-xl font-semibold transition-colors ${isActive
                                        ? 'bg-[#0B5A5E] text-white'
                                        : 'text-slate-500 hover:bg-slate-50'}`}
                                >
                                    {t(`entityDiary.filters.${filterKey}`)}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <EntityManagerDiaryList
                    items={upcomingItems}
                    isLoading={isWeekFetching && upcomingItems.length === 0}
                    error={weekError}
                    emptyMessage={t('entityDiary.noUpcomingEvents', 'No upcoming events in this week.')}
                />
            </section>
        </div>
    );
};

export default EntityManagerDiaryPage;
