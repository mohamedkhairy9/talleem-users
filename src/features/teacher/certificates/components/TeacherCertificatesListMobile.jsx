import React from 'react';
import { useTranslation } from 'react-i18next';
import { AwardIcon } from '@/shared/icons';
const TeacherCertificatesListMobile = ({ list, isLoading, hasError, errorMessage, emptyMessage, getLocalizedText, onViewCertificates }) => {
    const { t } = useTranslation();
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
                {errorMessage || t('certificates.loadError', 'Error loading students.')}
            </div>);
    }
    if (list.length === 0) {
        return (<div className="rounded-lg bg-white p-8 text-center text-gray-500 shadow-sm">
                {emptyMessage}
            </div>);
    }
    return (<div className="space-y-4 overflow-y-auto p-2">
            {list.map((row) => (<div key={row.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <dl className="space-y-1.5 text-sm">
                        <div className="flex justify-between gap-2">
                            <span className="text-gray-500">{t('certificates.studentName', 'Student')}</span>
                            <span className="text-end text-gray-900 font-medium">
                                {getLocalizedText(row.name) || '-'}
                            </span>
                        </div>
                        <div className="flex justify-between gap-2">
                            <span className="text-gray-500">{t('certificates.nationalId', 'National ID')}</span>
                            <span className="text-end text-gray-900">{row.national_id || '-'}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                            <span className="text-gray-500">{t('certificates.halaqas', 'Halaqas')}</span>
                            <span className="text-end text-gray-900">
                                {row.halaqas?.length
                ? row.halaqas.map((h) => getLocalizedText(h.name)).join(', ')
                : '-'}
                            </span>
                        </div>
                    </dl>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <button type="button" onClick={() => onViewCertificates(row)} className="cursor-pointer inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium" aria-label={t('certificates.viewCertificates', 'View certificates')}>
                            <AwardIcon width={18} height={18}/>
                            {t('certificates.viewCertificates', 'Certificates')}
                        </button>
                    </div>
                </div>))}
        </div>);
};
export default TeacherCertificatesListMobile;
