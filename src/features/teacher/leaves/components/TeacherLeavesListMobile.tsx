import React from 'react';
import { useTranslation } from 'react-i18next';
import type { TeacherLeaveItem } from '../types/teacher-leaves.types';
import { getDisplayDate } from '@/utils';
import { ImageWithViewer } from '@/globals/components';

interface TeacherLeavesListMobileProps {
    list: TeacherLeaveItem[];
    isLoading: boolean;
    hasError: boolean;
    errorMessage?: string;
    emptyMessage: string;
    onCancel: (item: TeacherLeaveItem) => void;
    cancellingId: number | null;
}

const TeacherLeavesListMobile: React.FC<TeacherLeavesListMobileProps> = ({
    list,
    isLoading,
    hasError,
    errorMessage,
    emptyMessage,
    onCancel,
    cancellingId
}) => {
    const { t } = useTranslation();

    if (isLoading && list.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />
                    <p className="text-sm text-gray-600">{t('common.loading', 'Loading...')}</p>
                </div>
            </div>
        );
    }

    if (hasError) {
        return (
            <div className="rounded-lg bg-white p-8 text-center text-red-600 shadow-sm">
                {errorMessage || t('leaves.loadError', 'Error loading leaves.')}
            </div>
        );
    }

    if (list.length === 0) {
        return (
            <div className="rounded-lg bg-white p-8 text-center text-gray-500 shadow-sm">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="space-y-4 overflow-y-auto p-2">
            {list.map((row) => (
                <div key={row.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="mb-2 flex items-start justify-between gap-2">
                        <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${row.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : row.status === 'rejected' || row.status === 'cancelled'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                        >
                            {row.status}
                        </span>
                        <span className="text-sm text-gray-500">{row.leave_type?.label ?? row.leave_type?.key}</span>
                    </div>
                    <dl className="space-y-1.5 text-sm">
                        <div className="flex justify-between gap-2">
                            <span className="text-gray-500">{t('leaves.subType', 'Sub type')}</span>
                            <span className="text-end text-gray-900">
                                {row.leave_sub_type?.label ?? row.leave_sub_type?.key ?? '-'}
                            </span>
                        </div>
                        {row.medical_report_url && <div className="flex justify-between gap-2">
                            <span className="text-gray-500">{t('leaves.medicalReport', 'Medical Report')}</span>
                            <span className="text-end text-gray-900">
                                <ImageWithViewer
                                    src={row.medical_report_url}
                                    alt={t('leaves.medicalReport', 'Medical Report')}
                                    imgClassName="w-10 h-10 object-cover rounded-full"
                                    fallback="-"
                                />
                            </span>

                        </div>
                        }
                        <div className="flex justify-between gap-2">
                            <span className="text-gray-500">{t('leaves.period', 'Period')}</span>
                            <span className="text-end text-gray-900">{row.period?.display ?? '-'}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                            <span className="text-gray-500">{t('leaves.duration', 'Duration')}</span>
                            <span className="text-end text-gray-900">{row.duration?.display ?? '-'}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                            <span className="text-gray-500">{t('leaves.createdAt', 'Created')}</span>
                            <span className="text-end text-gray-900">{getDisplayDate(row.created_at)}</span>
                        </div>
                    </dl>
                    {row.status === 'pending' && (
                        <div className="mt-3">
                            <button
                                type="button"
                                onClick={() => onCancel(row)}
                                disabled={cancellingId === row.id}
                                className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                            >
                                {cancellingId === row.id ? t('common.loading', '...') : t('leaves.cancel', 'Cancel')}
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default TeacherLeavesListMobile;
