import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { Button, FormSelect, FormTextarea, ImageWithViewer } from '@/shared/components';
import { getDisplayDate, useFormWithValidation } from '@/shared/utils';
import { XIcon } from '@/shared/icons';
import { useJoinRequestDetail, useProcessJoinRequestStep } from '../hooks/useJoinRequests';
import { processStepSchema } from '../schemas/process-step.schema';
import {
    PROCESS_STEP_STATUS_OPTIONS,
    getLocalizedText,
    localizeJoinRequestStatusText
} from '../config/join-requests.config';

const SECTION_KEYS = {
    entity_info: ['name', 'registration_date', 'license_number', 'phone', 'email', 'address', 'area', 'status', 'activities'],
    location: ['branch', 'city', 'neighborhood', 'location_type'],
    program: ['main_program', 'memorization_program_entity_type', 'education_program_entity_type', 'session_mode', 'min_acceptance_age', 'activity_ids'],
    manager: ['manager'],
    facilities: ['class_count', 'management_rooms_count', 'lecture_halls_count']
};

function DataField({ label, value }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-gray-500">{label}</span>
            <div className="min-h-[1.25rem] break-words text-sm text-gray-900">{value ?? '-'}</div>
        </div>
    );
}

function AccordionSection({ title, defaultOpen, children, variant = 'default' }) {
    const [open, setOpen] = useState(Boolean(defaultOpen));
    const isPrimary = variant === 'primary';
    const headerClass = isPrimary
        ? 'flex w-full items-center justify-between gap-2 border-b border-primary-200 bg-primary-100/80 px-4 py-3 text-left hover:bg-primary-100'
        : 'flex w-full items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3 text-left hover:bg-gray-100';
    const titleClass = isPrimary ? 'text-sm font-semibold text-primary-900' : 'text-sm font-semibold text-gray-800';

    return (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <button type="button" onClick={() => setOpen((prev) => !prev)} className={headerClass} aria-expanded={open}>
                <h3 className={titleClass}>{title}</h3>
                <span className="shrink-0 text-gray-500" aria-hidden>{open ? '▼' : '▶'}</span>
            </button>
            {open ? <div className="p-4">{children}</div> : null}
        </section>
    );
}

function formatKey(key) {
    return String(key)
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

const FIELD_LABEL_TRANSLATION_KEYS = {
    has_medical_issues: 'joinRequests.field.has_medical_issues',
    medical_issues: 'joinRequests.field.medical_issues',
    qualifications: 'joinRequests.field.qualifications'
};

function normalizeFieldKey(key) {
    return String(key ?? '')
        .trim()
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .replace(/[\s-]+/g, '_')
        .toLowerCase();
}

function getFieldLabel(key, t) {
    const normalizedKey = normalizeFieldKey(key);
    const translationKey = FIELD_LABEL_TRANSLATION_KEYS[normalizedKey] ?? `joinRequests.field.${normalizedKey || key}`;

    return t(translationKey, formatKey(normalizedKey || key));
}

function normalizeStatusToken(value) {
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

function isTerminalJoinRequestStatus(value) {
    const normalized = normalizeStatusToken(value);

    if (!normalized) {
        return false;
    }

    return (
        normalized.includes('approved') ||
        normalized.includes('accepted') ||
        normalized.includes('rejected') ||
        normalized.includes('declined') ||
        normalized.includes('مرفوض') ||
        normalized.includes('مقبول') ||
        normalized.includes('تم القبول') ||
        normalized.includes('تم الرفض')
    );
}

function isLocalizedLeafObject(value) {
    return Boolean(
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        ('en' in value || 'ar' in value) &&
        typeof value.en !== 'object' &&
        typeof value.ar !== 'object'
    );
}

function isAttachmentKey(key = '') {
    const normalizedKey = String(key).toLowerCase();
    return normalizedKey.includes('file') || normalizedKey.includes('attachment') || normalizedKey.includes('document');
}

function getAttachmentUrl(file) {
    if (typeof file === 'string') {
        return /^https?:\/\//i.test(file) || file.startsWith('/') ? file : null;
    }

    if (!file || typeof file !== 'object') {
        return null;
    }

    return file.url ?? file.file_url ?? file.download_url ?? file.path ?? file.full_url ?? null;
}

function getAttachmentName(file, index, lang) {
    if (typeof file === 'string') {
        if (/^https?:\/\//i.test(file) || file.startsWith('/')) {
            const parts = file.split('/');
            return parts[parts.length - 1] || (lang === 'ar' ? `ملف ${index + 1}` : `File ${index + 1}`);
        }

        return file;
    }

    if (!file || typeof file !== 'object') {
        return lang === 'ar' ? `ملف ${index + 1}` : `File ${index + 1}`;
    }

    const attachmentUrl = getAttachmentUrl(file);
    if (attachmentUrl) {
        const parts = attachmentUrl.split('/');
        const fileNameFromUrl = parts[parts.length - 1];
        if (fileNameFromUrl) {
            return fileNameFromUrl;
        }
    }

    return file.name ??
        file.file_name ??
        file.original_name ??
        file.title ??
        file.label ??
        file.id ??
        (lang === 'ar' ? `ملف ${index + 1}` : `File ${index + 1}`);
}

function normalizeAttachmentEntries(value) {
    if (value == null) {
        return [];
    }

    if (Array.isArray(value)) {
        return value;
    }

    if (typeof value === 'string') {
        const trimmedValue = value.trim();

        if (!trimmedValue) {
            return [];
        }

        if (/^https?:\/\//i.test(trimmedValue) || trimmedValue.startsWith('/')) {
            return [trimmedValue];
        }

        if (/^\d+(?:\.\d+)+$/.test(trimmedValue)) {
            return trimmedValue.split('.').filter(Boolean);
        }

        const splitValues = trimmedValue
            .split(/[\n,،;|]+/)
            .map((item) => item.trim())
            .filter(Boolean);

        return splitValues.length > 1 ? splitValues : [trimmedValue];
    }

    if (typeof value === 'object') {
        if (Array.isArray(value.files)) {
            return value.files;
        }

        if (Array.isArray(value.attachments)) {
            return value.attachments;
        }

        if (getAttachmentUrl(value) || value.name || value.file_name || value.original_name) {
            return [value];
        }
    }

    return [];
}

function hasAttachmentUrls(value) {
    return normalizeAttachmentEntries(value).some((item) => Boolean(getAttachmentUrl(item)));
}

function isImageAttachment(url = '') {
    return /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url);
}

function getActorName(user, lang) {
    if (!user) {
        return '-';
    }

    if (typeof user.name === 'string') {
        return user.name;
    }

    if (user.name && typeof user.name === 'object') {
        return getLocalizedText(user.name, lang);
    }

    return '-';
}

function formatLogCreatedAt(value, lang) {
    if (!value) {
        return '-';
    }

    if (typeof value === 'string') {
        return getDisplayDate(value);
    }

    if (typeof value === 'object') {
        if (lang === 'ar') {
            return value.hijri_indic ?? value.hijri ?? value.gregorian ?? '-';
        }

        return value.gregorian ?? value.hijri ?? value.hijri_indic ?? '-';
    }

    return String(value);
}

function getLogAttachments(log) {
    const primaryFiles = normalizeAttachmentEntries(log?.files);
    const additionalFiles = normalizeAttachmentEntries(log?.meta?.additional_files);
    return [...primaryFiles, ...additionalFiles];
}

function renderAttachments(value, lang) {
    const attachments = normalizeAttachmentEntries(value);

    if (attachments.length === 0) {
        return '-';
    }

    return (
        <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => {
                const url = getAttachmentUrl(file);
                const name = getAttachmentName(file, index, lang);

                if (url) {
                    return (
                        <div
                            key={`${name}-${index}`}
                            className="flex items-center gap-2 rounded-xl border border-primary-100 bg-primary-50 px-2 py-2"
                        >
                            {isImageAttachment(url) ? (
                                <ImageWithViewer
                                    src={url}
                                    alt={name}
                                    imgClassName="h-10 w-10 rounded-lg object-cover"
                                    className="shrink-0"
                                />
                            ) : null}
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-medium text-primary-700 hover:text-primary-800 hover:underline"
                            >
                                {name}
                            </a>
                        </div>
                    );
                }

                return (
                    <span
                        key={`${name}-${index}`}
                        className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                    >
                        {name}
                    </span>
                );
            })}
        </div>
    );
}

function renderValue(value, lang, t, fieldKey = '', depth = 0) {
    if (value === null || value === undefined) {
        return '-';
    }

    if (isAttachmentKey(fieldKey)) {
        return renderAttachments(value, lang);
    }

    if (typeof value === 'string') {
        return value === '[object Object]' ? '-' : value;
    }

    if (typeof value === 'number' || typeof value === 'bigint') {
        return String(value);
    }

    if (typeof value === 'boolean') {
        return lang === 'ar' ? (value ? 'نعم' : 'لا') : (value ? 'Yes' : 'No');
    }

    if (Array.isArray(value)) {
        if (value.length === 0) {
            return '-';
        }

        const allPrimitive = value.every((item) => item == null || ['string', 'number', 'boolean'].includes(typeof item));

        if (allPrimitive) {
            return value.map((item) => renderValue(item, lang, t, fieldKey, depth + 1)).join('، ');
        }

        return (
            <div className="space-y-2">
                {value.map((item, index) => (
                    <div key={`${index}-${typeof item}`} className="border-s border-slate-200 ps-3">
                        <div className="mb-1 text-xs font-medium text-slate-500">
                            {lang === 'ar' ? `عنصر ${index + 1}` : `Item ${index + 1}`}
                        </div>
                        <div className="text-sm text-slate-900">{renderValue(item, lang, t, fieldKey, depth + 1)}</div>
                    </div>
                ))}
            </div>
        );
    }

    if (typeof value === 'object') {
        if (isLocalizedLeafObject(value)) {
            return getLocalizedText(value, lang);
        }

        if (value.name && isLocalizedLeafObject(value.name)) {
            return getLocalizedText(value.name, lang);
        }

        const entries = Object.entries(value).filter(([, nestedValue]) => nestedValue !== undefined);

        if (entries.length === 0) {
            return '-';
        }

        return (
            <div className="space-y-2">
                {entries.map(([nestedKey, nestedValue]) => (
                    <div key={nestedKey} className="border-s border-slate-200 ps-3">
                        <div className="mb-1 text-xs font-medium text-slate-500">
                            {getFieldLabel(nestedKey, t)}
                        </div>
                        <div className="break-words text-sm text-slate-900">
                            {renderValue(nestedValue, lang, t, nestedKey, depth + 1)}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return String(value);
}

const ViewJoinRequestModal = ({ isOpen, request, isReadOnly = false, onClose }) => {
    const { t, i18n } = useTranslation();
    const lang = i18n.language || 'ar';
    const isArabic = lang === 'ar';
    const copy = (arabicText, englishText) => (isArabic ? arabicText : englishText);
    const processStepMutation = useProcessJoinRequestStep();
    const hasInlineDetails = Boolean(
        request &&
        (
            (request.submitted_data && typeof request.submitted_data === 'object') ||
            (Array.isArray(request.submitted_fields) && request.submitted_fields.length > 0) ||
            (Array.isArray(request.logs) && request.logs.length > 0) ||
            (Array.isArray(request.files) && request.files.length > 0)
        )
    );
    const detailQuery = useJoinRequestDetail(request?.id, {
        enabled: isOpen && Boolean(request?.id) && !hasInlineDetails
    });

    const {
        control,
        handleSubmit,
        formState: { errors },
        reset
    } = useFormWithValidation({
        schema: processStepSchema,
        defaultValues: { status: '', notes: '', files: null }
    });

    const statusOptions = PROCESS_STEP_STATUS_OPTIONS.map((option) => ({
        value: option.value,
        label: t(option.labelKey)
    }));

    const handleSubmitForm = (data) => {
        if (shouldDisableActions) {
            toast.info(
                isProcessedByCurrentUser
                    ? copy(
                        'لقد قمت باتخاذ إجراء على هذا الطلب بالفعل، لذلك لا يمكن تنفيذ إجراء جديد عليه.',
                        'You already processed this request, so no further action is available.'
                    )
                    : isFinalizedRequest
                        ? t(
                            'joinRequests.finalizedLog',
                            'This join request has already reached a final state such as approved or rejected, so it cannot be processed again.'
                        )
                        : t(
                            'joinRequests.readOnlyLog',
                            'This request has already moved past your approval queue and is now shown here as a read-only log record.'
                        )
            );
            return;
        }

        if (!request?.id) {
            return;
        }

        processStepMutation.mutate(
            {
                id: request.id,
                data: {
                    status: data.status,
                    notes: data.notes || null,
                    files: data.files
                }
            },
            {
                onSuccess: () => {
                    toast.success(t('joinRequests.processSuccess'));
                    reset();
                    onClose();
                },
                onError: (error) => {
                    toast.error(error?.message || t('common.error'));
                }
            }
        );
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    if (!isOpen) {
        return null;
    }

    if (!request) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
                <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                    <p className="text-gray-600">{t('joinRequests.notFound')}</p>
                    <Button type="button" variant="outline" onClick={handleClose} className="mt-4">
                        {t('common.close')}
                    </Button>
                </div>
            </div>
        );
    }

    const activeRequest = detailQuery.request ?? request;
    const isProcessedByCurrentUser = Boolean(activeRequest?.processed_by_you);
    const isFinalizedRequest = [
        activeRequest?.status,
        activeRequest?.status_text,
        activeRequest?.request_status,
        activeRequest?.last_status
    ].some(isTerminalJoinRequestStatus);
    const shouldDisableActions = isReadOnly || isProcessedByCurrentUser || isFinalizedRequest;
    const requestTypeName = getLocalizedText(activeRequest.request_type?.name, lang);
    const formName = getLocalizedText(activeRequest.form?.name, lang);
    const phaseName = getLocalizedText(activeRequest.current_phase?.name, lang);
    const localizedStatus = localizeJoinRequestStatusText(activeRequest.status_text ?? activeRequest.status, lang) || '-';
    const detailFiles = hasAttachmentUrls(activeRequest.files) ? activeRequest.files : null;
    const logs = Array.isArray(activeRequest.logs) ? activeRequest.logs : [];
    const submittedData = activeRequest.submitted_data && typeof activeRequest.submitted_data === 'object'
        ? {
            ...activeRequest.submitted_data,
            ...(detailFiles != null ? { files: detailFiles } : {})
        }
        : detailFiles != null
            ? { files: detailFiles }
            : activeRequest.submitted_data;

    const renderSubmittedSections = () => {
        if (!submittedData || typeof submittedData !== 'object') {
            return null;
        }

        const sections = [];
        const usedKeys = new Set();

        Object.entries(SECTION_KEYS).forEach(([sectionId, keys]) => {
            const entries = keys
                .filter((key) => submittedData[key] != null && !(Array.isArray(submittedData[key]) && submittedData[key].length === 0))
                .map((key) => {
                    usedKeys.add(key);
                    return [key, submittedData[key]];
                });

            if (entries.length > 0) {
                sections.push({ id: sectionId, titleKey: `joinRequests.section_${sectionId}`, entries });
            }
        });

        const otherKeys = Object.keys(submittedData).filter(
            (key) =>
                !usedKeys.has(key) &&
                key !== 'id' &&
                key !== 'created_at' &&
                key !== 'updated_at' &&
                key !== 'code' &&
                key !== 'latitude' &&
                key !== 'longitude'
        );

        if (otherKeys.length > 0) {
            sections.push({
                id: 'other',
                titleKey: 'joinRequests.section_other',
                entries: otherKeys.map((key) => [key, submittedData[key]])
            });
        }

        return (
            <div className="space-y-4">
                {sections.map(({ id, titleKey, entries }) => (
                    <AccordionSection key={id} title={t(titleKey)} defaultOpen={id === 'entity_info'}>
                        <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
                            {entries.map(([key, value]) => (
                                <DataField
                                    key={key}
                                    label={getFieldLabel(key, t)}
                                    value={renderValue(value, lang, t, key)}
                                />
                            ))}
                        </div>
                    </AccordionSection>
                ))}
            </div>
        );
    };

    const renderLogsSection = () => {
        if (logs.length === 0) {
            return null;
        }

        return (
            <AccordionSection title={t('joinRequests.logs', 'سجل الإجراءات')} defaultOpen>
                <div className="space-y-4">
                    {logs.map((log, index) => {
                        const logStatus = localizeJoinRequestStatusText(log?.status, lang) || '-';
                        const logStepName = typeof log?.step?.name === 'string'
                            ? log.step.name
                            : getLocalizedText(log?.step?.name, lang);
                        const actorName = getActorName(log?.user, lang);
                        const logAttachments = getLogAttachments(log);

                        return (
                            <div
                                key={log?.id ?? `${logStepName}-${index}`}
                                className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4"
                            >
                                <div className="mb-3 flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-800">
                                        {logStepName || t('joinRequests.currentPhase', 'Current Phase')}
                                    </span>
                                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700">
                                        {logStatus}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                                    <DataField
                                        label={t('joinRequests.logActor', 'تم بواسطة')}
                                        value={actorName}
                                    />
                                    <DataField
                                        label={t('joinRequests.logDate', 'تاريخ الإجراء')}
                                        value={formatLogCreatedAt(log?.created_at, lang)}
                                    />
                                    <DataField
                                        label={t('joinRequests.notes', 'ملاحظات')}
                                        value={log?.notes || '-'}
                                    />
                                    <DataField
                                        label={t('joinRequests.logFiles', 'مرفقات الإجراء')}
                                        value={renderAttachments(logAttachments, lang)}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </AccordionSection>
        );
    };

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
            <div className="fixed inset-0 bg-black/75" onClick={handleClose} aria-hidden />

            <div className="relative z-10 flex min-h-full items-center justify-center p-4 pt-20 md:pt-24">
                <div className="relative max-h-[calc(100vh-5rem)] w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 p-6">
                        <h2 className="text-xl font-semibold text-gray-900">{t('joinRequests.view')}</h2>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="rounded-lg p-2 text-gray-400 hover:bg-white hover:text-gray-600"
                            aria-label={t('common.close')}
                        >
                            <XIcon width={24} height={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit(handleSubmitForm)} className="flex max-h-[calc(100vh-8rem)] flex-col">
                        <div className="flex-1 space-y-6 overflow-y-auto p-6">
                            <AccordionSection title={t('joinRequests.requestInfo')} defaultOpen>
                                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                                    <DataField label={t('joinRequests.requestType')} value={requestTypeName} />
                                    <DataField label={t('joinRequests.form')} value={formName} />
                                    <DataField label={t('joinRequests.currentPhase')} value={phaseName} />
                                    <DataField label={t('joinRequests.status')} value={localizedStatus} />
                                    <DataField label={t('joinRequests.createdAt')} value={getDisplayDate(activeRequest.created_at)} />
                                </div>
                            </AccordionSection>

                            {detailQuery.isLoading ? (
                                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                                    {t('common.loading', 'Loading...')}
                                </div>
                            ) : null}

                            {detailQuery.error && !hasInlineDetails ? (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                                    {detailQuery.error?.message || t('joinRequests.detailLoadFallback', 'Unable to load full request details, showing available list data.')}
                                </div>
                            ) : null}

                            {submittedData ? (
                                <>
                                    <h3 className="text-base font-semibold text-gray-800">{t('joinRequests.submittedData')}</h3>
                                    {renderSubmittedSections()}
                                </>
                            ) : null}

                            {renderLogsSection()}

                            {shouldDisableActions ? (
                                <AccordionSection title={t('joinRequests.takeAction')} defaultOpen variant="primary">
                                    <p className="text-sm text-primary-900">
                                        {isProcessedByCurrentUser
                                            ? copy(
                                                'لقد قمت باتخاذ إجراء على هذا الطلب بالفعل، لذلك لا يمكن تنفيذ إجراء جديد عليه.',
                                                'You already processed this request, so no further action is available.'
                                            )
                                            : isFinalizedRequest
                                                ? t(
                                                    'joinRequests.finalizedLog',
                                                    'This join request has already reached a final state such as approved or rejected, so it cannot be processed again.'
                                                )
                                            : t(
                                                'joinRequests.readOnlyLog',
                                                'This request has already moved past your approval queue and is now shown here as a read-only log record.'
                                            )}
                                    </p>
                                </AccordionSection>
                            ) : (
                                <AccordionSection title={t('joinRequests.takeAction')} defaultOpen variant="primary">
                                    <p className="mb-4 text-xs text-primary-700">{t('joinRequests.processStepHint')}</p>
                                    <div className="space-y-4">
                                        <FormSelect
                                            name="status"
                                            label={t('joinRequests.statusLabel')}
                                            control={control}
                                            options={statusOptions}
                                            error={errors.status?.message}
                                            required
                                        />
                                        <FormTextarea
                                            name="notes"
                                            label={t('joinRequests.notes')}
                                            control={control}
                                            error={errors.notes?.message}
                                        />
                                    </div>
                                </AccordionSection>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 p-6">
                            <Button type="button" variant="outline" onClick={handleClose}>
                                {t('common.cancel')}
                            </Button>
                            {!shouldDisableActions ? (
                                <Button type="submit" variant="primary" loading={processStepMutation.isPending}>
                                    {processStepMutation.isPending ? t('common.save') : t('joinRequests.process')}
                                </Button>
                            ) : null}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ViewJoinRequestModal;
