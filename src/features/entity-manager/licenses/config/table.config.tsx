import { TableColumn } from '@/globals/types';
import type { EntityLicenseItem } from '../types/licenses.types';
import { DateCell } from '@/globals/components';
import { useTranslation } from 'react-i18next';

/**
 * Table columns for Entity Manager Licenses List
 */
export const createEntityLicensesListColumns = (params: {
    t: ReturnType<typeof useTranslation>['t'];
    getLocalizedText: (obj: { en?: string; ar?: string } | string | null | undefined) => string;
}): TableColumn<EntityLicenseItem>[] => {
    const { t, getLocalizedText } = params;

    return [
        {
            header: t('licenses.licenseNumber', 'License Number'),
            accessor: (row: EntityLicenseItem) => row.license_number || '-'
        },
        {
            header: t('licenses.licenseType', 'License Type'),
            accessor: (row: EntityLicenseItem) => row.license_type || '-'
        },
        {
            header: t('licenses.issueDate', 'Issue Date'),
            cellClassName: 'whitespace-normal align-top',
            accessor: (row: EntityLicenseItem) => <DateCell value={row.issue_date} />
        },
        {
            header: t('licenses.expirationDate', 'Expiration Date'),
            cellClassName: 'whitespace-normal align-top',
            accessor: (row: EntityLicenseItem) => <DateCell value={row.expiration_date} />
        },
        {
            header: t('licenses.status', 'Status'),
            accessor: (row: EntityLicenseItem) => (
                <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        row.is_expired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}
                >
                    {row.is_expired
                        ? t('licenses.expired', 'Expired')
                        : (row.status ? t('common.active', 'Active') : t('common.inactive', 'Inactive'))}
                </span>
            )
        },
        {
            header: t('licenses.notes', 'Notes'),
            accessor: (row: EntityLicenseItem) => row.notes || '-'
        },
        {
            header: t('licenses.creator', 'Created By'),
            accessor: (row: EntityLicenseItem) => (row.creator ? getLocalizedText(row.creator.name) : '-')
        }
    ];
};
