import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader, Button, Table, Pagination, DateCell } from '@/globals/components';
import { PlusIcon, EyeIcon } from '@/globals/icons';
import type { TableColumn } from '@/globals/types';
import { useTeacherRequests } from '@/features/teacher/requests/hooks/useTeacherRequests';
import CreateRequestModal from '@/features/teacher/requests/components/CreateRequestModal';
import RequestDetailModal from '@/features/teacher/requests/components/RequestDetailModal';
import type { TeacherRequestItem } from '@/features/teacher/requests/types/teacher-requests.types';
import { getLocalizedText as getLocalizedTextHelper } from '@/utils';
import { useDateFormatStore } from '@/stores';

const PER_PAGE = 15;

/**
 * Teacher Requests Page
 * List teacher requests and create new ones via modal (RHF + Yup, request types from /teacher-requests/request-types)
 */
const TeacherRequestsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'ar';
    useDateFormatStore((s) => s.dateFormat);

    const [page, setPage] = useState(1);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [detailRequestId, setDetailRequestId] = useState<number | null>(null);

    const params = useMemo(() => ({ page, per_page: PER_PAGE }), [page]);
    const { list, meta, isLoading, error } = useTeacherRequests(params);

    const total = meta?.total ?? 0;
    const totalPages = meta?.last_page ?? 1;
    const currentPage = meta?.current_page ?? page;

    const getLocalized = (obj: Parameters<typeof getLocalizedTextHelper>[0]) =>
        getLocalizedTextHelper(obj, currentLang, t('common.not_available', 'N/A'));

    const columns: TableColumn<TeacherRequestItem>[] = useMemo(
        () => [
            {
                header: t('teacherRequests.requestType', 'Request Type'),
                accessor: (row) => getLocalized(row.request_type?.name)
            },
            {
                header: t('teacherRequests.status', 'Status'),
                accessor: (row) => (
                    <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            row.status_text === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}
                    >
                        {row.status_text}
                    </span>
                )
            },
            {
                header: t('teacherRequests.currentPhase', 'Current Phase'),
                accessor: (row) => getLocalized(row.current_phase?.name)
            },
            {
                header: t('teacherRequests.currentStep', 'Current Step'),
                accessor: (row) => getLocalized(row.current_step?.name)
            },
            {
                header: t('teacherRequests.createdAt', 'Created At'),
                cellClassName: 'whitespace-normal align-top',
                accessor: (row) => <DateCell value={row.created_at} />
            },
            {
                header: t('teacherRequests.actions', 'Actions'),
                accessor: (row) => (
                    <button
                        type="button"
                        onClick={() => setDetailRequestId(row.id)}
                        className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
                        aria-label={t('teacherRequests.viewDetails', 'View details')}
                    >
                        <EyeIcon width={18} height={18} />
                        {t('teacherRequests.viewDetails', 'View')}
                    </button>
                )
            }
        ],
        [t, currentLang]
    );

    if (error) {
        return (
            <div className="flex min-h-full flex-col space-y-6">
                <PageHeader
                    title={t('teacherRequests.title', 'My Requests')}
                    subtitle={t('teacherRequests.subtitle', 'View and submit teacher requests')}
                />
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                    {t('teacherRequests.loadError', 'Error loading requests. Please try again.')}
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-full flex-col space-y-6">
            <PageHeader
                title={t('teacherRequests.title', 'My Requests')}
                subtitle={t('teacherRequests.subtitle', 'View and submit teacher requests')}
            />

            <div className="flex flex-col flex-1 min-h-0 overflow-hidden rounded-lg bg-white shadow-sm border border-gray-200">
                <div className="flex-shrink-0 flex items-center justify-between gap-4 p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {t('teacherRequests.listTitle', 'Requests')}
                    </h2>
                    <Button
                        type="button"
                        variant="primary"
                        onClick={() => setCreateModalOpen(true)}
                        className="flex items-center gap-2"
                    >
                        <PlusIcon width={18} height={18} />
                        {t('teacherRequests.createRequest', 'Create Request')}
                    </Button>
                </div>

                <div className="flex-1 min-h-0 overflow-hidden">
                    <Table
                        data={list}
                        columns={columns}
                        loading={isLoading}
                        emptyMessage={t('teacherRequests.noRequests', 'No requests yet.')}
                        scrollable
                    />
                </div>

                {totalPages > 1 && (
                    <div className="flex-shrink-0 border-t border-gray-200 pt-3 px-4 pb-4">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            perPage={meta?.per_page ?? PER_PAGE}
                            total={total}
                            onPageChange={setPage}
                        />
                    </div>
                )}
            </div>

            <CreateRequestModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSuccess={() => setCreateModalOpen(false)}
            />

            <RequestDetailModal
                isOpen={detailRequestId != null}
                requestId={detailRequestId}
                onClose={() => setDetailRequestId(null)}
            />
        </div>
    );
};

export default TeacherRequestsPage;
