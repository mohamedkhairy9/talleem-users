import { DateCell } from '@/shared/components';
/**
 * Table columns for Teacher Warnings List
 */
export const createTeacherWarningsListColumns = (params) => {
    const { t, getLocalizedText } = params;
    return [
        {
            header: t('warning.date', 'Date'),
            cellClassName: 'whitespace-normal align-top',
            accessor: (row) => <DateCell value={row.date}/>
        },
        {
            header: t('warning.warningReason', 'Warning Reason'),
            accessor: (row) => getLocalizedText(row.warning_reason?.name)
        },
        {
            header: t('warning.note', 'Note'),
            accessor: (row) => row.note || '-'
        },
        {
            header: t('warning.branch', 'Branch'),
            accessor: (row) => getLocalizedText(row.branch?.name)
        },
        {
            header: t('warning.status', 'Status'),
            accessor: (row) => (<span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${row.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {row.status ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                </span>)
        },
        {
            header: t('warning.createdBy', 'Created By'),
            accessor: (row) => getLocalizedText(row.created_by?.name)
        },
        {
            header: t('warning.createdAt', 'Created At'),
            cellClassName: 'whitespace-normal align-top',
            accessor: (row) => <DateCell value={row.created_at}/>
        }
    ];
};
