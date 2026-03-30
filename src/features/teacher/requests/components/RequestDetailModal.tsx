import React from 'react';
import { useTranslation } from 'react-i18next';
import { XIcon } from '@/globals/icons';
import { useTeacherRequestDetail } from '../hooks/useTeacherRequests';
import type { TeacherRequestDetail } from '../types/teacher-requests.types';
import { getDisplayDate, getLocalizedText as getLocalizedTextHelper } from '@/utils';
import { useDateFormatStore } from '@/stores';

interface RequestDetailModalProps {
    isOpen: boolean;
    requestId: number | null;
    onClose: () => void;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex flex-wrap gap-2 py-2 border-b border-gray-100 last:border-0">
            <dt className="text-sm font-medium text-gray-500 min-w-[120px]">{label}</dt>
            <dd className="text-sm text-gray-900 flex-1">{value ?? '—'}</dd>
        </div>
    );
}

const RequestDetailModal: React.FC<RequestDetailModalProps> = ({ isOpen, requestId, onClose }) => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'ar';
    useDateFormatStore((s) => s.dateFormat);

    const { data, isLoading, error } = useTeacherRequestDetail(isOpen && requestId ? requestId : null);
    const detail: TeacherRequestDetail | null = data?.data ?? null;

    const getLocalized = (obj: Parameters<typeof getLocalizedTextHelper>[0]) =>
        getLocalizedTextHelper(obj, currentLang, t('common.not_available', 'N/A'));

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
            <div className="fixed inset-0 bg-black/50" aria-hidden="true" onClick={onClose} />
            <div className="relative flex min-h-full items-center justify-center p-4 pt-20 md:pt-24">
                <div className="relative w-full max-w-lg rounded-lg bg-white shadow-xl z-10">
                    <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {t('teacherRequests.requestDetails', 'Request Details')}
                        </h3>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            aria-label={t('common.closeAria')}
                        >
                            <XIcon width={20} height={20} />
                        </button>
                    </div>

                    <div className="px-6 py-4">
                        {isLoading && (
                            <p className="text-sm text-gray-500 py-4">{t('common.loading', 'Loading...')}</p>
                        )}
                        {error && (
                            <p className="text-sm text-red-600 py-4">
                                {t('teacherRequests.detailLoadError', 'Failed to load request details.')}
                            </p>
                        )}
                        {detail && !isLoading && (
                            <dl className="space-y-0">
                                <DetailRow
                                    label={t('teacherRequests.requestType', 'Request Type')}
                                    value={getLocalized(detail.request_type?.name)}
                                />
                                <DetailRow
                                    label={t('teacherRequests.status', 'Status')}
                                    value={
                                        <span
                                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                                detail.status_text === 'pending'
                                                    ? 'bg-amber-100 text-amber-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}
                                        >
                                            {detail.status_text}
                                        </span>
                                    }
                                />
                                <DetailRow
                                    label={t('teacherRequests.currentPhase', 'Current Phase')}
                                    value={getLocalized(detail.current_phase?.name)}
                                />
                                <DetailRow
                                    label={t('teacherRequests.currentStep', 'Current Step')}
                                    value={getLocalized(detail.current_step?.name)}
                                />
                                <DetailRow
                                    label={t('teacherRequests.createdAt', 'Created At')}
                                    value={getDisplayDate(detail.created_at as any)}
                                />
                                <DetailRow
                                    label={t('teacherRequests.updatedAt', 'Updated At')}
                                    value={getDisplayDate(detail.updated_at as any)}
                                />
                                {detail.submitted_data &&
                                    Object.keys(detail.submitted_data).length > 0 && (
                                        <>
                                            <div className="text-sm font-medium text-gray-700 pt-3 pb-1">
                                                {t('teacherRequests.submittedData', 'Submitted Data')}
                                            </div>
                                            {Object.entries(detail.submitted_data).map(([key, value]) => (
                                                <DetailRow
                                                    key={key}
                                                    label={key.replace(/_/g, ' ')}
                                                    value={
                                                        typeof value === 'object' && value !== null
                                                            ? JSON.stringify(value)
                                                            : String(value ?? '')
                                                    }
                                                />
                                            ))}
                                        </>
                                    )}
                            </dl>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RequestDetailModal;
