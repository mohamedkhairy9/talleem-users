import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/app/stores';
import { Button, Pagination, Table } from '@/shared/components';
import { ClipboardCheckIcon, SearchIcon, SettingsIcon, XIcon } from '@/shared/icons';
import { formatTimePart, getDisplayDate, getGregorianDate, normalizeDate } from '@/shared/utils/helpers/dateFormatter';
import { getErrorMessage } from '@/shared/utils';
import { useDateFormatStore } from '@/app/stores/dateFormat.store';
import { useConfirmationModal } from '@/shared/hooks/useConfirmationModal';
import { useDeleteScheduledExam, useScheduledExams } from '../hooks/useScheduledExams';
import { useScheduledExamsListState } from '../hooks/useScheduledExamsListState';
import { getExamStartPermission } from '@/features/entity-manager/exam-conduction/utils/examStartPermissions';

function getCount(value) {
    if (Array.isArray(value)) {
        return value.length;
    }

    if (typeof value === 'number') {
        return value;
    }

    return 0;
}

function formatTimeRange(row) {
    const timeFrom = formatTimePart(row?.time_from);
    const timeTo = formatTimePart(row?.time_to);
    return `${timeFrom} - ${timeTo}`;
}

function getSegmentLabel(row) {
    return row?.exam_segment?.name?.ar ??
        row?.exam_segment?.name?.en ??
        row?.exam_segment?.name ??
        row?.exam_segment_id ??
        '-';
}

function matchesExamDate(value, selectedDate) {
    if (!selectedDate) {
        return true;
    }

    const normalizedSelectedDate = normalizeDate(selectedDate);
    const normalizedValue = normalizeDate(getGregorianDate(value));

    return normalizedValue === normalizedSelectedDate;
}

const ScheduledExamsList = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { lang } = useParams();
    const actingRole = useAuthStore((state) => state.actingRole ??
        state.user?.entity?.role ??
        state.user?.entity?.roles ??
        state.user?.roles ??
        null);
    useDateFormatStore((state) => state.dateFormat);
    const { showConfirmation } = useConfirmationModal();
    const listState = useScheduledExamsListState();
    const { params, page, perPage, search, examDate, setPage, setSearch, setExamDate, resetFilters } = listState;
    const { list, meta, isLoading, error, refresh } = useScheduledExams(params);
    const deleteScheduledExamMutation = useDeleteScheduledExam();
    const hasActiveFilters = !!(search.trim() || examDate);
    const [localSearch, setLocalSearch] = useState(search);

    const filteredList = useMemo(() => {
        if (!examDate) {
            return list;
        }

        return list.filter((row) => matchesExamDate(row?.exam_date, examDate));
    }, [list, examDate]);

    const hasClientSideDateFallback = Boolean(examDate) &&
        list.some((row) => !matchesExamDate(row?.exam_date, examDate));

    const total = hasClientSideDateFallback ? filteredList.length : (meta?.total ?? list.length ?? 0);
    const totalPages = hasClientSideDateFallback ? 1 : (meta?.last_page ?? 1);
    const currentPage = hasClientSideDateFallback ? 1 : (meta?.current_page ?? page);

    useEffect(() => {
        setLocalSearch(search);
    }, [search]);

    useEffect(() => {
        const timer = setTimeout(() => setSearch(localSearch), 400);
        return () => clearTimeout(timer);
    }, [localSearch, setSearch]);

    const columns = useMemo(() => ([
        {
            header: t('scheduledExams.table.segment', 'Segment'),
            accessor: (row) => getSegmentLabel(row),
            minWidth: 140
        },
        {
            header: t('scheduledExams.table.date', 'Date'),
            accessor: (row) => getDisplayDate(row?.exam_date),
            minWidth: 130
        },
        {
            header: t('scheduledExams.table.time', 'Time'),
            accessor: (row) => formatTimeRange(row),
            minWidth: 150
        },
        {
            header: t('scheduledExams.table.responsible', 'Responsible'),
            accessor: (row) => t(`scheduledExams.responsibleOptions.${row?.responsible === 'general_management' ? 'generalManagement' : row?.responsible}`, row?.responsible ?? '-'),
            minWidth: 150
        },
        {
            header: t('scheduledExams.table.method', 'Method'),
            accessor: (row) => t(`scheduledExams.methodOptions.${row?.method === 'in_person' ? 'inPerson' : row?.method}`, row?.method ?? '-'),
            minWidth: 130
        },
        {
            header: t('scheduledExams.table.location', 'Location'),
            accessor: (row) => row?.location || '-',
            cellClassName: 'px-6 py-4 text-sm text-gray-900 text-start min-w-[220px] whitespace-normal break-words'
        },
        {
            header: t('scheduledExams.table.teachers', 'Teachers'),
            accessor: (row) => getCount(row?.teachers ?? row?.teacher_ids),
            minWidth: 100
        },
        {
            header: t('scheduledExams.table.students', 'Students'),
            accessor: (row) => getCount(row?.students),
            minWidth: 100
        }
    ]), [t]);

    const handleView = (row) => {
        if (!row?.id) {
            return;
        }

        navigate(`/${lang || 'ar'}/scheduled-exams/${row.id}`);
    };

    const handleEdit = (row) => {
        if (!row?.id) {
            return;
        }

        navigate(`/${lang || 'ar'}/scheduled-exams/${row.id}/edit`);
    };

    const handleStartExam = (row) => {
        if (!row?.id) {
            return;
        }

        const startPermission = getExamStartPermission(row?.responsible, actingRole);
        const responsibilityLabel = t(
            `scheduledExams.responsibleOptions.${row?.responsible === 'general_management' ? 'generalManagement' : row?.responsible}`,
            row?.responsible ?? '-'
        );

        if (!startPermission.canStart) {
            toast.error(t(
                'examConduction.validation.startNotAllowedForResponsible',
                'Only the responsible side assigned to this exam can start it. This exam belongs to {{responsible}}.',
                { responsible: responsibilityLabel }
            ));
            return;
        }

        navigate(`/${lang || 'ar'}/exam-conduction/${row.id}`);
    };

    const handleDelete = (row) => {
        if (!row?.id) {
            return;
        }

        showConfirmation({
            title: t('scheduledExams.deleteTitle', 'Delete Scheduled Exam'),
            message: t('scheduledExams.deleteMessage', 'Are you sure you want to delete this scheduled exam?'),
            confirmText: t('common.delete', 'Delete'),
            cancelText: t('common.cancel', 'Cancel'),
            variant: 'danger',
            onConfirm: () => {
                deleteScheduledExamMutation.mutate(row.id, {
                    onSuccess: () => {
                        toast.success(t('scheduledExams.deleteSuccess', 'Scheduled exam deleted successfully.'));
                    },
                    onError: (requestError) => {
                        toast.error(getErrorMessage(requestError) || t('scheduledExams.deleteError', 'Error deleting scheduled exam.'));
                    }
                });
            }
        });
    };

    if (error) {
        return (
            <div className="py-12 text-center text-red-600">
                {error?.message || t('scheduledExams.loadError', 'Error loading scheduled exams. Please try again.')}
            </div>
        );
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="mb-4 flex-shrink-0 rounded-xl border border-gray-200 bg-gray-50/80 p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                    <SettingsIcon width={18} height={18} className="text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">{t('common.filters')}</span>
                    {hasActiveFilters ? (
                        <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                            {t('common.active')}
                        </span>
                    ) : null}
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
                                placeholder={t('scheduledExams.searchPlaceholder', 'Search scheduled exams...')}
                                value={localSearch}
                                onChange={(event) => setLocalSearch(event.target.value)}
                                className="h-[48px] w-full rounded-lg border border-gray-300 bg-white ps-10 pe-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            {t('scheduledExams.filterDate', 'Exam Date')}
                        </label>
                        <input
                            type="date"
                            value={examDate}
                            onChange={(event) => setExamDate(event.target.value)}
                            className="h-[48px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        />
                    </div>

                    <div className="flex items-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={resetFilters}
                            disabled={!hasActiveFilters}
                            className="inline-flex items-center gap-2"
                        >
                            <XIcon width={16} height={16} />
                            {t('common.resetFilters')}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
                    <h2 className="text-lg font-semibold text-gray-900">{t('scheduledExams.listHeading', 'Scheduled Exams List')}</h2>
                    <Button type="button" variant="ghost" size="sm" onClick={() => refresh()} disabled={isLoading}>
                        {t('common.refresh', 'Refresh')}
                    </Button>
                </div>

                <div className="flex-1 min-h-0 overflow-auto">
                    <Table
                        columns={columns}
                        data={filteredList}
                        loading={isLoading}
                        emptyMessage={t('scheduledExams.noData', 'No scheduled exams found.')}
                        actionButtons={{
                            showView: true,
                            showEdit: true,
                            showDelete: true,
                            customActions: [
                                {
                                    key: 'start-exam',
                                    label: t('examConduction.startExam', 'Start Exam'),
                                    title: t('examConduction.goToExam', 'Go to exam details'),
                                    icon: ClipboardCheckIcon,
                                    disabled: (row) => !getExamStartPermission(row?.responsible, actingRole).canStart,
                                    onClick: handleStartExam
                                }
                            ],
                            onView: handleView,
                            onEdit: handleEdit,
                            onDelete: handleDelete,
                            isDeleting: deleteScheduledExamMutation.isPending
                        }}
                    />
                </div>

                {totalPages > 1 ? (
                    <div className="flex-shrink-0 border-t border-gray-200 px-4 py-3">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            total={total}
                            onPageChange={setPage}
                            perPage={perPage}
                        />
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default ScheduledExamsList;
