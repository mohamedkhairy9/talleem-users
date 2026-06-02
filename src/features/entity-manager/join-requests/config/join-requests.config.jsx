import { DateCell } from '@/globals/components';
export const PROCESS_STEP_STATUS_OPTIONS = [
    { value: 1, labelKey: 'joinRequests.statusOptions.approved' },
    { value: 2, labelKey: 'joinRequests.statusOptions.rejected' },
    { value: 3, labelKey: 'joinRequests.statusOptions.needReview' },
    { value: 4, labelKey: 'joinRequests.statusOptions.needUpload' }
];

const ARABIC_DISPLAY_STATUS_MAP = {
    new: 'جديد',
    pending: 'قيد المراجعة',
    approved: 'تم القبول',
    rejected: 'مرفوض',
    needReview: 'بحاجة لمراجعة',
    needUpload: 'بحاجة لرفع'
};

function normalizeText(value) {
    return String(value ?? '')
        .trim()
        .toLowerCase()
        .replace(/[أإآ]/g, 'ا')
        .replace(/ؤ/g, 'و')
        .replace(/ئ/g, 'ي')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export function getLocalizedText(obj, lang) {
    if (typeof obj === 'string')
        return obj;
    if (!obj)
        return '-';
    if (lang === 'ar' && obj.ar)
        return obj.ar;
    if (obj.en)
        return obj.en;
    return '-';
}

export function localizeJoinRequestStatusText(statusText, lang = 'ar') {
    if (statusText == null) return '';

    const rawText = String(statusText).trim();
    if (!rawText || lang !== 'ar') {
        return rawText;
    }

    const normalized = normalizeText(rawText);

    if (normalized.includes('جديد') || normalized.includes('new')) return ARABIC_DISPLAY_STATUS_MAP.new;
    if (normalized.includes('pending') || normalized.includes('انتظار') || normalized.includes('قيد المراجعه')) {
        return ARABIC_DISPLAY_STATUS_MAP.pending;
    }
    if (
        normalized.includes('approved') ||
        normalized.includes('accepted') ||
        normalized.includes('موافق') ||
        normalized.includes('قبول')
    ) {
        return ARABIC_DISPLAY_STATUS_MAP.approved;
    }
    if (normalized.includes('rejected') || normalized.includes('declined') || normalized.includes('مرفوض')) {
        return ARABIC_DISPLAY_STATUS_MAP.rejected;
    }
    if (normalized.includes('review') || normalized.includes('مراجعه')) {
        return ARABIC_DISPLAY_STATUS_MAP.needReview;
    }
    if (normalized.includes('upload') || normalized.includes('رفع')) {
        return ARABIC_DISPLAY_STATUS_MAP.needUpload;
    }

    return rawText;
}

export function getJoinRequestStatusBadgeClasses(statusText = '') {
    const normalized = normalizeText(statusText);

    if (normalized.includes('approved') || normalized.includes('موافق') || normalized.includes('قبول')) {
        return 'bg-green-100 text-green-800';
    }
    if (normalized.includes('rejected') || normalized.includes('مرفوض')) {
        return 'bg-red-100 text-red-800';
    }
    if (normalized.includes('new') || normalized.includes('جديد')) {
        return 'bg-blue-100 text-blue-800';
    }
    if (normalized.includes('pending') || normalized.includes('انتظار') || normalized.includes('قيد المراجعه')) {
        return 'bg-yellow-100 text-yellow-800';
    }
    if (normalized.includes('review') || normalized.includes('مراجعه')) {
        return 'bg-blue-100 text-blue-800';
    }
    if (normalized.includes('upload') || normalized.includes('رفع')) {
        return 'bg-purple-100 text-purple-800';
    }

    return 'bg-gray-100 text-gray-800';
}

export function createJoinRequestsColumns(params) {
    const { t, getLocalizedText, lang = 'ar' } = params;
    return [
        {
            header: t('common.id', 'ID'),
            accessor: (row) => row.id
        },
        {
            header: t('joinRequests.name', 'Name'),
            accessor: (row) => {
                const name = row.submitted_data?.name;
                if (typeof name === 'string')
                    return name;
                if (name && typeof name === 'object' && ('en' in name || 'ar' in name)) {
                    return getLocalizedText(name);
                }
                return '-';
            }
        },
        {
            header: t('joinRequests.requestType', 'Request Type'),
            accessor: (row) => getLocalizedText(row.request_type?.name) || `#${row.request_type_id ?? '-'}`
        },
        {
            header: t('joinRequests.form', 'Form'),
            accessor: (row) => getLocalizedText(row.form?.name)
        },
        {
            header: t('joinRequests.currentPhase', 'Current Phase'),
            accessor: (row) => getLocalizedText(row.current_phase?.name)
        },
        {
            header: t('joinRequests.status', 'Status'),
            accessor: (row) => {
                const localizedStatus = localizeJoinRequestStatusText(row.status_text ?? row.status, lang) || '-';
                return (<span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getJoinRequestStatusBadgeClasses(localizedStatus)}`}>
                    {localizedStatus}
                </span>)
            }
        },
        {
            header: t('joinRequests.createdAt', 'Created At'),
            cellClassName: 'whitespace-normal align-top',
            accessor: (row) => <DateCell value={row.created_at}/>
        }
    ];
}
