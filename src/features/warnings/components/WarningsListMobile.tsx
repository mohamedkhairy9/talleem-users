import React from 'react';
import { useTranslation } from 'react-i18next';
import type { WarningResponse } from '../services/warnings.service';
import { formatDate } from '@/utils';

interface WarningsListMobileProps {
    list: WarningResponse[];
    isLoading: boolean;
    hasError: boolean;
    errorMessage?: string;
    emptyMessage: string;
    getLocalizedText: (obj: { en?: string; ar?: string } | string | null | undefined) => string;
}

export const WarningsListMobile: React.FC<WarningsListMobileProps> = ({
    list,
    isLoading,
    hasError,
    errorMessage,
    emptyMessage,
    getLocalizedText
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
        <div className="space-y-4 overflow-y-auto p-4">
            {list.map((row) => {
                // Get target name based on warning type
                const getTargetName = () => {
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
                };

                return (
                    <div
                        key={row.id}
                        className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                    >
                        <div className="mb-3 flex items-start justify-between gap-2">
                            <div className="flex-1">
                                <h3 className="text-base font-bold text-gray-900">
                                    {getTargetName()}
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {t(`warning.type.${row.warning_type}`, row.warning_type)}
                                </p>
                            </div>
                            <span
                                className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                    row.status
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                }`}
                            >
                                {row.status ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                            </span>
                        </div>
                        <dl className="space-y-1.5 text-sm">
                            <div className="flex justify-between gap-2">
                                <span className="text-gray-500">{t('warning.date', 'Date')}</span>
                                <span className="text-gray-900 text-end">
                                    {formatDate(row.date)}
                                </span>
                            </div>
                            <div className="flex justify-between gap-2">
                                <span className="text-gray-500">{t('warning.branch', 'Branch')}</span>
                                <span className="text-gray-900 text-end">
                                    {getLocalizedText(row.branch?.name)}
                                </span>
                            </div>
                            <div className="flex justify-between gap-2">
                                <span className="text-gray-500">{t('warning.program', 'Program')}</span>
                                <span className="text-gray-900 text-end">
                                    {getLocalizedText(row.program?.name)}
                                </span>
                            </div>
                            <div className="flex justify-between gap-2">
                                <span className="text-gray-500">
                                    {t('warning.warningReason', 'Warning Reason')}
                                </span>
                                <span className="text-gray-900 text-end">
                                    {getLocalizedText(row.warning_reason?.name)}
                                </span>
                            </div>
                            {row.note && (
                                <div className="flex flex-col gap-1 pt-1">
                                    <span className="text-gray-500">{t('warning.note', 'Note')}</span>
                                    <span className="text-gray-900 break-words">
                                        {row.note}
                                    </span>
                                </div>
                            )}
                        </dl>
                    </div>
                );
            })}
        </div>
    );
};

