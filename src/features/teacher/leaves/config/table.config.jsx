import { getDisplayDate, formatTimePart } from '@/utils';
import { Button, DateCell, ImageWithViewer } from '@/globals/components';
export const LEAVE_SUB_TYPES = [
    { key: 'sick', labelKey: 'leaves.subType.sick' },
    { key: 'annual', labelKey: 'leaves.subType.annual' },
    { key: 'other', labelKey: 'leaves.subType.other' }
];
export const createTeacherLeavesListColumns = (params) => {
    const { t, onCancel, isCancellingId } = params;
    return [
        {
            header: t('leaves.leaveType', 'Type'),
            accessor: (row) => row.leave_type?.label ?? row.leave_type?.key ?? '-'
        },
        {
            header: t('leaves.subType', 'Sub type'),
            accessor: (row) => row.leave_sub_type?.label ?? row.leave_sub_type?.key ?? '-'
        },
        {
            header: t('leaves.medicalReport', 'Medical Report'),
            accessor: (row) => (<ImageWithViewer src={row.medical_report_url} alt={t('leaves.medicalReport', 'Medical Report')} imgClassName="w-10 h-10 object-cover rounded-full" fallback="-"/>)
        },
        {
            header: t('leaves.period', 'Period'),
            cellClassName: 'whitespace-normal align-top',
            accessor: (row) => {
                const p = row.period;
                if (!p)
                    return '-';
                if (p.type === 'days') {
                    return (<div className="flex flex-col gap-0.5">
                            <span>{getDisplayDate(p.from_date)}</span>
                            <span className="text-gray-500">{getDisplayDate(p.to_date)}</span>
                        </div>);
                }
                return (<div className="flex flex-col gap-0.5">
                        <span>{getDisplayDate(p.date)}</span>
                        <span className="text-gray-500">
                            {p.from_time && p.to_time ? `${formatTimePart(p.from_time)} – ${formatTimePart(p.to_time)}` : '-'}
                        </span>
                    </div>);
            }
        },
        {
            header: t('leaves.duration', 'Duration'),
            accessor: (row) => row.duration?.display ?? '-'
        },
        {
            header: t('leaves.status', 'Status'),
            accessor: (row) => (<span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${row.status === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : row.status === 'rejected' || row.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'}`}>
                    {row.status}
                </span>)
        },
        {
            header: t('leaves.createdAt', 'Created'),
            cellClassName: 'whitespace-normal align-top',
            accessor: (row) => <DateCell value={row.created_at}/>
        },
        {
            header: t('common.actions', 'Actions'),
            accessor: (row) => row.status !== 'cancelled' ? (<Button type="button" variant="danger" onClick={() => onCancel(row)} disabled={isCancellingId === row.id} className="text-sm font-medium ">
                        {isCancellingId === row.id ? t('common.loading', '...') : t('leaves.cancel', 'Cancel')}
                    </Button>) : null
        }
    ];
};
