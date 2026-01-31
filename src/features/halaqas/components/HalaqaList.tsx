import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Table, Pagination } from '@/globals/components';
import { TableColumn } from '@/globals/types';
import {
    EyeIcon,
    EditIcon,
    TrashIcon,
    SearchIcon,
    SettingsIcon,
    XIcon
} from '@/globals/icons';
import ReactSelectComponent from '@/globals/components/ui/ReactSelect';
import { useHalaqas, useDeleteHalaqa } from '../hooks/useHalaqas';
import { useHalaqasListState } from '../hooks/useHalaqasListState';
import type { HalaqaListItem, BilingualName } from '../types/list.types';
import { HALAQA_PERIODS, HALAQA_TEACHING_METHODS } from '@/config/halaqa.config';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Halaqa List Component
 * Pagination and filters are synced with URL search params (?page=2&search=...&period=...).
 */
const HalaqaList: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { lang } = useParams<{ lang: string }>();
    const queryClient = useQueryClient();
    const currentLang = i18n.language || lang || 'en';

    const listState = useHalaqasListState();
    const { params, page, perPage, search, period, teachingMethod, setPage, setSearch, setPeriod, setTeachingMethod, resetFilters } = listState;

    const { list, meta, isLoading, error } = useHalaqas(params);
    const deleteMutation = useDeleteHalaqa();

    // Pagination from API meta (current_page, per_page, total, last_page)
    const total = meta?.total ?? 0;
    const totalPages = meta?.last_page ?? 1;
    const currentPage = meta?.current_page ?? page;
    const hasActiveFilters = !!(search.trim() || period || teachingMethod);

    const [localSearch, setLocalSearch] = useState(search);
    useEffect(() => {
        setLocalSearch(search);
    }, [search]);
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(localSearch);
        }, 400);
        return () => clearTimeout(timer);
    }, [localSearch]);

    const periodOptions = [
        { value: '' as const, label: t('common.all', 'All') },
        ...HALAQA_PERIODS.map((p) => ({ value: p.value, label: t(p.labelKey, p.value) }))
    ];
    const teachingMethodOptions = [
        { value: '' as const, label: t('common.all', 'All') },
        ...HALAQA_TEACHING_METHODS.map((m) => ({ value: m.value, label: t(m.labelKey, m.value) }))
    ];

    const getLocalizedText = (obj: BilingualName | string | null | undefined): string => {
        if (typeof obj === 'string') return obj;
        if (!obj) return t('common.not_available', 'N/A');
        if (currentLang === 'ar' && obj.ar) return obj.ar;
        if (obj.en) return obj.en;
        return t('common.not_available', 'N/A');
    };

    const formatActivities = (activities: string[] | undefined): string => {
        if (!activities?.length) return '-';
        return activities.map((a) => t(`halaqa.activity.${a}`, a)).join(', ');
    };

    const handleView = (id: number) => {
        navigate(`/${lang || currentLang}/halaqas/${id}`);
    };

    const handleEdit = (id: number) => {
        navigate(`/${lang || currentLang}/halaqas/${id}/edit`);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm(t('halaqa.deleteConfirm', 'Are you sure you want to delete this halaqa?'))) {
            deleteMutation.mutate(id, {
                onSuccess: () => {
                    toast.success(t('halaqa.deleteSuccess', 'Halaqa deleted successfully'));
                    queryClient.invalidateQueries({ queryKey: ['halaqas'] });
                },
                onError: (error: any) => {
                    toast.error(error?.message || t('halaqa.deleteError', 'Error deleting halaqa'));
                }
            });
        }
    };

    const columns: TableColumn<HalaqaListItem>[] = [
        {
            header: t('halaqa.name', 'Name'),
            accessor: (row) => getLocalizedText(row.name)
        },
        {
            header: t('halaqa.teacher', 'Teacher'),
            accessor: (row) => getLocalizedText(row.teacher?.name)
        },
        {
            header: t('halaqa.period', 'Period'),
            accessor: (row) => (row.period ? t(`halaqa.period.${row.period}`, row.period) : '-')
        },
        {
            header: t('halaqa.startDate', 'Start Date'),
            accessor: (row) => (row.start_date ? new Date(row.start_date).toLocaleDateString() : '-')
        },
        {
            header: t('halaqa.endDate', 'End Date'),
            accessor: (row) => (row.end_date ? new Date(row.end_date).toLocaleDateString() : '-')
        },
        {
            header: t('halaqa.sessionTime', 'Session Time'),
            accessor: (row) => row.session_time || '-'
        },
        {
            header: t('halaqa.activities', 'Activities'),
            accessor: (row) => formatActivities(row.activities)
        },
        {
            header: t('halaqa.platform', 'Platform'),
            accessor: (row) => getLocalizedText(row.platform?.name)
        },
        {
            header: t('halaqa.teachingMethod', 'Teaching Method'),
            accessor: (row) => {
                if (!row.teaching_method) return '-';
                const keyMap: Record<string, string> = {
                    in_person: 'inPerson',
                    remote: 'remote',
                    hybrid: 'hybrid'
                };
                const labelKey = keyMap[row.teaching_method] ?? row.teaching_method;
                return t(`halaqa.teachingMethod.${labelKey}`, row.teaching_method);
            }
        },
        {
            header: t('halaqa.students', 'Students'),
            accessor: (row) =>
                row.current_students_count ?? row.students?.length ?? row.max_students ?? '-'
        },
        {
            header: t('common.actions', 'Actions'),
            cell: (row) => (
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => handleView(row.id)}
                        className="p-2 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                        aria-label={t('common.view', 'View')}
                        title={t('common.view', 'View')}
                    >
                        <EyeIcon width={18} height={18} />
                    </button>
                    <button
                        type="button"
                        onClick={() => handleEdit(row.id)}
                        className="p-2 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                        aria-label={t('common.edit', 'Edit')}
                        title={t('common.edit', 'Edit')}
                    >
                        <EditIcon width={18} height={18} />
                    </button>
                    <button
                        type="button"
                        onClick={() => handleDelete(row.id)}
                        disabled={deleteMutation.isPending}
                        className="p-2 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={t('common.delete', 'Delete')}
                        title={t('common.delete', 'Delete')}
                    >
                        <TrashIcon width={18} height={18} />
                    </button>
                </div>
            )
        }
    ];

    if (error) {
        return (
            <div className="text-center py-12 text-red-600">
                {t('halaqa.loadError', 'Error loading halaqas. Please try again.')}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filters bar */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                    <SettingsIcon width={18} height={18} className="text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">
                        {t('common.filters', 'Filters')}
                    </span>
                    {hasActiveFilters && (
                        <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                            {t('common.active', 'Active')}
                        </span>
                    )}
                </div>
                {/* Shared filter control: min-h-[48px], bg-white, border-gray-300, rounded-lg */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
                    {/* Search (debounced 400ms) */}
                    <div className="sm:col-span-2 lg:col-span-1">
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            {t('common.search', 'Search')}
                        </label>
                        <div className="relative min-h-[48px]">
                            <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-gray-400">
                                <SearchIcon width={18} height={18} />
                            </span>
                            <input
                                type="text"
                                placeholder={t('common.searchPlaceholder', 'Search halaqas...')}
                                value={localSearch}
                                onChange={(e) => setLocalSearch(e.target.value)}
                                className="h-[48px] w-full rounded-lg border border-gray-300 bg-white ps-10 pe-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                            />
                        </div>
                    </div>
                    {/* Period */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            {t('halaqa.period', 'Period')}
                        </label>
                        <ReactSelectComponent
                            value={period}
                            onChange={(v) => setPeriod(v !== null && v !== undefined ? String(v) : '')}
                            options={periodOptions}
                            placeholder={t('common.all', 'All')}
                            className="[&_.react-select__control]:min-h-[48px] [&_.react-select__control]:h-[48px]"
                        />
                    </div>
                    {/* Teaching method */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            {t('halaqa.teachingMethod', 'Teaching Method')}
                        </label>
                        <ReactSelectComponent
                            value={teachingMethod}
                            onChange={(v) =>
                                setTeachingMethod(v !== null && v !== undefined ? String(v) : '')
                            }
                            options={teachingMethodOptions}
                            placeholder={t('common.all', 'All')}
                            className="[&_.react-select__control]:min-h-[48px] [&_.react-select__control]:h-[48px]"
                        />
                    </div>
                    {/* Reset */}
                    <div className="flex items-end sm:col-span-2 lg:col-span-1">
                        <button
                            type="button"
                            onClick={resetFilters}
                            disabled={!hasActiveFilters}
                            className="h-[48px] w-full inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
                        >
                            <XIcon width={16} height={16} />
                            {t('common.resetFilters', 'Reset filters')}
                        </button>
                    </div>
                </div>
            </div>

            <Table
                columns={columns}
                data={list}
                loading={isLoading}
                emptyMessage={t('halaqa.noHalaqas', 'No halaqas found')}
            />

            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    perPage={meta?.per_page ?? perPage}
                    total={total}
                    onPageChange={setPage}
                />
            )}
        </div>
    );
};

export default HalaqaList;

