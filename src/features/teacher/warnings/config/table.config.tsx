import { TableColumn } from '@/globals/types';
import type { TeacherWarningResponse } from '../types/teacher-warnings.types';
import { DateCell } from '@/globals/components';
import { useTranslation } from 'react-i18next';

/**
 * Table columns for Teacher Warnings List
 */
export const createTeacherWarningsListColumns = (params: {
    t: ReturnType<typeof useTranslation>['t'];
    getLocalizedText: (obj: { en?: string; ar?: string } | string | null | undefined) => string;
}): TableColumn<TeacherWarningResponse>[] => {
    const { t, getLocalizedText } = params;

    return [
        {
            header: t('warning.date', 'Date'),
            cellClassName: 'whitespace-normal align-top',
            accessor: (row: TeacherWarningResponse) => <DateCell value={row.date} />
        },
        {
            header: t('warning.warningReason', 'Warning Reason'),
            accessor: (row: TeacherWarningResponse) => getLocalizedText(row.warning_reason?.name)
        },
        {
            header: t('warning.note', 'Note'),
            accessor: (row: TeacherWarningResponse) => row.note || '-'
        },
        {
            header: t('warning.branch', 'Branch'),
            accessor: (row: TeacherWarningResponse) => getLocalizedText(row.branch?.name)
        },
        {
            header: t('warning.status', 'Status'),
            accessor: (row: TeacherWarningResponse) => (
                <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        row.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                >
                    {row.status ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                </span>
            )
        },
        {
            header: t('warning.createdBy', 'Created By'),
            accessor: (row: TeacherWarningResponse) => getLocalizedText(row.created_by?.name)
        },
        {
            header: t('warning.createdAt', 'Created At'),
            cellClassName: 'whitespace-normal align-top',
            accessor: (row: TeacherWarningResponse) => <DateCell value={row.created_at} />
        }
    ];
};
