import React from 'react';
import { useTranslation } from 'react-i18next';
import { getDisplayDate } from '@/shared/utils';
import { useDateFormatStore } from '@/app/stores';
const EntityLicensesListMobile = ({ list, isLoading, hasError, errorMessage, emptyMessage, getLocalizedText }) => {
    const { t } = useTranslation();
    useDateFormatStore((s) => s.dateFormat);
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
                {errorMessage || t('licenses.loadError', 'Error loading licenses.')}
            </div>);
    }
    if (list.length === 0) {
        return (<div className="rounded-lg bg-white p-8 text-center text-gray-500 shadow-sm">
                {emptyMessage}
            </div>);
    }
    const getCreatorName = (row) => {
        const creator = row.creator ?? row.created_by;
        const creatorName = typeof creator === 'string' ? creator : creator?.name;
        return creatorName ? getLocalizedText(creatorName) : '-';
    };
    return (<div className="space-y-4 overflow-y-auto p-2">
            {list.map((row, index) => (<div key={row.id || row.license_number || row.__licenseGroup || index} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="mb-2 flex items-start justify-between gap-2">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${row.is_expired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {row.is_expired
                ? t('licenses.expired', 'Expired')
                : (row.status ? t('common.active', 'Active') : t('common.inactive', 'Inactive'))}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{row.license_number}</span>
                    </div>
                    <dl className="space-y-1.5 text-sm">
                        <div className="flex justify-between gap-2">
                            <span className="text-gray-500">{t('licenses.licenseType', 'License Type')}</span>
                            <span className="text-end text-gray-900">{row.license_type || '-'}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                            <span className="text-gray-500">{t('licenses.issueDate', 'Issue Date')}</span>
                            <span className="text-end text-gray-900">{getDisplayDate(row.issue_date)}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                            <span className="text-gray-500">{t('licenses.expirationDate', 'Expiration Date')}</span>
                            <span className="text-end text-gray-900">{getDisplayDate(row.expiration_date)}</span>
                        </div>
                        {(row.notes || row.note) ? (<div className="flex justify-between gap-2">
                                <span className="text-gray-500">{t('licenses.notes', 'Notes')}</span>
                                <span className="text-end text-gray-900">{row.notes || row.note}</span>
                            </div>) : null}
                        <div className="flex justify-between gap-2">
                            <span className="text-gray-500">{t('licenses.creator', 'Created By')}</span>
                            <span className="text-end text-gray-900">
                                {getCreatorName(row)}
                            </span>
                        </div>
                    </dl>
                </div>))}
        </div>);
};
export default EntityLicensesListMobile;
