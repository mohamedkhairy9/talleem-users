import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormWithValidation } from '@/shared/utils';
import { FormSelect, FormTextarea, Button } from '@/shared/components';
import { XIcon } from '@/shared/icons';
import { useProcessJoinRequestStep } from '../hooks/useJoinRequests';
import { processStepSchema } from '../schemas/process-step.schema';
import {
    PROCESS_STEP_STATUS_OPTIONS,
    getLocalizedText,
    localizeJoinRequestStatusText
} from '../config/join-requests.config';
import { getDisplayDate } from '@/shared/utils';
import { toast } from 'react-toastify';
const SECTION_KEYS = {
    entity_info: ['name', 'registration_date', 'license_number', 'phone', 'email', 'address', 'area', 'status', 'activities'],
    location: ['branch', 'city', 'neighborhood', 'location_type'],
    program: ['main_program', 'memorization_program_entity_type', 'education_program_entity_type', 'session_mode', 'min_acceptance_age', 'activity_ids'],
    manager: ['manager'],
    facilities: ['class_count', 'management_rooms_count', 'lecture_halls_count']
};
function DataField({ label, value }) {
    return (<div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-gray-500">{label}</span>
            <div className="text-sm text-gray-900 break-words min-h-[1.25rem]">{value ?? '-'}</div>
        </div>);
}
function AccordionSection({ title, defaultOpen, children, variant = 'default' }) {
    const [open, setOpen] = useState(!!defaultOpen);
    const isPrimary = variant === 'primary';
    const headerClass = isPrimary
        ? 'w-full px-4 py-3 bg-primary-100/80 border-b border-primary-200 flex items-center justify-between gap-2 text-left hover:bg-primary-100'
        : 'w-full px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-2 text-left hover:bg-gray-100';
    const titleClass = isPrimary ? 'text-sm font-semibold text-primary-900' : 'text-sm font-semibold text-gray-800';
    return (<section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <button type="button" onClick={() => setOpen((prev) => !prev)} className={headerClass} aria-expanded={open}>
                <h3 className={titleClass}>{title}</h3>
                <span className="text-gray-500 shrink-0" aria-hidden>{open ? '▼' : '▶'}</span>
            </button>
            {open && <div className="p-4">{children}</div>}
        </section>);
}
function formatKey(key) {
    return key.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
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
function renderValue(value, lang, t, depth = 0) {
    if (value === null || value === undefined) {
        return '-';
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
            return value.map((item) => renderValue(item, lang, t, depth + 1)).join('، ');
        }
        return (
            <div className="space-y-2">
                {value.map((item, index) => (
                    <div key={`${index}-${typeof item}`} className="border-s border-slate-200 ps-3">
                        <div className="mb-1 text-xs font-medium text-slate-500">
                            {lang === 'ar' ? `عنصر ${index + 1}` : `Item ${index + 1}`}
                        </div>
                        <div className="text-sm text-slate-900">{renderValue(item, lang, t, depth + 1)}</div>
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
                            {t(`joinRequests.field.${nestedKey}`, formatKey(nestedKey))}
                        </div>
                        <div className="text-sm text-slate-900 break-words">
                            {renderValue(nestedValue, lang, t, depth + 1)}
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
    const isProcessedByYou = Boolean(request?.processed_by_you);
    const shouldDisableActions = isReadOnly || isProcessedByYou;
    const processStepMutation = useProcessJoinRequestStep();
    const { control, handleSubmit, formState: { errors }, reset } = useFormWithValidation({
        schema: processStepSchema,
        defaultValues: { status: '', notes: '', files: null }
    });
    const statusOptions = PROCESS_STEP_STATUS_OPTIONS.map((opt) => ({
        value: opt.value,
        label: t(opt.labelKey)
    }));
    const onSubmit = (data) => {
        if (shouldDisableActions) {
            toast.info(copy('لقد قمت باتخاذ إجراء على هذا الطلب بالفعل، لذلك لا يمكن تنفيذ إجراء جديد عليه.', 'You already processed this request, so no further action is available.'));
            return;
        }
        if (!request?.id)
            return;
        processStepMutation.mutate({ id: request.id, data: { status: data.status, notes: data.notes || null, files: data.files } }, {
            onSuccess: () => {
                toast.success(t('joinRequests.processSuccess'));
                reset();
                onClose();
            },
            onError: (err) => {
                toast.error(err?.message || t('common.error'));
            }
        });
    };
    const handleClose = () => {
        reset();
        onClose();
    };
    if (!isOpen)
        return null;
    if (!request) {
        return (<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
                <div className="bg-white rounded-xl p-6 shadow-xl max-w-md w-full mx-4">
                    <p className="text-gray-600">{t('joinRequests.notFound')}</p>
                    <Button type="button" variant="outline" onClick={handleClose} className="mt-4">
                        {t('common.close')}
                    </Button>
                </div>
            </div>);
    }
    const requestTypeName = getLocalizedText(request.request_type?.name, lang);
    const formName = getLocalizedText(request.form?.name, lang);
    const phaseName = getLocalizedText(request.current_phase?.name, lang);
    const localizedStatus = localizeJoinRequestStatusText(request.status_text ?? request.status, lang) || '-';
    const submittedData = request.submitted_data;
    const renderSubmittedSections = () => {
        if (!submittedData || typeof submittedData !== 'object')
            return null;
        const sections = [];
        const usedKeys = new Set();
        Object.entries(SECTION_KEYS).forEach(([sectionId, keys]) => {
            const entries = keys
                .filter((k) => submittedData[k] != null && !(Array.isArray(submittedData[k]) && submittedData[k].length === 0))
                .map((k) => {
                usedKeys.add(k);
                return [k, submittedData[k]];
            });
            if (entries.length > 0) {
                sections.push({ id: sectionId, titleKey: `joinRequests.section_${sectionId}`, entries });
            }
        });
        const otherKeys = Object.keys(submittedData).filter((k) => !usedKeys.has(k) && k !== 'id' && k !== 'created_at' && k !== 'updated_at' && k !== 'code' && k !== 'latitude' && k !== 'longitude');
        if (otherKeys.length > 0) {
            sections.push({
                id: 'other',
                titleKey: 'joinRequests.section_other',
                entries: otherKeys.map((k) => [k, submittedData[k]])
            });
        }
        return (<div className="space-y-4">
                {sections.map(({ id, titleKey, entries }) => (<AccordionSection key={id} title={t(titleKey)} defaultOpen={id === 'entity_info'}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            {entries.map(([key, value]) => (<DataField key={key} label={t(`joinRequests.field.${key}`, formatKey(key))} value={renderValue(value, lang, t)}/>))}
                        </div>
                    </AccordionSection>))}
            </div>);
    };
    return (<div className="fixed inset-0 z-[60] overflow-y-auto">
            <div className="fixed inset-0 bg-black/75" onClick={handleClose} aria-hidden/>
            <div className="relative flex min-h-full items-center justify-center p-4 pt-20 md:pt-24 z-10">
                <div className="relative bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[calc(100vh-5rem)] overflow-hidden">
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-xl font-semibold text-gray-900">{t('joinRequests.view')}</h2>
                        <button type="button" onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg" aria-label={t('common.close')}>
                            <XIcon width={24} height={24}/>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col max-h-[calc(100vh-8rem)]">
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            <AccordionSection title={t('joinRequests.requestInfo')} defaultOpen>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                                    <DataField label={t('joinRequests.requestType')} value={requestTypeName}/>
                                    <DataField label={t('joinRequests.form')} value={formName}/>
                                    <DataField label={t('joinRequests.currentPhase')} value={phaseName}/>
                                    <DataField label={t('joinRequests.status')} value={localizedStatus}/>
                                    <DataField label={t('joinRequests.createdAt')} value={getDisplayDate(request.created_at)}/>
                                </div>
                            </AccordionSection>

                            {submittedData && (<>
                                    <h3 className="text-base font-semibold text-gray-800">{t('joinRequests.submittedData')}</h3>
                                    {renderSubmittedSections()}
                                </>)}

                            {shouldDisableActions ? (<AccordionSection title={t('joinRequests.takeAction')} defaultOpen variant="primary">
                                    <p className="text-sm text-primary-900">
                                        {isProcessedByYou
                                            ? copy('لقد قمت باتخاذ إجراء على هذا الطلب بالفعل، لذلك لا يمكن تنفيذ إجراء جديد عليه.', 'You already processed this request, so no further action is available.')
                                            : t('joinRequests.readOnlyLog', 'This request has already moved past your approval queue and is now shown here as a read-only log record.')}
                                    </p>
                                </AccordionSection>) : (<AccordionSection title={t('joinRequests.takeAction')} defaultOpen variant="primary">
                                    <p className="text-xs text-primary-700 mb-4">{t('joinRequests.processStepHint')}</p>
                                    <div className="space-y-4">
                                        <FormSelect name="status" label={t('joinRequests.statusLabel')} control={control} options={statusOptions} error={errors.status?.message} required/>
                                        <FormTextarea name="notes" label={t('joinRequests.notes')} control={control} error={errors.notes?.message}/>
                                        {/* Optional: file input can be added via FormInput type="file" if needed */}
                                    </div>
                                </AccordionSection>)}
                        </div>

                        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                            <Button type="button" variant="outline" onClick={handleClose}>
                                {t('common.cancel')}
                            </Button>
                            {!shouldDisableActions && (<Button type="submit" variant="primary" loading={processStepMutation.isPending}>
                                    {processStepMutation.isPending ? t('common.save') : t('joinRequests.process')}
                                </Button>)}
                        </div>
                    </form>
                </div>
            </div>
        </div>);
};
export default ViewJoinRequestModal;
