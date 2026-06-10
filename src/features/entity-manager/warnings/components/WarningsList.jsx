import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, Pagination, ConfirmationModal } from '@/shared/components';
import { SearchIcon, SettingsIcon, XIcon } from '@/shared/icons';
import ReactSelectComponent from '@/shared/components/ui/ReactSelect';
import { useWarnings, useIncomingWarnings, useIssuedWarnings, useDeleteWarning, useWarningsListState } from '../hooks';
import { WarningsListMobile } from './WarningsListMobile';
import WarningViewEditModal from './WarningViewEditModal';
import { toast } from 'react-toastify';
import { createWarningsListColumns, WARNING_FILTER_TYPES, WARNING_STATUS_OPTIONS } from '../config';
import { useDateFormatStore } from '@/app/stores';
/**
 * Warnings List Component
 * Pagination and filters are synced with URL search params (?page=2&search=...&warning_type=...).
 */
const WarningsList = ({ scope = 'all' }) => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'ar';
    useDateFormatStore((s) => s.dateFormat); // re-render when date format changes
    const listState = useWarningsListState();
    const { params, page, perPage, search, warningType, status, setPage, setSearch, setWarningType, setStatus, resetFilters } = listState;
    const isIncomingScope = scope === 'incoming';
    const isIssuedScope = scope === 'issued';
    const warningsQuery = useWarnings(params, { enabled: !isIncomingScope && !isIssuedScope });
    const incomingWarningsQuery = useIncomingWarnings(params, { enabled: isIncomingScope });
    const issuedWarningsQuery = useIssuedWarnings(params, { enabled: isIssuedScope });
    const deleteWarningMutation = useDeleteWarning();
    // Modal and delete confirmation state
    const [selectedWarningId, setSelectedWarningId] = useState(null);
    const [selectedWarning, setSelectedWarning] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('view');
    const [deleteWarningId, setDeleteWarningId] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const incomingList = incomingWarningsQuery.list;
    const incomingMeta = incomingWarningsQuery.meta;
    const incomingHasServerPagination = !!incomingMeta;
    const issuedList = issuedWarningsQuery.list;
    const issuedMeta = issuedWarningsQuery.meta;
    const issuedHasServerPagination = !!issuedMeta;
    const total = isIncomingScope
        ? (incomingMeta?.total ?? incomingList.length)
        : isIssuedScope
            ? (issuedMeta?.total ?? issuedList.length)
            : (warningsQuery.meta?.total ?? 0);
    const totalPages = isIncomingScope
        ? (incomingMeta?.last_page ?? Math.max(1, Math.ceil(incomingList.length / perPage)))
        : isIssuedScope
            ? (issuedMeta?.last_page ?? Math.max(1, Math.ceil(issuedList.length / perPage)))
            : (warningsQuery.meta?.last_page ?? 1);
    const currentPage = isIncomingScope
        ? (incomingMeta?.current_page ?? Math.min(page, totalPages))
        : isIssuedScope
            ? (issuedMeta?.current_page ?? Math.min(page, totalPages))
            : (warningsQuery.meta?.current_page ?? page);
    const list = isIncomingScope
        ? (incomingHasServerPagination
            ? incomingList
            : incomingList.slice((currentPage - 1) * perPage, currentPage * perPage))
        : isIssuedScope
            ? (issuedHasServerPagination
                ? issuedList
                : issuedList.slice((currentPage - 1) * perPage, currentPage * perPage))
            : warningsQuery.list;
    const meta = isIncomingScope
        ? (incomingMeta ?? {
            total,
            last_page: totalPages,
            current_page: currentPage,
            per_page: perPage
        })
        : isIssuedScope
            ? (issuedMeta ?? {
                total,
                last_page: totalPages,
                current_page: currentPage,
                per_page: perPage
            })
            : warningsQuery.meta;
    const isLoading = isIncomingScope ? incomingWarningsQuery.isLoading : isIssuedScope ? issuedWarningsQuery.isLoading : warningsQuery.isLoading;
    const error = isIncomingScope ? incomingWarningsQuery.error : isIssuedScope ? issuedWarningsQuery.error : warningsQuery.error;
    const hasActiveFilters = !!(search.trim() || warningType || status !== '');
    const [localSearch, setLocalSearch] = useState(search);
    useEffect(() => {
        setLocalSearch(search);
    }, [search]);
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(localSearch);
        }, 400);
        return () => clearTimeout(timer);
    }, [localSearch, setSearch]);
    useEffect(() => {
        if ((isIncomingScope || isIssuedScope) && page > totalPages) {
            setPage(totalPages);
        }
    }, [isIncomingScope, isIssuedScope, page, setPage, totalPages]);
    const getLocalizedText = (obj) => {
        if (typeof obj === 'string')
            return obj;
        if (!obj)
            return t('common.not_available', 'N/A');
        if (currentLang === 'ar' && obj.ar)
            return obj.ar;
        if (obj.en)
            return obj.en;
        return t('common.not_available', 'N/A');
    };
    // Action handlers
    const handleView = (warning) => {
        setSelectedWarning(warning);
        setSelectedWarningId(warning.id);
        setModalMode('view');
        setIsModalOpen(true);
    };
    const handleDelete = (warning) => {
        setDeleteWarningId(warning.id);
        setIsDeleteModalOpen(true);
    };
    const confirmDelete = () => {
        if (!deleteWarningId)
            return;
        deleteWarningMutation.mutate(deleteWarningId, {
            onSuccess: () => {
                toast.success(t('warning.deleteSuccess'));
                setIsDeleteModalOpen(false);
                setDeleteWarningId(null);
            },
            onError: (error) => {
                const errorMessage = error?.response?.data?.message ||
                    error?.message ||
                    t('warning.deleteError');
                toast.error(errorMessage);
            }
        });
    };
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedWarningId(null);
        setSelectedWarning(null);
    };
    const canDelete = isIssuedScope;
    // Get static data from config
    const warningTypeOptions = useMemo(() => [
        { value: '', label: t('common.all', 'All') },
        ...WARNING_FILTER_TYPES.map(type => ({
            value: type.value,
            label: t(type.labelKey, type.value)
        }))
    ], [t]);
    const statusOptions = useMemo(() => [
        { value: '', label: t('common.all', 'All') },
        ...WARNING_STATUS_OPTIONS.map(status => ({
            value: String(status.value),
            label: t(status.labelKey, status.value ? 'Active' : 'Inactive')
        }))
    ], [t]);
    const columns = useMemo(() => createWarningsListColumns({ t, getLocalizedText }), [t, getLocalizedText]);
    const emptyMessage = scope === 'incoming'
        ? t('warning.noIncomingWarnings', 'No incoming warnings found')
        : scope === 'issued'
            ? t('warning.noIssuedWarnings', 'No issued warnings found')
            : t('warning.noWarnings', 'No warnings found');
    if (error) {
        return (<div className="text-center py-12 text-red-600">
                {t('warning.loadError', 'Error loading warnings. Please try again.')}
            </div>);
    }
    return (<div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Filters bar */}
            <div className="flex-shrink-0 rounded-xl border border-gray-200 bg-gray-50/80 p-4 shadow-sm mb-4">
                <div className="mb-3 flex items-center gap-2">
                    <SettingsIcon width={18} height={18} className="text-gray-500"/>
                    <span className="text-sm font-semibold text-gray-700">
                        {t('common.filters', 'Filters')}
                    </span>
                    {hasActiveFilters && (<span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                            {t('common.active', 'Active')}
                        </span>)}
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
                    {/* Search */}
                    <div className="sm:col-span-2 lg:col-span-1">
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            {t('common.search', 'Search')}
                        </label>
                        <div className="relative min-h-[48px]">
                            <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-gray-400">
                                <SearchIcon width={18} height={18}/>
                            </span>
                            <input type="text" placeholder={t('warning.searchPlaceholder', 'Search warnings...')} value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} className="h-[48px] w-full rounded-lg border border-gray-300 bg-white ps-10 pe-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"/>
                        </div>
                    </div>
                    {/* Warning Type */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            {t('warning.warningType', 'Warning Type')}
                        </label>
                        <ReactSelectComponent value={warningType} onChange={(v) => setWarningType(v !== null && v !== undefined ? String(v) : '')} options={warningTypeOptions} placeholder={t('common.all', 'All')} className="[&_.react-select__control]:min-h-[48px] [&_.react-select__control]:h-[48px]"/>
                    </div>
                    {/* Status */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            {t('warning.status', 'Status')}
                        </label>
                        <ReactSelectComponent value={status === '' ? '' : String(status)} onChange={(v) => {
            const val = v !== null && v !== undefined ? String(v) : '';
            setStatus(val === '' ? '' : val === 'true');
        }} options={statusOptions} placeholder={t('common.all', 'All')} className="[&_.react-select__control]:min-h-[48px] [&_.react-select__control]:h-[48px]"/>
                    </div>
                    {/* Reset */}
                    <div className="flex items-end sm:col-span-2 lg:col-span-1">
                        <button type="button" onClick={resetFilters} disabled={!hasActiveFilters} className="h-[48px] w-full inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white">
                            <XIcon width={16} height={16}/>
                            {t('common.resetFilters', 'Reset filters')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile: cards - min-h-[280px] keeps area visible on small screens */}
            <div className="flex flex-1 flex-col overflow-hidden md:hidden min-h-[280px] bg-white rounded-lg">
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
                    <WarningsListMobile list={list} isLoading={isLoading} hasError={!!error} errorMessage={error ? t('warning.loadError', 'Error loading warnings.') : undefined} emptyMessage={emptyMessage} getLocalizedText={getLocalizedText} onView={handleView} onDelete={canDelete ? handleDelete : undefined} isDeleting={deleteWarningMutation.isPending}/>
                </div>
                {totalPages > 1 && (<div className="flex-shrink-0 border-t border-gray-200 pt-3 px-4">
                        <Pagination currentPage={currentPage} totalPages={totalPages} perPage={meta?.per_page ?? perPage} total={total} onPageChange={setPage}/>
                    </div>)}
            </div>

            {/* Desktop: table with scroll */}
            <div className="hidden md:flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="flex-1 min-h-0 overflow-hidden">
                    <Table data={list} columns={columns} loading={isLoading} emptyMessage={emptyMessage} scrollable actionButtons={{
            showView: true,
            showEdit: false,
            showDelete: canDelete,
            onView: handleView,
            onDelete: handleDelete,
            isDeleting: deleteWarningMutation.isPending,
            getRowId: (row) => row.id
        }}/>
                </div>
                {totalPages > 1 && (<div className="flex-shrink-0 border-t border-gray-200 pt-3 px-4">
                        <Pagination currentPage={currentPage} totalPages={totalPages} perPage={meta?.per_page ?? perPage} total={total} onPageChange={setPage}/>
                    </div>)}
            </div>

            {/* View/Edit Modal */}
            <WarningViewEditModal isOpen={isModalOpen} warningId={selectedWarningId} warningData={selectedWarning} onClose={handleCloseModal} mode={modalMode}/>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal isOpen={isDeleteModalOpen} title={t('warning.deleteTitle')} message={t('warning.deleteMessage')} confirmText={t('common.delete')} cancelText={t('common.cancel')} variant="danger" onConfirm={confirmDelete} onCancel={() => {
            setIsDeleteModalOpen(false);
            setDeleteWarningId(null);
        }} isLoading={deleteWarningMutation.isPending}/>
        </div>);
};
export default WarningsList;
