import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormWithValidation } from '@/utils';
import { FormSelect, FormTextarea, Button } from '@/globals/components';
import { XIcon } from '@/globals/icons';
import { useProcessJoinRequestStep } from '../hooks/useJoinRequests';
import { processStepSchema } from '../schemas/process-step.schema';
import {
    PROCESS_STEP_STATUS_OPTIONS,
    getLocalizedText,
    localizeJoinRequestStatusText
} from '../config/join-requests.config';
import { getDisplayDate } from '@/utils';
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
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</span>
            <span className="text-sm text-gray-900 break-words min-h-[1.25rem]">{value ?? '-'}</span>
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
function renderValue(value, lang) {
    if (value === null || value === undefined)
        return '-';
    if (typeof value === 'string' && value === '[object Object]')
        return '-';
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const o = value;
        if (('en' in o || 'ar' in o) && typeof o.en !== 'object' && typeof o.ar !== 'object') {
            return getLocalizedText(o, lang);
        }
        if (o.name && typeof o.name === 'object' && o.name.en !== undefined) {
            return getLocalizedText(o.name, lang);
        }
        return `(${Object.keys(o).length} fields)`;
    }
    if (Array.isArray(value)) {
        if (value.length === 0)
            return '-';
        return `(${value.length} items)`;
    }
    if (typeof value === 'boolean')
        return value ? 'Yes' : 'No';
    return String(value);
}
const ViewJoinRequestModal = ({ isOpen, request, isReadOnly = false, onClose }) => {
    const { t, i18n } = useTranslation();
    const lang = i18n.language || 'ar';
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
                            {entries.map(([key, value]) => (<DataField key={key} label={t(`joinRequests.field.${key}`, formatKey(key))} value={renderValue(value, lang)}/>))}
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

                            {isReadOnly ? (<AccordionSection title={t('joinRequests.takeAction')} defaultOpen variant="primary">
                                    <p className="text-sm text-primary-900">
                                        {t('joinRequests.readOnlyLog', 'This request has already moved past your approval queue and is now shown here as a read-only log record.')}
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
                            {!isReadOnly && (<Button type="submit" variant="primary" loading={processStepMutation.isPending}>
                                    {processStepMutation.isPending ? t('common.save') : t('joinRequests.process')}
                                </Button>)}
                        </div>
                    </form>
                </div>
            </div>
        </div>);
};
export default ViewJoinRequestModal;
