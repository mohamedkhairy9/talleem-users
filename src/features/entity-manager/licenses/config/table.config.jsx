import { DateCell } from '@/shared/components';
/**
 * Table columns for Entity Manager Licenses List
 */
export const createEntityLicensesListColumns = (params) => {
    const { t, getLocalizedText } = params;

    const getCreatorName = (row) => {
        const creator = row.creator ?? row.created_by;
        const creatorName = typeof creator === 'string' ? creator : creator?.name;
        return creatorName ? getLocalizedText(creatorName) : '-';
    };

    return [
        {
            header: t('licenses.licenseNumber', 'License Number'),
            accessor: (row) => row.license_number || '-'
        },
        {
            header: t('licenses.licenseType', 'License Type'),
            accessor: (row) => row.license_type || '-'
        },
        {
            header: t('licenses.issueDate', 'Issue Date'),
            cellClassName: 'whitespace-normal align-top',
            accessor: (row) => <DateCell value={row.issue_date}/>
        },
        {
            header: t('licenses.expirationDate', 'Expiration Date'),
            cellClassName: 'whitespace-normal align-top',
            accessor: (row) => <DateCell value={row.expiration_date}/>
        },
        {
            header: t('licenses.status', 'Status'),
            accessor: (row) => (<span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${row.is_expired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {row.is_expired
                    ? t('licenses.expired', 'Expired')
                    : (row.status ? t('common.active', 'Active') : t('common.inactive', 'Inactive'))}
                </span>)
        },
        {
            header: t('licenses.notes', 'Notes'),
            accessor: (row) => row.notes || row.note || '-'
        },
        {
            header: t('licenses.creator', 'Created By'),
            accessor: (row) => getCreatorName(row)
        }
    ];
};
