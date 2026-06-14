import React from 'react';
import { useTranslation } from 'react-i18next';
import { useEntityCurrentLicense } from '../hooks/useLicenses';
import { getDisplayDate } from '@/shared/utils';
import { useDateFormatStore } from '@/app/stores';

const getLicenseGroupLabel = (groupKey, isArabic) => {
    if (groupKey === 'registration_license') {
        return isArabic ? 'رخصة التسجيل' : 'Registration License';
    }

    if (groupKey === 'business_license') {
        return isArabic ? 'رخصة النشاط' : 'Business License';
    }

    return isArabic ? 'الرخصة' : 'License';
};
/**
 * Displays the entity's current (active) license from GET /entity/licenses/current
 */
const CurrentLicenseCard = () => {
    const { t, i18n } = useTranslation();
    useDateFormatStore((s) => s.dateFormat);
    const { currentLicenses, isLoading, error } = useEntityCurrentLicense();
    const isArabic = i18n.language?.startsWith('ar');

    if (isLoading && currentLicenses.length === 0) {
        return (<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600"/>
                </div>
            </div>);
    }
    if (error || currentLicenses.length === 0) {
        return null;
    }

    return (<div className="rounded-lg border border-primary-200 bg-primary-50/50 p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-gray-900">
                {t('licenses.currentLicense', 'Current License')}
            </h3>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {currentLicenses.map((row) => {
            const note = row.notes || row.note;
            const label = getLicenseGroupLabel(row.__licenseGroup, isArabic);
            return (<div key={row.id || row.license_number || row.__licenseGroup} className="rounded-lg border border-white/70 bg-white p-4 shadow-sm">
                            <div className="mb-4 flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{label}</p>
                                    <p className="text-xs text-gray-500">{row.license_number || '-'}</p>
                                </div>
                                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${row.is_expired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                    {row.is_expired
                        ? t('licenses.expired', 'Expired')
                        : (row.status ? t('common.active', 'Active') : t('common.inactive', 'Inactive'))}
                                </span>
                            </div>
                            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <dt className="text-sm text-gray-500">{t('licenses.licenseType', 'License Type')}</dt>
                                    <dd className="text-sm text-gray-900">{row.license_type || '-'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500">{t('licenses.issueDate', 'Issue Date')}</dt>
                                    <dd className="text-sm text-gray-900">{getDisplayDate(row.issue_date)}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500">{t('licenses.expirationDate', 'Expiration Date')}</dt>
                                    <dd className="text-sm text-gray-900">{getDisplayDate(row.expiration_date)}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500">{t('licenses.status', 'Status')}</dt>
                                    <dd className="text-sm text-gray-900">
                                        {row.is_expired
                            ? t('licenses.expired', 'Expired')
                            : (row.status ? t('common.active', 'Active') : t('common.inactive', 'Inactive'))}
                                    </dd>
                                </div>
                                {note ? (<div className="sm:col-span-2">
                                        <dt className="text-sm text-gray-500">{t('licenses.notes', 'Notes')}</dt>
                                        <dd className="text-sm text-gray-900">{note}</dd>
                                    </div>) : null}
                            </dl>
                        </div>);
        })}
            </div>
        </div>);
};
export default CurrentLicenseCard;
