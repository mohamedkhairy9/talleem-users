import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, Pagination } from '@/globals/components';
import { SearchIcon, SettingsIcon, XIcon } from '@/globals/icons';
import ReactSelectComponent from '@/globals/components/ui/ReactSelect';
import { useWarnings } from '../hooks/useWarnings';
import { WarningsListMobile } from './WarningsListMobile';
import type { WarningResponse } from '../services/warnings.service';
import { formatDate } from '@/utils';

/**
 * Warnings List Component
 */
const WarningsList: React.FC = () => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'en';
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [warningType, setWarningType] = useState<'student' | 'teacher' | 'entity' | ''>('');
    const [status, setStatus] = useState<boolean | ''>('');

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

    const params = {
        page,
        per_page: 10,
        ...(search.trim() && { search: search.trim() }),
        ...(warningType && { warning_type: warningType }),
        ...(status !== '' && { status })
    };

    const { list, meta, isLoading, error } = useWarnings(params);

    const total = meta?.total ?? 0;
    const totalPages = meta?.last_page ?? 1;
    const currentPage = meta?.current_page ?? page;
    const hasActiveFilters = !!(search.trim() || warningType || status !== '');

    const getLocalizedText = (obj: { en?: string; ar?: string } | string | null | undefined): string => {
        if (typeof obj === 'string') return obj;
        if (!obj) return t('common.not_available', 'N/A');
        if (currentLang === 'ar' && obj.ar) return obj.ar;
        if (obj.en) return obj.en;
        return t('common.not_available', 'N/A');
    };

    const warningTypeOptions = [
        { value: '', label: t('common.all', 'All') },
        { value: 'student', label: t('warning.type.student', 'Student') },
        { value: 'teacher', label: t('warning.type.teacher', 'Teacher') },
        { value: 'entity', label: t('warning.type.entity', 'Entity') }
    ];

    const statusOptions = [
        { value: '', label: t('common.all', 'All') },
        { value: 'true', label: t('common.active', 'Active') },
        { value: 'false', label: t('common.inactive', 'Inactive') }
    ];

    const columns = [
        {
            header: t('warning.date', 'Date'),
            accessor: (row: WarningResponse) => formatDate(row.date)
        },
        {
            header: t('warning.branch', 'Branch'),
            accessor: (row: WarningResponse) => getLocalizedText(row.branch?.name)
        },
        {
            header: t('warning.program', 'Program'),
            accessor: (row: WarningResponse) => getLocalizedText(row.program?.name)
        },
        {
            header: t('warning.warningType', 'Warning Type'),
            accessor: (row: WarningResponse) => t(`warning.type.${row.warning_type}`, row.warning_type)
        },
        {
            header: t('warning.target', 'Target'),
            accessor: (row: WarningResponse) => {
                if (row.warning_type === 'student' && row.student) {
                    return getLocalizedText(row.student.name);
                }
                if (row.warning_type === 'teacher' && row.teacher) {
                    return getLocalizedText(row.teacher.name);
                }
                if (row.warning_type === 'entity' && row.entity) {
                    return getLocalizedText(row.entity.name);
                }
                return '-';
            }
        },
        {
            header: t('warning.warningReason', 'Warning Reason'),
            accessor: (row: WarningResponse) => getLocalizedText(row.warning_reason?.name)
        },
        {
            header: t('warning.note', 'Note'),
            accessor: (row: WarningResponse) => row.note || '-'
        },
        {
            header: t('warning.status', 'Status'),
            accessor: (row: WarningResponse) => (
                <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        row.status
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                    }`}
                >
                    {row.status ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                </span>
            )
        }
    ];

    const resetFilters = () => {
        setSearch('');
        setLocalSearch('');
        setWarningType('');
        setStatus('');
        setPage(1);
    };

    if (error) {
        return (
            <div className="text-center py-12 text-red-600">
                {t('warning.loadError', 'Error loading warnings. Please try again.')}
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Filters bar */}
            <div className="flex-shrink-0 rounded-xl border border-gray-200 bg-gray-50/80 p-4 shadow-sm mb-4">
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
                    {/* Search */}
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
                                placeholder={t('warning.searchPlaceholder', 'Search warnings...')}
                                value={localSearch}
                                onChange={(e) => setLocalSearch(e.target.value)}
                                className="h-[48px] w-full rounded-lg border border-gray-300 bg-white ps-10 pe-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                            />
                        </div>
                    </div>
                    {/* Warning Type */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            {t('warning.warningType', 'Warning Type')}
                        </label>
                        <ReactSelectComponent
                            value={warningType}
                            onChange={(v) => setWarningType(v !== null && v !== undefined ? String(v) : '')}
                            options={warningTypeOptions}
                            placeholder={t('common.all', 'All')}
                            className="[&_.react-select__control]:min-h-[48px] [&_.react-select__control]:h-[48px]"
                        />
                    </div>
                    {/* Status */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            {t('warning.status', 'Status')}
                        </label>
                        <ReactSelectComponent
                            value={status === '' ? '' : String(status)}
                            onChange={(v) => {
                                const val = v !== null && v !== undefined ? String(v) : '';
                                setStatus(val === '' ? '' : val === 'true');
                            }}
                            options={statusOptions}
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

            {/* Mobile: cards - min-h-[280px] keeps area visible on small screens */}
            <div className="flex flex-1 flex-col overflow-hidden md:hidden min-h-[280px] bg-white rounded-lg">
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
                    <WarningsListMobile
                        list={list}
                        isLoading={isLoading}
                        hasError={!!error}
                        errorMessage={error ? t('warning.loadError', 'Error loading warnings.') : undefined}
                        emptyMessage={t('warning.noWarnings', 'No warnings found')}
                        getLocalizedText={getLocalizedText}
                    />
                </div>
                {totalPages > 1 && (
                    <div className="flex-shrink-0 pt-3">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            perPage={meta?.per_page ?? 10}
                            total={total}
                            onPageChange={setPage}
                        />
                    </div>
                )}
            </div>

            {/* Desktop: table with scroll */}
            <div className="hidden md:flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="flex-1 min-h-0 overflow-hidden">
                    <Table
                        data={list}
                        columns={columns}
                        isLoading={isLoading}
                        emptyMessage={t('warning.noWarnings', 'No warnings found')}
                        scrollable
                    />
                </div>
                {totalPages > 1 && (
                    <div className="flex-shrink-0 pt-3">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            perPage={meta?.per_page ?? 10}
                            total={total}
                            onPageChange={setPage}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default WarningsList;

