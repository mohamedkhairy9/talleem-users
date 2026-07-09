import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { CalendarIcon, ChevronDownIcon, ChevronRightIcon } from '@/shared/icons';
import { getDisplayDate, getGregorianDate } from '@/shared/utils';
import EntityManagerDiaryList from '@/features/entity-manager/calendar/components/EntityManagerDiaryList';
import { getEntityManagerCalendarPayload, useEntityManagerCalendarMonth } from '@/features/entity-manager/calendar/hooks/useCalendar';

const DAY_NAMES_AR = ['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'];
const DAY_NAMES_EN = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const DIARY_FILTERS = ['all', 'recitations', 'exams', 'activities'];
const UPCOMING_GROUPS_LIMIT = 3;
const UPCOMING_SEARCH_MAX_DAYS = 730;

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

const addDaysToIsoDate = (isoDate, daysToAdd) => {
    const nextDate = parseIsoDate(isoDate);
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    return toIsoDate(nextDate);
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

const getGroupDate = (group, fallbackDate = null) => (
    group?.date ||
    group?.calendar_date ||
    group?.selected_date ||
    group?.start_date ||
    fallbackDate
);

const getGroupItems = (group) => {
    if (!group || typeof group !== 'object') {
        return [];
    }

    if (Array.isArray(group.items)) {
        return group.items;
    }

    const nestedArrays = Object.entries(group)
        .filter(([key, value]) => key !== 'items' && Array.isArray(value))
        .map(([, value]) => value)
        .filter((value) => value.some((item) => item && typeof item === 'object'));

    if (nestedArrays.length === 0) {
        return [];
    }

    if (nestedArrays.length === 1) {
        return nestedArrays[0];
    }

    return nestedArrays.flat();
};

const getGroupCount = (group) => {
    if (typeof group?.items_count === 'number') {
        return group.items_count;
    }

    return getGroupItems(group).length;
};

const getFilterGroupsFromPayload = (payload, filterKey) => {
    if (!payload || typeof payload !== 'object') {
        return [];
    }

    if (filterKey === 'all') {
        return Array.isArray(payload.home_items) ? payload.home_items : [];
    }

    if (filterKey === 'recitations') {
        return Array.isArray(payload.halaqas) ? payload.halaqas : [];
    }

    if (filterKey === 'exams') {
        return [
            ...(Array.isArray(payload.entity_exams) ? payload.entity_exams : []),
            ...(Array.isArray(payload.admin_exams) ? payload.admin_exams : [])
        ];
    }

    if (filterKey === 'activities') {
        return Array.isArray(payload.activities) ? payload.activities : [];
    }

    return [];
};

const flattenGroupsItems = (groups, fallbackDate = null) => (
    groups.flatMap((group) => getGroupItems(group).map((item) => ({
        ...item,
        date: item?.date || item?.calendar_date || getGroupDate(group, fallbackDate)
    })))
);

const sortItems = (items) => {
    return [...items].sort((a, b) => {
        const dateA = getGregorianDate(a?.date || a?.session_date || a?.start_date || a?.calendar_date || '') || '';
        const dateB = getGregorianDate(b?.date || b?.session_date || b?.start_date || b?.calendar_date || '') || '';

        if (dateA !== dateB) {
            return dateA.localeCompare(dateB);
        }

        const timeA = String(a?.session_time || a?.time || a?.start_time || a?.time_from || '');
        const timeB = String(b?.session_time || b?.time || b?.start_time || b?.time_from || '');
        return timeA.localeCompare(timeB);
    });
};

const groupItemsByDate = (items, prefix) => {
    const groupedMap = items.reduce((accumulator, item, index) => {
        const itemDate = getGregorianDate(item?.date || item?.session_date || item?.start_date || item?.calendar_date || '') || '';
        if (!itemDate) {
            return accumulator;
        }

        if (!accumulator.has(itemDate)) {
            accumulator.set(itemDate, {
                key: `${prefix}-${itemDate}`,
                date: itemDate,
                count: 0,
                items: []
            });
        }

        const entry = accumulator.get(itemDate);
        entry.items.push({
            ...item,
            __groupIndex: index
        });
        entry.count += 1;
        return accumulator;
    }, new Map());

    return [...groupedMap.values()].sort((a, b) => a.date.localeCompare(b.date));
};

const isRateLimitError = (error) => {
    return Number(error?.status) === 429 ||
        String(error?.message || '').toLowerCase().includes('too many attempts');
};

const GroupedDiarySection = ({
    groups,
    expandedGroups,
    onToggleGroup,
    emptyMessage,
    isLoading,
    error,
    t
}) => {
    if (isLoading && groups.length === 0) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />
                    <p className="text-sm text-gray-600">{t('common.loading', 'Loading...')}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
                {error?.message || t('entityDiary.loadError', 'Error loading diary data. Please try again.')}
            </div>
        );
    }

    if (groups.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-500">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {groups.map((entry) => {
                const isExpanded = Boolean(expandedGroups[entry.key]);
                const groupItems = sortItems(entry.items);

                return (
                    <section key={entry.key} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                        <button
                            type="button"
                            onClick={() => onToggleGroup(entry.key)}
                            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start transition-colors hover:bg-slate-50 sm:px-6"
                        >
                            <div className="min-w-0">
                                <div className="text-lg font-semibold text-slate-900">
                                    {getDisplayDate(entry.date)}
                                </div>
                                <div className="mt-1 text-sm text-slate-500">
                                    {t('entityDiary.entriesCount', '{{count}} items', { count: entry.count })}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-[#E8F1F1] px-3 py-2 text-sm font-semibold text-[#0B5A5E]">
                                    {entry.count}
                                </div>
                                <ChevronDownIcon
                                    width={20}
                                    height={20}
                                    className={`text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                />
                            </div>
                        </button>

                        {isExpanded ? (
                            <div className="border-t border-slate-200 px-4 py-4 sm:px-6">
                                <EntityManagerDiaryList
                                    items={groupItems}
                                    emptyMessage={emptyMessage}
                                    showItemDate={false}
                                />
                            </div>
                        ) : null}
                    </section>
                );
            })}
        </div>
    );
};

const EntityManagerDiaryPage = () => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'ar';
    const dayNames = currentLang === 'ar' ? DAY_NAMES_AR : DAY_NAMES_EN;

    const today = useMemo(() => getTodayDate(), []);
    const todayIso = useMemo(() => toIsoDate(today), [today]);

    const [selectedDate, setSelectedDate] = useState(todayIso);
    const [activeDiaryFilter, setActiveDiaryFilter] = useState('all');
    const [expandedGroups, setExpandedGroups] = useState({});

    const selectedDateObject = useMemo(() => parseIsoDate(selectedDate), [selectedDate]);
    const selectedWeekDates = useMemo(() => getWeekDates(selectedDateObject), [selectedDateObject]);
    const selectedWeekIsoDates = useMemo(() => selectedWeekDates.map((date) => toIsoDate(date)), [selectedWeekDates]);
    const { payloadByDate, isFetching: isWeekFetching, error: weekError } = useEntityManagerCalendarMonth(selectedWeekIsoDates);

    const selectedPayload = useMemo(
        () => payloadByDate[selectedDate] ?? payloadByDate[todayIso] ?? {},
        [payloadByDate, selectedDate, todayIso]
    );

    const selectedDayItems = useMemo(() => {
        const groups = getFilterGroupsFromPayload(selectedPayload, activeDiaryFilter);
        return sortItems(flattenGroupsItems(groups, selectedDate));
    }, [activeDiaryFilter, selectedDate, selectedPayload]);
    const selectedDayGroups = useMemo(
        () => groupItemsByDate(selectedDayItems, `selected-${activeDiaryFilter}`),
        [activeDiaryFilter, selectedDayItems]
    );
    const upcomingQuery = useQuery({
        queryKey: ['entity-manager-calendar', 'nearest-upcoming', selectedDate, activeDiaryFilter, UPCOMING_GROUPS_LIMIT],
        queryFn: async () => {
            const collectedEntries = [];
            const seenDates = new Set();

            selectedWeekIsoDates
                .filter((date) => date >= selectedDate)
                .forEach((date) => {
                    const payload = payloadByDate[date] ?? {};
                    const groups = getFilterGroupsFromPayload(payload, activeDiaryFilter);
                    const items = sortItems(flattenGroupsItems(groups, date));
                    const count = groups.reduce((total, group) => total + getGroupCount(group), 0);

                    if ((items.length > 0 || count > 0) && !seenDates.has(date) && collectedEntries.length < UPCOMING_GROUPS_LIMIT) {
                        collectedEntries.push({
                            key: `upcoming-${activeDiaryFilter}-${date}`,
                            date,
                            count: count || items.length,
                            items
                        });
                        seenDates.add(date);
                    }
                });

            const searchStartOffset = selectedWeekIsoDates.length;

            for (
                let offset = searchStartOffset;
                offset <= UPCOMING_SEARCH_MAX_DAYS && collectedEntries.length < UPCOMING_GROUPS_LIMIT;
                offset += 1
            ) {
                const date = addDaysToIsoDate(selectedDate, offset);

                if (seenDates.has(date)) {
                    continue;
                }

                try {
                    const payload = await getEntityManagerCalendarPayload(date);
                    const groups = getFilterGroupsFromPayload(payload, activeDiaryFilter);
                    const items = sortItems(flattenGroupsItems(groups, date));
                    const count = groups.reduce((total, group) => total + getGroupCount(group), 0);

                    if (items.length === 0 && count === 0) {
                        continue;
                    }

                    collectedEntries.push({
                        key: `upcoming-${activeDiaryFilter}-${date}`,
                        date,
                        count: count || items.length,
                        items
                    });
                    seenDates.add(date);
                } catch (error) {
                    if (isRateLimitError(error)) {
                        break;
                    }

                    throw error;
                }
            }

            return collectedEntries.slice(0, UPCOMING_GROUPS_LIMIT);
        },
        staleTime: 2 * 60 * 1000,
        retry: false
    });

    const dayCountsByDate = useMemo(() => {
        return selectedWeekIsoDates.reduce((acc, date) => {
            const payload = payloadByDate[date] ?? {};
            const groups = getFilterGroupsFromPayload(payload, activeDiaryFilter);
            acc[date] = groups.reduce((total, group) => total + getGroupCount(group), 0);
            return acc;
        }, {});
    }, [activeDiaryFilter, payloadByDate, selectedWeekIsoDates]);

    const handleSelectDate = (date) => {
        setSelectedDate(toIsoDate(date));
    };

    const handleToday = () => {
        setSelectedDate(todayIso);
    };

    const handleWeekChange = (offsetDays) => {
        const nextDate = new Date(selectedDateObject);
        nextDate.setDate(nextDate.getDate() + offsetDays);
        setSelectedDate(toIsoDate(nextDate));
    };

    const handleToggleGroup = (groupKey) => {
        setExpandedGroups((previous) => ({
            ...previous,
            [groupKey]: !previous[groupKey]
        }));
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
                        const itemsCount = dayCountsByDate[isoDate] ?? 0;

                        return (
                            <button
                                key={isoDate}
                                type="button"
                                onClick={() => handleSelectDate(date)}
                                className="flex flex-col items-center gap-3 rounded-2xl px-2 py-3 transition-colors hover:bg-slate-50"
                            >
                                <div
                                    className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold transition-colors ${
                                        isSelected ? 'bg-[#0B5A5E] text-white' : 'text-slate-800'
                                    }`}
                                >
                                    {date.getDate()}
                                </div>

                                <div className="min-h-[24px] w-full">
                                    {itemsCount > 0 ? (
                                        <div className="mx-auto flex max-w-[72px] items-center justify-center rounded-xl bg-[#E4F2F1] px-2 py-1 text-xs font-semibold text-[#0B5A5E]">
                                            {t('entityDiary.compactCount', '{{count}}', { count: itemsCount })}
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
                            onChange={(event) => {
                                const nextDate = parseIsoDate(event.target.value);
                                handleSelectDate(nextDate);
                            }}
                            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-base outline-none transition-colors focus:border-[#0B5A5E] focus:ring-2 focus:ring-[#0B5A5E]/10"
                        />
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <div className="rounded-[28px] bg-white p-3 shadow-sm ring-1 ring-slate-100">
                    <div className="flex flex-wrap gap-3">
                        {DIARY_FILTERS.map((filterKey) => {
                            const isActive = activeDiaryFilter === filterKey;

                            return (
                                <button
                                    key={filterKey}
                                    type="button"
                                    onClick={() => setActiveDiaryFilter(filterKey)}
                                    className={`rounded-2xl px-6 py-4 text-xl font-semibold transition-colors ${
                                        isActive ? 'bg-[#0B5A5E] text-white' : 'text-slate-500 hover:bg-slate-50'
                                    }`}
                                >
                                    {t(`entityDiary.filters.${filterKey}`)}
                                </button>
                            );
                        })}
                    </div>
                </div>

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
                        <GroupedDiarySection
                            groups={selectedDayGroups}
                            expandedGroups={expandedGroups}
                            onToggleGroup={handleToggleGroup}
                            emptyMessage={t('entityDiary.noTodayEvents', 'No events for this day.')}
                            isLoading={isWeekFetching && selectedDayItems.length === 0}
                            error={weekError}
                            t={t}
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

                    <GroupedDiarySection
                        groups={upcomingQuery.data ?? []}
                        expandedGroups={expandedGroups}
                        onToggleGroup={handleToggleGroup}
                        emptyMessage={t('entityDiary.noUpcomingEvents', 'No upcoming events in this week.')}
                        isLoading={upcomingQuery.isLoading || upcomingQuery.isFetching}
                        error={upcomingQuery.error}
                        t={t}
                    />
                </section>
            </section>
        </div>
    );
};

export default EntityManagerDiaryPage;
