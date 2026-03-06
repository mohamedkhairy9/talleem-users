import { TableColumn } from '@/globals/types';
import type { WarningResponse } from '../services/warnings.service';
import { DateCell } from '@/globals/components';
import { useTranslation } from 'react-i18next';

/**
 * Table Columns Configuration for Warnings List
 * Returns a function that creates table columns with the necessary dependencies
 */
export const createWarningsListColumns = (params: {
    t: ReturnType<typeof useTranslation>['t'];
    getLocalizedText: (obj: { en?: string; ar?: string } | string | null | undefined) => string;
}): TableColumn<WarningResponse>[] => {
    const { t, getLocalizedText } = params;

    return [
        {
            header: t('warning.date', 'Date'),
            cellClassName: 'whitespace-normal align-top',
            accessor: (row: WarningResponse) => <DateCell value={row.date} />
        },
        {
            header: t('warning.warningType', 'Warning Type'),
            accessor: (row: WarningResponse) => t(`warning.type.${row.warning_type}`, row.warning_type)
        },
        {
            header: t('warning.target', 'Target'),
            accessor: (row: WarningResponse) => {
                if (row.warning_type === 'student' && row.student) {
                    return getLocalizedText(row.student.name);
                }
                if (row.warning_type === 'teacher' && row.teacher) {
                    return getLocalizedText(row.teacher.name);
                }
                return '-';
            }
        },
        {
            header: t('warning.warningReason', 'Warning Reason'),
            accessor: (row: WarningResponse) => getLocalizedText(row.warning_reason?.name)
        },
        {
            header: t('warning.note', 'Note'),
            accessor: (row: WarningResponse) => row.note || '-'
        },
        {
            header: t('warning.status', 'Status'),
            accessor: (row: WarningResponse) => (
                <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        row.status
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                    }`}
                >
                    {row.status ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                </span>
            )
        }
    ];
};

