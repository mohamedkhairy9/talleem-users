import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader, Button, Table, Pagination } from '@/globals/components';
import { PlusIcon, XIcon } from '@/globals/icons';
import type { TableColumn } from '@/globals/types';
import { useTeacherRequests, useRequestTypes, useCreateTeacherRequest } from '@/features/teacher/requests/hooks/useTeacherRequests';
import type { TeacherRequestItem } from '@/features/teacher/requests/types/teacher-requests.types';
import { getDisplayDate, getLocalizedText as getLocalizedTextHelper } from '@/utils';
import { useDateFormatStore } from '@/stores';
import { toast } from 'react-toastify';
import { getErrorMessage } from '@/utils/helpers/errorHandler';

const PER_PAGE = 15;

/**
 * Teacher Requests Page
 * List teacher requests and create new ones (dynamic form by request type)
 */
const TeacherRequestsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'ar';
    useDateFormatStore((s) => s.dateFormat);

    const [page, setPage] = useState(1);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [formRequestTypeId, setFormRequestTypeId] = useState<number | ''>('');
    const [formNationalId, setFormNationalId] = useState('');

    const params = useMemo(() => ({ page, per_page: PER_PAGE }), [page]);
    const { list, meta, isLoading, error } = useTeacherRequests(params);
    const { data: requestTypesData, isLoading: isLoadingTypes } = useRequestTypes();
    const createMutation = useCreateTeacherRequest();

    const requestTypes = requestTypesData?.data ?? [];
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
                accessor: (row) => getDisplayDate(row.created_at)
            }
        ],
        [t, currentLang]
    );

    const handleCreateSubmit = () => {
        if (formRequestTypeId === '' || !formNationalId.trim()) {
            toast.error(t('teacherRequests.fillRequired', 'Please select request type and enter national ID.'));
            return;
        }
        createMutation.mutate(
            {
                request_type_id: Number(formRequestTypeId),
                submitted_data: [{ national_id: formNationalId.trim() }]
            },
            {
                onSuccess: () => {
                    toast.success(t('teacherRequests.createSuccess', 'Request submitted successfully.'));
                    setCreateModalOpen(false);
                    setFormRequestTypeId('');
                    setFormNationalId('');
                },
                onError: (err) => {
                    toast.error(getErrorMessage(err));
                }
            }
        );
    };

    const handleCloseCreateModal = () => {
        if (!createMutation.isPending) {
            setCreateModalOpen(false);
            setFormRequestTypeId('');
            setFormNationalId('');
        }
    };

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

            {/* Create Request Modal */}
            {createModalOpen && (
                <div className="fixed inset-0 z-[60] overflow-y-auto">
                    <div
                        className="fixed inset-0 bg-black/50"
                        aria-hidden="true"
                        onClick={handleCloseCreateModal}
                    />
                    <div className="relative flex min-h-full items-center justify-center p-4 pt-20 md:pt-24">
                        <div className="relative w-full max-w-md rounded-lg bg-white shadow-xl z-10">
                            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {t('teacherRequests.createRequest', 'Create Request')}
                                </h3>
                                <button
                                    type="button"
                                    onClick={handleCloseCreateModal}
                                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                    aria-label={t('common.closeAria')}
                                >
                                    <XIcon width={20} height={20} />
                                </button>
                            </div>

                            <div className="px-6 py-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('teacherRequests.requestType', 'Request Type')} <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formRequestTypeId}
                                        onChange={(e) => setFormRequestTypeId(e.target.value === '' ? '' : Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        disabled={isLoadingTypes}
                                    >
                                        <option value="">{t('common.select', 'Select an option')}</option>
                                        {requestTypes.map((type) => (
                                            <option key={type.id} value={type.id}>
                                                {getLocalized(type.name)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('teacherRequests.nationalId', 'National ID')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formNationalId}
                                        onChange={(e) => setFormNationalId(e.target.value)}
                                        placeholder={t('teacherRequests.nationalIdPlaceholder', 'e.g. 298062515001')}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
                                <Button variant="outline" onClick={handleCloseCreateModal} disabled={createMutation.isPending}>
                                    {t('common.cancel')}
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleCreateSubmit}
                                    loading={createMutation.isPending}
                                    disabled={!formRequestTypeId || !formNationalId.trim()}
                                >
                                    {t('teacherRequests.submit', 'Submit')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherRequestsPage;
