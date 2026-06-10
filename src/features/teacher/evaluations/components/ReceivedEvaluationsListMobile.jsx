import React from 'react';
import { useTranslation } from 'react-i18next';
import { getDisplayDate } from '@/shared/utils';
import { useDateFormatStore } from '@/app/stores';
const ReceivedEvaluationsListMobile = ({ list, isLoading, hasError, errorMessage, emptyMessage, getLocalizedText }) => {
    const { t } = useTranslation();
    useDateFormatStore((s) => s.dateFormat);
    const formatDate = (row) => {
        const dateStr = row.evaluation_date?.gregorian ?? row.date?.gregorian;
        return dateStr ? getDisplayDate(dateStr) : '-';
    };
    if (isLoading && list.length === 0) {
        return (<div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600"/>
                    <p className="text-sm text-gray-600">{t('common.loading', 'Loading...')}</p>
                </div>
            </div>);
    }
    if (hasError) {
        return (<div className="rounded-lg bg-white p-8 text-center text-red-600 shadow-sm">
                {errorMessage || t('evaluations.loadError', 'Error loading evaluations.')}
            </div>);
    }
    if (list.length === 0) {
        return (<div className="rounded-lg bg-white p-8 text-center text-gray-500 shadow-sm">
                {emptyMessage}
            </div>);
    }
    return (<div className="space-y-4 overflow-y-auto p-2">
            {list.map((row) => (<div key={row.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <h3 className="mb-2 text-sm font-semibold text-gray-900">
                        {getLocalizedText(row.evaluation_name) || '-'}
                    </h3>
                    <dl className="space-y-1.5 text-sm">
                        <div className="flex justify-between gap-2">
                            <span className="text-gray-500">{t('evaluations.date', 'Date')}</span>
                            <span className="text-end text-gray-900">{formatDate(row)}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                            <span className="text-gray-500">{t('evaluations.submittedBy', 'Submitted By')}</span>
                            <span className="text-end text-gray-900">
                                {getLocalizedText(row.submitted_by?.name) || '-'}
                            </span>
                        </div>
                        <div className="flex justify-between gap-2">
                            <span className="text-gray-500">{t('evaluations.evaluated', 'Evaluated')}</span>
                            <span className="text-end text-gray-900">
                                {getLocalizedText(row.evaluated?.name) || '-'}
                            </span>
                        </div>
                        <div className="flex justify-between gap-2">
                            <span className="text-gray-500">{t('evaluations.totalScore', 'Total Score')}</span>
                            <span className="text-end font-medium text-gray-900">{row.total_score ?? '-'}</span>
                        </div>
                    </dl>
                </div>))}
        </div>);
};
export default ReceivedEvaluationsListMobile;
