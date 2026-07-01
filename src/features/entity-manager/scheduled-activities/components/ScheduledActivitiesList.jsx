import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Pagination, Table } from '@/shared/components';
import { SearchIcon, SettingsIcon, XIcon } from '@/shared/icons';
import { formatTimePart, getDisplayDate } from '@/shared/utils/helpers/dateFormatter';
import { getErrorMessage } from '@/shared/utils';
import { useConfirmationModal } from '@/shared/hooks/useConfirmationModal';
import { useDeleteScheduledActivity, useScheduledActivities } from '../hooks/useScheduledActivities';
import { useScheduledActivitiesListState } from '../hooks/useScheduledActivitiesListState';

function getCount(value) {
    if (Array.isArray(value)) {
        return value.length;
    }

    if (typeof value === 'number') {
        return value;
    }

    return 0;
}

function getActivityName(row) {
    return row?.name ?? row?.title ?? '-';
}

function formatDateRange(row) {
    const from = getDisplayDate(row?.date_from ?? row?.start_date);
    const to = getDisplayDate(row?.date_to ?? row?.end_date);

    if (!from && !to) {
        return '-';
    }

    if (from === to) {
        return from;
    }

    return `${from} - ${to}`;
}

function formatTimeRange(row) {
    const timeFrom = formatTimePart(row?.time_from);
    const timeTo = formatTimePart(row?.time_to);
    return `${timeFrom} - ${timeTo}`;
}

const ScheduledActivitiesList = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { lang } = useParams();
    const { showConfirmation } = useConfirmationModal();
    const listState = useScheduledActivitiesListState();
    const { params, page, perPage, search, setPage, setSearch, resetFilters } = listState;
    const { list, meta, isLoading, error, refresh } = useScheduledActivities(params);
    const deleteScheduledActivityMutation = useDeleteScheduledActivity();
    const hasActiveFilters = !!search.trim();
    const [localSearch, setLocalSearch] = useState(search);

    useEffect(() => {
        setLocalSearch(search);
    }, [search]);

    useEffect(() => {
        const timer = setTimeout(() => setSearch(localSearch), 400);
        return () => clearTimeout(timer);
    }, [localSearch, setSearch]);

    const columns = useMemo(() => ([
        {
            header: t('scheduledActivities.table.name', 'Activity'),
            accessor: (row) => getActivityName(row),
            minWidth: 220,
            cellClassName: 'px-6 py-4 text-sm text-gray-900 text-start min-w-[220px] whitespace-normal break-words'
        },
        {
            header: t('scheduledActivities.table.dateRange', 'Date Range'),
            accessor: (row) => formatDateRange(row),
            minWidth: 220
        },
        {
            header: t('scheduledActivities.table.time', 'Time'),
            accessor: (row) => formatTimeRange(row),
            minWidth: 160
        },
        {
            header: t('scheduledActivities.table.responsible', 'Responsible'),
            accessor: (row) => t(`scheduledActivities.responsibleOptions.${row?.responsible === 'general_management' ? 'generalManagement' : row?.responsible}`, row?.responsible ?? '-'),
            minWidth: 150
        },
        {
            header: t('scheduledActivities.table.teachers', 'Teachers'),
            accessor: (row) => getCount(row?.teachers ?? row?.teacher_ids),
            minWidth: 100
        },
        {
            header: t('scheduledActivities.table.students', 'Students'),
            accessor: (row) => getCount(row?.students ?? row?.student_ids),
            minWidth: 100
        }
    ]), [t]);

    const total = meta?.total ?? list.length ?? 0;
    const totalPages = meta?.last_page ?? 1;
    const currentPage = meta?.current_page ?? page;

    const handleView = (row) => {
        if (!row?.id) {
            return;
        }

        navigate(`/${lang || 'ar'}/scheduled-activities/${row.id}`);
    };

    const handleEdit = (row) => {
        if (!row?.id) {
            return;
        }

        navigate(`/${lang || 'ar'}/scheduled-activities/${row.id}/edit`);
    };

    const handleDelete = (row) => {
        if (!row?.id) {
            return;
        }

        showConfirmation({
            title: t('scheduledActivities.deleteTitle', 'Delete Scheduled Activity'),
            message: t('scheduledActivities.deleteMessage', 'Are you sure you want to delete this scheduled activity?'),
            confirmText: t('common.delete', 'Delete'),
            cancelText: t('common.cancel', 'Cancel'),
            variant: 'danger',
            onConfirm: () => {
                deleteScheduledActivityMutation.mutate(row.id, {
                    onSuccess: () => {
                        toast.success(t('scheduledActivities.deleteSuccess', 'Scheduled activity deleted successfully.'));
                    },
                    onError: (requestError) => {
                        toast.error(getErrorMessage(requestError) || t('scheduledActivities.deleteError', 'Error deleting scheduled activity.'));
                    }
                });
            }
        });
    };

    if (error) {
        return (
            <div className="py-12 text-center text-red-600">
                {error?.message || t('scheduledActivities.loadError', 'Error loading scheduled activities. Please try again.')}
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
                                placeholder={t('scheduledActivities.searchPlaceholder', 'Search scheduled activities...')}
                                value={localSearch}
                                onChange={(event) => setLocalSearch(event.target.value)}
                                className="h-[48px] w-full rounded-lg border border-gray-300 bg-white ps-10 pe-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                            />
                        </div>
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
                    <h2 className="text-lg font-semibold text-gray-900">{t('scheduledActivities.listHeading', 'Scheduled Activities List')}</h2>
                    <Button type="button" variant="ghost" size="sm" onClick={() => refresh()} disabled={isLoading}>
                        {t('common.refresh', 'Refresh')}
                    </Button>
                </div>

                <div className="flex-1 min-h-0 overflow-auto">
                    <Table
                        columns={columns}
                        data={list}
                        loading={isLoading}
                        emptyMessage={t('scheduledActivities.noData', 'No scheduled activities found.')}
                        actionButtons={{
                            showView: true,
                            showEdit: true,
                            showDelete: true,
                            onView: handleView,
                            onEdit: handleEdit,
                            onDelete: handleDelete,
                            isDeleting: deleteScheduledActivityMutation.isPending
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

export default ScheduledActivitiesList;
