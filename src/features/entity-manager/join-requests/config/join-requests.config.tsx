import type { TableColumn } from '@/globals/types';
import type { JoinRequestResponse } from '../types/join-requests.types';
import { getDisplayDate } from '@/utils';

export const PROCESS_STEP_STATUS_OPTIONS = [
    { value: 1 as const, labelKey: 'joinRequests.statusOptions.approved' },
    { value: 2 as const, labelKey: 'joinRequests.statusOptions.rejected' },
    { value: 3 as const, labelKey: 'joinRequests.statusOptions.needReview' },
    { value: 4 as const, labelKey: 'joinRequests.statusOptions.needUpload' }
];

export function getLocalizedText(
    obj: { en?: string; ar?: string } | string | null | undefined,
    lang: string
): string {
    if (typeof obj === 'string') return obj;
    if (!obj) return '-';
    if (lang === 'ar' && obj.ar) return obj.ar;
    if (obj.en) return obj.en;
    return '-';
}

export function createJoinRequestsColumns(params: {
    t: (key: string, fallback?: string) => string;
    getLocalizedText: (obj: { en?: string; ar?: string } | string | null | undefined) => string;
}): TableColumn<JoinRequestResponse>[] {
    const { t, getLocalizedText } = params;

    return [
        {
            header: t('common.id', 'ID'),
            accessor: (row: JoinRequestResponse) => row.id
        },
        {
            header: t('joinRequests.name', 'Name'),
            accessor: (row: JoinRequestResponse) => {
                const name = row.submitted_data?.name;
                if (typeof name === 'string') return name;
                if (name && typeof name === 'object' && ('en' in name || 'ar' in name)) {
                    return getLocalizedText(name as { en?: string; ar?: string });
                }
                return '-';
            }
        },
        {
            header: t('joinRequests.requestType', 'Request Type'),
            accessor: (row: JoinRequestResponse) =>
                getLocalizedText(row.request_type?.name) || `#${row.request_type_id ?? '-'}`
        },
        {
            header: t('joinRequests.form', 'Form'),
            accessor: (row: JoinRequestResponse) => getLocalizedText(row.form?.name)
        },
        {
            header: t('joinRequests.currentPhase', 'Current Phase'),
            accessor: (row: JoinRequestResponse) => getLocalizedText(row.current_phase?.name)
        },
        {
            header: t('joinRequests.status', 'Status'),
            accessor: (row: JoinRequestResponse) => (
                <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800">
                    {row.status_text ?? '-'}
                </span>
            )
        },
        {
            header: t('joinRequests.createdAt', 'Created At'),
            accessor: (row: JoinRequestResponse) => getDisplayDate(row.created_at)
        }
    ];
}
