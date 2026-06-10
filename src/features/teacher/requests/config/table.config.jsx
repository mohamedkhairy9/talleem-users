import { EyeIcon } from '@/shared/icons';
import { DateCell } from '@/shared/components';
import { getLocalizedText as getLocalizedTextHelper } from '@/shared/utils';
export function createTeacherRequestsColumns(params) {
    const { t, currentLang, onView } = params;
    const getLocalized = (obj) => getLocalizedTextHelper(obj, currentLang, t('common.not_available', 'N/A'));
    return [
        {
            header: t('teacherRequests.requestType', 'Request Type'),
            accessor: (row) => getLocalized(row.request_type?.name)
        },
        {
            header: t('teacherRequests.status', 'Status'),
            accessor: (row) => (<span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${row.status_text === 'pending'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-gray-100 text-gray-800'}`}>
                    {row.status_text}
                </span>)
        },
        {
            header: t('teacherRequests.currentPhase', 'Current Phase'),
            accessor: (row) => getLocalized(row.current_phase?.name)
        },
        {
            header: t('teacherRequests.currentStep', 'Current Step'),
            accessor: (row) => getLocalized(row.current_step?.name)
        },
        {
            header: t('teacherRequests.createdAt', 'Created At'),
            cellClassName: 'whitespace-normal align-top',
            accessor: (row) => <DateCell value={row.created_at}/>
        },
        {
            header: t('teacherRequests.actions', 'Actions'),
            accessor: (row) => (<button type="button" onClick={() => onView(row.id)} className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium" aria-label={t('teacherRequests.viewDetails', 'View details')}>
                    <EyeIcon width={18} height={18}/>
                    {t('teacherRequests.viewDetails', 'View')}
                </button>)
        }
    ];
}
