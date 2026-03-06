import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTeacherCurrentLicense } from '../hooks/useLicenses';
import { getDisplayDate } from '@/utils';
import { useDateFormatStore } from '@/stores';
import type { TeacherLicenseItem } from '../types/licenses.types';

/**
 * Displays the teacher's current (active) license from GET /teacher/licenses/current
 */
const CurrentLicenseCard: React.FC = () => {
    const { t } = useTranslation();
    useDateFormatStore((s) => s.dateFormat);

    const { currentLicense, isLoading, error } = useTeacherCurrentLicense();

    if (isLoading && !currentLicense) {
        return (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />
                </div>
            </div>
        );
    }

    if (error || !currentLicense) {
        return null;
    }

    const row: TeacherLicenseItem = currentLicense;

    return (
        <div className="rounded-lg border border-primary-200 bg-primary-50/50 p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-gray-900">
                {t('licenses.currentLicense', 'Current License')}
            </h3>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                <div>
                    <dt className="text-sm text-gray-500">{t('licenses.licenseNumber', 'License Number')}</dt>
                    <dd className="text-sm font-medium text-gray-900">{row.license_number || '-'}</dd>
                </div>
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
                    <dd>
                        <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                row.is_expired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}
                        >
                            {row.is_expired
                                ? t('licenses.expired', 'Expired')
                                : (row.status ? t('common.active', 'Active') : t('common.inactive', 'Inactive'))}
                        </span>
                    </dd>
                </div>
                {row.notes ? (
                    <div className="sm:col-span-2 md:col-span-3">
                        <dt className="text-sm text-gray-500">{t('licenses.notes', 'Notes')}</dt>
                        <dd className="text-sm text-gray-900">{row.notes}</dd>
                    </div>
                ) : null}
            </dl>
        </div>
    );
};

export default CurrentLicenseCard;
