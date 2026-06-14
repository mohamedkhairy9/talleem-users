import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmationModal, Pagination } from '@/shared/components';
import { SearchIcon, SettingsIcon, XIcon } from '@/shared/icons';
import ReactSelectComponent from '@/shared/components/ui/ReactSelect';
import {
    useDeleteWarning,
    useIncomingWarnings,
    useIssuedWarnings,
    useWarnings,
    useWarningsListState
} from '../hooks';
import { WarningsListMobile } from './WarningsListMobile';
import WarningViewEditModal from './WarningViewEditModal';
import { toast } from 'react-toastify';
import { WARNING_FILTER_TYPES, WARNING_STATUS_OPTIONS } from '../config';
import { useDateFormatStore } from '@/app/stores';

/**
 * Pagination and filters are synced with URL search params
 * (?page=2&search=foo&warning_type=student).
 */
const WarningsList = ({ scope = 'all' }) => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'ar';

    useDateFormatStore((s) => s.dateFormat);

    const listState = useWarningsListState();
    const {
        params,
        page,
        perPage,
        search,
        warningType,
        status,
        setPage,
        setSearch,
        setWarningType,
        setStatus,
        resetFilters
    } = listState;

    const isIncomingScope = scope === 'incoming';
    const isIssuedScope = scope === 'issued';

    const warningsQuery = useWarnings(params, {
        enabled: !isIncomingScope && !isIssuedScope
    });
    const incomingWarningsQuery = useIncomingWarnings(params, {
        enabled: isIncomingScope
    });
    const issuedWarningsQuery = useIssuedWarnings(params, {
        enabled: isIssuedScope
    });
    const deleteWarningMutation = useDeleteWarning();

    const [selectedWarningId, setSelectedWarningId] = useState(null);
    const [selectedWarning, setSelectedWarning] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('view');
    const [deleteWarningId, setDeleteWarningId] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [localSearch, setLocalSearch] = useState(search);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(
        Boolean(search.trim() || warningType || status !== '')
    );

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

    const isLoading = isIncomingScope
        ? incomingWarningsQuery.isLoading
        : isIssuedScope
            ? issuedWarningsQuery.isLoading
            : warningsQuery.isLoading;

    const error = isIncomingScope
        ? incomingWarningsQuery.error
        : isIssuedScope
            ? issuedWarningsQuery.error
            : warningsQuery.error;

    const hasActiveFilters = !!(search.trim() || warningType || status !== '');

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
        if (hasActiveFilters) {
            setShowAdvancedFilters(true);
        }
    }, [hasActiveFilters]);

    useEffect(() => {
        if ((isIncomingScope || isIssuedScope) && page > totalPages) {
            setPage(totalPages);
        }
    }, [isIncomingScope, isIssuedScope, page, setPage, totalPages]);

    const getLocalizedText = (obj) => {
        if (typeof obj === 'string') {
            return obj;
        }

        if (!obj) {
            return t('common.not_available', 'N/A');
        }

        if (currentLang === 'ar' && obj.ar) {
            return obj.ar;
        }

        if (obj.en) {
            return obj.en;
        }

        return t('common.not_available', 'N/A');
    };

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
        if (!deleteWarningId) {
            return;
        }

        deleteWarningMutation.mutate(deleteWarningId, {
            onSuccess: () => {
                toast.success(t('warning.deleteSuccess'));
                setIsDeleteModalOpen(false);
                setDeleteWarningId(null);
            },
            onError: (requestError) => {
                const errorMessage =
                    requestError?.response?.data?.message ||
                    requestError?.message ||
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

    const warningTypeOptions = useMemo(
        () => [
            { value: '', label: t('common.all', 'All') },
            ...WARNING_FILTER_TYPES.map((type) => ({
                value: type.value,
                label: t(type.labelKey, type.value)
            }))
        ],
        [t]
    );

    const statusOptions = useMemo(
        () => [
            { value: '', label: t('common.all', 'All') },
            ...WARNING_STATUS_OPTIONS.map((item) => ({
                value: String(item.value),
                label: t(item.labelKey, item.value ? 'Active' : 'Inactive')
            }))
        ],
        [t]
    );

    const emptyMessage = scope === 'incoming'
        ? t('warning.noIncomingWarnings', 'No incoming warnings found')
        : scope === 'issued'
            ? t('warning.noIssuedWarnings', 'No issued warnings found')
            : t('warning.noWarnings', 'No warnings found');

    return (
        <div className="flex flex-col gap-4">
            <section className="rounded-[22px] border border-[#e3ecec] bg-[#f7faf9] p-3 sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                        type="button"
                        onClick={() => setShowAdvancedFilters((current) => !current)}
                        className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition-colors sm:w-auto ${
                            showAdvancedFilters || hasActiveFilters
                                ? 'border-[#0d6a70] bg-[#0d6a70] text-white'
                                : 'border-[#d7e5e5] bg-white text-[#0d6a70] hover:bg-[#eef6f6]'
                        }`}
                    >
                        <SettingsIcon width={18} height={18} />
                        {t('common.filters', 'Filters')}
                    </button>

                    <div className="relative flex-1">
                        <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4 text-slate-300">
                            <SearchIcon width={18} height={18} />
                        </span>
                        <input
                            type="text"
                            placeholder={t('warning.searchPlaceholder', 'Search warnings...')}
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            className="h-12 w-full rounded-2xl border border-[#d7e5e5] bg-white ps-11 pe-4 text-sm text-slate-700 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-[#0d6a70] focus:ring-2 focus:ring-[#0d6a70]/10"
                        />
                    </div>
                </div>

                {showAdvancedFilters ? (
                    <div className="mt-3 grid gap-3 border-t border-[#e5eeee] pt-3 md:grid-cols-3">
                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                {t('warning.warningType', 'Warning Type')}
                            </label>
                            <ReactSelectComponent
                                value={warningType}
                                onChange={(value) => setWarningType(value != null ? String(value) : '')}
                                options={warningTypeOptions}
                                placeholder={t('common.all', 'All')}
                                className="[&_.react-select__control]:!min-h-[48px] [&_.react-select__control]:!rounded-2xl [&_.react-select__control]:!border-[#d7e5e5] [&_.react-select__control]:!shadow-sm"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                {t('warning.status', 'Status')}
                            </label>
                            <ReactSelectComponent
                                value={status === '' ? '' : String(status)}
                                onChange={(value) => {
                                    const normalizedValue = value != null ? String(value) : '';
                                    setStatus(normalizedValue === '' ? '' : normalizedValue === 'true');
                                }}
                                options={statusOptions}
                                placeholder={t('common.all', 'All')}
                                className="[&_.react-select__control]:!min-h-[48px] [&_.react-select__control]:!rounded-2xl [&_.react-select__control]:!border-[#d7e5e5] [&_.react-select__control]:!shadow-sm"
                            />
                        </div>

                        <div className="flex items-end">
                            <button
                                type="button"
                                onClick={resetFilters}
                                disabled={!hasActiveFilters}
                                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#d7e5e5] bg-white px-4 text-sm font-semibold text-slate-500 transition-colors hover:border-[#0d6a70] hover:text-[#0d6a70] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <XIcon width={16} height={16} />
                                {t('common.resetFilters', 'Reset filters')}
                            </button>
                        </div>
                    </div>
                ) : null}
            </section>

            {error ? (
                <div className="rounded-[22px] border border-red-100 bg-red-50/80 p-6 text-center text-sm font-medium text-red-600">
                    {t('warning.loadError', 'Error loading warnings. Please try again.')}
                </div>
            ) : (
                <div className="space-y-4">
                    <WarningsListMobile
                        list={list}
                        isLoading={isLoading}
                        hasError={false}
                        emptyMessage={emptyMessage}
                        getLocalizedText={getLocalizedText}
                        onView={handleView}
                        onDelete={canDelete ? handleDelete : undefined}
                        isDeleting={deleteWarningMutation.isPending}
                    />

                    {totalPages > 1 ? (
                        <div className="rounded-[22px] border border-[#e3ecec] bg-[#f7faf9] px-4 py-3">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                perPage={meta?.per_page ?? perPage}
                                total={total}
                                onPageChange={setPage}
                            />
                        </div>
                    ) : null}
                </div>
            )}

            <WarningViewEditModal
                isOpen={isModalOpen}
                warningId={selectedWarningId}
                warningData={selectedWarning}
                onClose={handleCloseModal}
                mode={modalMode}
            />

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                title={t('warning.deleteTitle')}
                message={t('warning.deleteMessage')}
                confirmText={t('common.delete')}
                cancelText={t('common.cancel')}
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => {
                    setIsDeleteModalOpen(false);
                    setDeleteWarningId(null);
                }}
                isLoading={deleteWarningMutation.isPending}
            />
        </div>
    );
};

export default WarningsList;
