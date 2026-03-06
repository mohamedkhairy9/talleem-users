import { TableColumn } from '@/globals/types';
import type { TeacherLeaveItem } from '../types/teacher-leaves.types';
import { getDisplayDate, formatTimePart } from '@/utils';
import { useTranslation } from 'react-i18next';
import { Button, DateCell, ImageWithViewer } from '@/globals/components';

export const LEAVE_SUB_TYPES = [
    { key: 'sick', labelKey: 'leaves.subType.sick' },
    { key: 'annual', labelKey: 'leaves.subType.annual' },
    { key: 'other', labelKey: 'leaves.subType.other' }
];

export const createTeacherLeavesListColumns = (params: {
    t: ReturnType<typeof useTranslation>['t'];
    onCancel: (item: TeacherLeaveItem) => void;
    isCancellingId: number | null;
}): TableColumn<TeacherLeaveItem>[] => {
    const { t, onCancel, isCancellingId } = params;

    return [
        {
            header: t('leaves.leaveType', 'Type'),
            accessor: (row: TeacherLeaveItem) => row.leave_type?.label ?? row.leave_type?.key ?? '-'
        },
        {
            header: t('leaves.subType', 'Sub type'),
            accessor: (row: TeacherLeaveItem) =>
                row.leave_sub_type?.label ?? row.leave_sub_type?.key ?? '-'
        },
        {
            header: t('leaves.medicalReport', 'Medical Report'),
            accessor: (row: TeacherLeaveItem) => (
                <ImageWithViewer
                    src={row.medical_report_url}
                    alt={t('leaves.medicalReport', 'Medical Report')}
                    imgClassName="w-10 h-10 object-cover rounded-full"
                    fallback="-"
                />
            )
        },
        {
            header: t('leaves.period', 'Period'),
            cellClassName: 'whitespace-normal align-top',
            accessor: (row: TeacherLeaveItem) => {
                const p = row.period;
                if (!p) return '-';
                if (p.type === 'days') {
                    return (
                        <div className="flex flex-col gap-0.5">
                            <span>{getDisplayDate(p.from_date)}</span>
                            <span className="text-gray-500">{getDisplayDate(p.to_date)}</span>
                        </div>
                    );
                }
                return (
                    <div className="flex flex-col gap-0.5">
                        <span>{getDisplayDate(p.date)}</span>
                        <span className="text-gray-500">
                            {p.from_time && p.to_time ? `${formatTimePart(p.from_time)} – ${formatTimePart(p.to_time)}` : '-'}
                        </span>
                    </div>
                );
            }
        },
        {
            header: t('leaves.duration', 'Duration'),
            accessor: (row: TeacherLeaveItem) => row.duration?.display ?? '-'
        },
        {
            header: t('leaves.status', 'Status'),
            accessor: (row: TeacherLeaveItem) => (
                <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        row.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : row.status === 'rejected' || row.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                    }`}
                >
                    {row.status}
                </span>
            )
        },
        {
            header: t('leaves.createdAt', 'Created'),
            cellClassName: 'whitespace-normal align-top',
            accessor: (row: TeacherLeaveItem) => <DateCell value={row.created_at} />
        },
        {
            header: t('common.actions', 'Actions'),
            accessor: (row: TeacherLeaveItem) =>
                row.status !== 'cancelled' ? (
                    <Button
                        type="button"
                        variant="danger"
                        onClick={() => onCancel(row)}
                        disabled={isCancellingId === row.id}
                        className="text-sm font-medium "
                    >
                        {isCancellingId === row.id ? t('common.loading', '...') : t('leaves.cancel', 'Cancel')}
                    </Button>
                ) : null
        }
    ];
};
