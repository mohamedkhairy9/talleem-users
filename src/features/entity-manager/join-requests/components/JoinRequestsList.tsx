import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, Pagination, Button } from '@/globals/components';
import { SearchIcon, SettingsIcon, XIcon } from '@/globals/icons';
import { useJoinRequests } from '../hooks/useJoinRequests';
import { useJoinRequestsListState } from '../hooks/useJoinRequestsListState';
import { createJoinRequestsColumns, getLocalizedText } from '../config/join-requests.config';
import ViewJoinRequestModal from './ViewJoinRequestModal';
import type { JoinRequestResponse } from '../types/join-requests.types';

const JoinRequestsList: React.FC = () => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'ar';

    const listState = useJoinRequestsListState();
    const { params, page, perPage, search, setPage, setSearch, resetFilters } = listState;

    const { list, meta, isLoading, error, refresh } = useJoinRequests(params);
    const total = meta?.total ?? 0;
    const totalPages = (meta as { last_page?: number } | undefined)?.last_page ?? 1;
    const currentPage = (meta as { current_page?: number } | undefined)?.current_page ?? page;
    const hasActiveFilters = !!search.trim();

    const [localSearch, setLocalSearch] = useState(search);
    useEffect(() => {
        setLocalSearch(search);
    }, [search]);
    useEffect(() => {
        const timer = setTimeout(() => setSearch(localSearch), 400);
        return () => clearTimeout(timer);
    }, [localSearch, setSearch]);

    const [selectedRequest, setSelectedRequest] = useState<JoinRequestResponse | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const getLocalizedTextForRow = useCallback(
        (obj: { en?: string; ar?: string } | string | null | undefined) => getLocalizedText(obj, currentLang),
        [currentLang]
    );

    const columns = useMemo(
        () => createJoinRequestsColumns({
            t: (key: string, fallback?: string) => t(key, fallback ?? key),
            getLocalizedText: getLocalizedTextForRow
        }),
        [t, getLocalizedTextForRow]
    );

    const handleView = (row: JoinRequestResponse) => {
        setSelectedRequest(row);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedRequest(null);
    };

    if (error) {
        return (
            <div className="text-center py-12 text-red-600">
                {(error as { message?: string })?.message || t('common.error')}
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Filters */}
            <div className="flex-shrink-0 rounded-xl border border-gray-200 bg-gray-50/80 p-4 shadow-sm mb-4">
                <div className="mb-3 flex items-center gap-2">
                    <SettingsIcon width={18} height={18} className="text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">{t('common.filters')}</span>
                    {hasActiveFilters && (
                        <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                            {t('common.active')}
                        </span>
                    )}
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
                                placeholder={t('joinRequests.searchPlaceholder')}
                                value={localSearch}
                                onChange={(e) => setLocalSearch(e.target.value)}
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

            {/* Table */}
            <div className="flex-1 flex flex-col min-h-0 rounded-lg bg-white border border-gray-200 overflow-hidden">
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-900">{t('joinRequests.title')}</h2>
                    <Button type="button" variant="ghost" size="sm" onClick={() => refresh()} disabled={isLoading}>
                        {t('common.refresh', 'Refresh')}
                    </Button>
                </div>
                <div className="flex-1 min-h-0 overflow-auto">
                    <Table
                        columns={columns}
                        data={list as JoinRequestResponse[]}
                        loading={isLoading}
                        emptyMessage={t('joinRequests.noData')}
                        actionButtons={{
                            showView: true,
                            showEdit: false,
                            showDelete: false,
                            onView: handleView
                        }}
                    />
                </div>
                {totalPages > 1 && (
                    <div className="flex-shrink-0 border-t border-gray-200 px-4 py-3">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            total={total}
                            onPageChange={setPage}
                            perPage={perPage}
                        />
                    </div>
                )}
            </div>

            <ViewJoinRequestModal isOpen={isModalOpen} request={selectedRequest} onClose={handleCloseModal} />
        </div>
    );
};

export default JoinRequestsList;
