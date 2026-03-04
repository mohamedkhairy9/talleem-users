import React from 'react';
import { useTranslation } from 'react-i18next';
import type { TeacherWarningResponse } from '../types/teacher-warnings.types';
import { getDisplayDate } from '@/utils';
import { useDateFormatStore } from '@/stores';

interface TeacherWarningsListMobileProps {
    list: TeacherWarningResponse[];
    isLoading: boolean;
    hasError: boolean;
    errorMessage?: string;
    emptyMessage: string;
    getLocalizedText: (obj: { en?: string; ar?: string } | string | null | undefined) => string;
}

const TeacherWarningsListMobile: React.FC<TeacherWarningsListMobileProps> = ({
    list,
    isLoading,
    hasError,
    errorMessage,
    emptyMessage,
    getLocalizedText
}) => {
    const { t } = useTranslation();
    useDateFormatStore((s) => s.dateFormat);

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
                {errorMessage || t('warning.loadError', 'Error loading warnings.')}
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
                <div
                    key={row.id}
                    className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                    <div className="mb-2 flex items-start justify-between gap-2">
                        <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                row.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                        >
                            {row.status ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                        </span>
                        <span className="text-sm text-gray-500">{getDisplayDate(row.date)}</span>
                    </div>
                    <dl className="space-y-1.5 text-sm">
                        <div className="flex justify-between gap-2">
                            <span className="text-gray-500">{t('warning.warningReason', 'Warning Reason')}</span>
                            <span className="text-end text-gray-900">
                                {getLocalizedText(row.warning_reason?.name) || '-'}
                            </span>
                        </div>
                        <div className="flex justify-between gap-2">
                            <span className="text-gray-500">{t('warning.branch', 'Branch')}</span>
                            <span className="text-end text-gray-900">
                                {getLocalizedText(row.branch?.name) || '-'}
                            </span>
                        </div>
                        <div className="flex justify-between gap-2">
                            <span className="text-gray-500">{t('warning.note', 'Note')}</span>
                            <span className="text-end text-gray-900">{row.note || '-'}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                            <span className="text-gray-500">{t('warning.createdBy', 'Created By')}</span>
                            <span className="text-end text-gray-900">
                                {getLocalizedText(row.created_by?.name) || '-'}
                            </span>
                        </div>
                        <div className="flex justify-between gap-2">
                            <span className="text-gray-500">{t('warning.createdAt', 'Created At')}</span>
                            <span className="text-end text-gray-900">{getDisplayDate(row.created_at)}</span>
                        </div>
                    </dl>
                </div>
            ))}
        </div>
    );
};

export default TeacherWarningsListMobile;
