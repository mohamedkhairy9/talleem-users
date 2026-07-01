import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Table } from '@/shared/components';
import { ClipboardCheckIcon, SearchIcon, SettingsIcon, XIcon } from '@/shared/icons';
import { useDateFormatStore } from '@/app/stores/dateFormat.store';
import { formatTimePart, getDisplayDate } from '@/shared/utils/helpers/dateFormatter';
import { getLocalizedText } from '@/shared/utils/helpers/getLocalizedText';
import { useTodayConductExams } from '../hooks/useExamConduction';

function getTimeRange(exam) {
    return `${formatTimePart(exam?.time_from)} - ${formatTimePart(exam?.time_to)}`;
}

function getSegmentLabel(exam, currentLang, t) {
    return getLocalizedText(exam?.exam_segment?.name, currentLang, t('common.not_available', 'N/A'));
}

function getEntityLabel(exam, currentLang, t) {
    return getLocalizedText(exam?.entity?.name, currentLang, t('common.not_available', 'N/A'));
}

function getStudentsCount(exam) {
    return Array.isArray(exam?.students) ? exam.students.length : 0;
}

function matchesSearch(exam, query, currentLang, t) {
    if (!query) {
        return true;
    }

    const normalized = query.trim().toLowerCase();
    const haystack = [
        getSegmentLabel(exam, currentLang, t),
        getEntityLabel(exam, currentLang, t),
        exam?.location,
        ...(Array.isArray(exam?.students) ? exam.students.map((student) => student?.name) : [])
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    return haystack.includes(normalized);
}

const ExamConductionList = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { lang } = useParams();
    const currentLang = i18n.language || lang || 'ar';
    useDateFormatStore((state) => state.dateFormat);
    const { list, isLoading, error, refresh } = useTodayConductExams();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
        return () => clearTimeout(timer);
    }, [search]);

    const filteredList = useMemo(() => {
        return list.filter((exam) => matchesSearch(exam, debouncedSearch, currentLang, t));
    }, [list, debouncedSearch, currentLang, t]);

    const columns = useMemo(() => ([
        {
            header: t('examConduction.table.entity', 'Entity'),
            accessor: (row) => getEntityLabel(row, currentLang, t),
            minWidth: 180
        },
        {
            header: t('examConduction.table.segment', 'Segment'),
            accessor: (row) => getSegmentLabel(row, currentLang, t),
            minWidth: 160
        },
        {
            header: t('examConduction.table.date', 'Date'),
            accessor: (row) => getDisplayDate(row?.exam_date),
            minWidth: 130
        },
        {
            header: t('examConduction.table.time', 'Time'),
            accessor: (row) => getTimeRange(row),
            minWidth: 150
        },
        {
            header: t('examConduction.table.method', 'Method'),
            accessor: (row) => t(`scheduledExams.methodOptions.${row?.method === 'in_person' ? 'inPerson' : 'remote'}`, row?.method ?? '-'),
            minWidth: 120
        },
        {
            header: t('examConduction.table.location', 'Location'),
            accessor: (row) => row?.location || '-',
            minWidth: 220,
            cellClassName: 'px-6 py-4 text-sm text-gray-900 text-start min-w-[220px] whitespace-normal break-words'
        },
        {
            header: t('examConduction.table.students', 'Students'),
            accessor: (row) => getStudentsCount(row),
            minWidth: 100
        },
        {
            header: t('examConduction.table.availability', 'Availability'),
            accessor: (row) => row?.available
                ? t('examConduction.available', 'Available')
                : t('examConduction.unavailable', 'Unavailable'),
            minWidth: 120
        }
    ]), [currentLang, t]);

    const handleView = (row) => {
        if (!row?.id) {
            return;
        }

        navigate(`/${lang || 'ar'}/exam-conduction/${row.id}`);
    };

    if (error) {
        return (
            <div className="py-12 text-center text-red-600">
                {error?.message || t('examConduction.loadError', 'Error loading exam conduction list. Please try again.')}
            </div>
        );
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="mb-4 flex-shrink-0 rounded-xl border border-gray-200 bg-gray-50/80 p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                    <SettingsIcon width={18} height={18} className="text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">{t('common.filters')}</span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">{t('common.search')}</label>
                        <div className="relative min-h-[48px]">
                            <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-gray-400">
                                <SearchIcon width={18} height={18} />
                            </span>
                            <input
                                type="text"
                                placeholder={t('examConduction.searchPlaceholder', 'Search today exams...')}
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                className="h-[48px] w-full rounded-lg border border-gray-300 bg-white ps-10 pe-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                            />
                        </div>
                    </div>

                    <div className="flex items-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setSearch('')}>
                            <XIcon width={16} height={16} className="me-1" />
                            {t('common.resetFilters')}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {t('examConduction.listHeading', 'Today Exams')}
                    </h2>
                    <Button type="button" variant="ghost" size="sm" onClick={() => refresh()} disabled={isLoading}>
                        {t('common.refresh', 'Refresh')}
                    </Button>
                </div>

                <div className="flex-1 min-h-0 overflow-auto">
                    <Table
                        columns={columns}
                        data={filteredList}
                        loading={isLoading}
                        emptyMessage={t('examConduction.noData', 'No exams available for conduction today.')}
                        actionButtons={{
                            showView: true,
                            onView: handleView,
                            customActions: [
                                {
                                    key: 'conduct',
                                    label: t('examConduction.conduct', 'Conduct'),
                                    title: t('examConduction.goToExam', 'Go to exam details'),
                                    icon: ClipboardCheckIcon,
                                    onClick: handleView
                                }
                            ]
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default ExamConductionList;
