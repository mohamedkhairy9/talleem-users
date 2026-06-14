import React, { useEffect, useMemo } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useFormWithValidation } from '@/shared/utils';
import { FormInput, FormSelect, FormTextarea, Button } from '@/shared/components';
import SelectRFH from '@/shared/components/ui/SelectRFH';
import { XIcon, EyeIcon, EditIcon } from '@/shared/icons';
import { useWarning, useUpdateWarning, useWarningReasons } from '../hooks';
import { createWarningSchema } from '../schemas';
import { toast } from 'react-toastify';
import { useAuthStore } from '@/app/stores';
import { createStudentsLoader, createTeachersLoader } from '../utils';
import { getDisplayDate, getGregorianDate, normalizeDate } from '@/shared/utils';
import { useDateFormatStore } from '@/app/stores';
import { WARNING_FORM_TYPES } from '../config';

const extractCollectionItems = (response) => {
    if (Array.isArray(response?.data)) {
        return response.data;
    }
    if (Array.isArray(response?.items)) {
        return response.items;
    }
    if (Array.isArray(response?.data?.items)) {
        return response.data.items;
    }
    if (Array.isArray(response)) {
        return response;
    }
    return [];
};
/**
 * Warning View/Edit Modal Component
 * Allows viewing and editing warnings
 */
const WarningViewEditModal = ({ isOpen, warningId, warningData: initialWarningData, onClose, mode: initialMode = 'view' }) => {
    const { t, i18n } = useTranslation();
    useDateFormatStore((s) => s.dateFormat); // re-render when date format changes
    const [mode, setMode] = React.useState(initialMode);
    const updateWarningMutation = useUpdateWarning();
    const entity = useAuthStore((s) => s.user?.entity);
    // Fetch warning data
    const shouldFetchWarning = mode === 'edit' && !!warningId;
    const { data: fetchedWarningData, isLoading: isLoadingWarning } = useWarning(warningId, {
        enabled: shouldFetchWarning
    });
    // Axios interceptor returns response.data, so fetchedWarningData = { data: WarningResponse }
    const fetchedWarning = fetchedWarningData?.data || fetchedWarningData;
    const warning = mode === 'view'
        ? initialWarningData
        : (fetchedWarning || initialWarningData);
    // Extract entity data
    const branchId = entity?.branch?.id ?? entity?.branch_id ?? null;
    const mainProgramId = entity?.main_program?.id ?? entity?.main_program_id ?? null;
    const programId = entity?.program?.id ?? entity?.program_id ?? mainProgramId ?? null;
    const entityId = entity?.id ?? null;
    const warningReasonProgramId = mainProgramId ?? programId;
    const { control, handleSubmit, formState: { errors }, setValue, reset } = useFormWithValidation({
        schema: createWarningSchema,
        defaultValues: {
            warning_type: 'student',
            student_id: null,
            teacher_id: null,
            warning_reason_id: 0,
            date: new Date().toISOString().split('T')[0],
            note: '',
            status: true
        }
    });
    // Populate form when warning data is loaded
    useEffect(() => {
        if (warning && mode === 'edit') {
            const normalizedDate = normalizeDate(getGregorianDate(warning.date));
            setValue('warning_type', warning.warning_type);
            setValue('warning_reason_id', warning.warning_reason?.id || 0);
            setValue('date', /^\d{4}-\d{2}-\d{2}$/.test(normalizedDate) ? normalizedDate : new Date().toISOString().split('T')[0]);
            setValue('note', warning.note || warning.notes || '');
            setValue('status', warning.status ?? true);
            // Set target ID based on warning type
            if (warning.warning_type === 'student' && warning.student?.id) {
                setValue('student_id', warning.student.id);
            }
            else if (warning.warning_type === 'teacher' && warning.teacher?.id) {
                setValue('teacher_id', warning.teacher.id);
            }
        }
    }, [warning, mode, setValue]);
    const warningType = useWatch({ control, name: 'warning_type' });
    // Create async loaders
    const studentsLoader = useMemo(() => createStudentsLoader(branchId, warningReasonProgramId, entityId), [branchId, warningReasonProgramId, entityId]);
    const teachersLoader = useMemo(() => createTeachersLoader(branchId, warningReasonProgramId, entityId), [branchId, warningReasonProgramId, entityId]);
    // Fetch warning reasons
    const { data: warningReasonsData, isLoading: isLoadingReasons } =
        useWarningReasons();    // Transform warning reasons to options
    const warningReasonOptions = useMemo(() => {
        const reasons = extractCollectionItems(warningReasonsData);
        const currentLang = i18n.language || 'ar';
        return reasons.map((reason) => ({
            value: reason.id,
            label: typeof reason.name === 'string'
                ? reason.name
                : currentLang === 'ar' && reason.name?.ar
                    ? reason.name.ar
                    : (reason.name?.en || '')
        }));
    }, [warningReasonsData, i18n.language]);
    // Warning type options
    const warningTypeOptions = useMemo(() => WARNING_FORM_TYPES.map(type => ({
        value: type.value,
        label: t(type.labelKey, type.value)
    })), [t]);
    const getLocalizedText = (obj) => {
        if (typeof obj === 'string')
            return obj;
        if (!obj)
            return t('common.not_available', 'N/A');
        const currentLang = i18n.language || 'ar';
        if (currentLang === 'ar' && obj.ar)
            return obj.ar;
        if (obj.en)
            return obj.en;
        return t('common.not_available', 'N/A');
    };
    const supportsEdit = warning?.warning_type === 'student' || warning?.warning_type === 'teacher';
    /**
     * Build payload with only relevant target ID based on warning type
     */
    // const buildPayload = (data) => {
    //     const payload = {
    //         warning_reason_id: data.warning_reason_id,
    //         warning_type: data.warning_type,
    //         date: normalizeDate(data.date),
    //         note: data.note?.trim() || undefined,
    //         status: data.status
    //     };
    //     // Add only the relevant target ID
    //     switch (data.warning_type) {
    //         case 'student':
    //             if (data.student_id) {
    //                 payload.student_id = data.student_id;
    //             }
    //             break;
    //         case 'teacher':
    //             if (data.teacher_id)
    //                 payload.teacher_id = data.teacher_id;
    //             break;
    //     }
    //     return payload;
    // };
    const buildPayload = (data) => {
        const payload = {
            note: data.note?.trim() || '',
            status: data.status
        };

        console.log('UPDATE PAYLOAD:', payload);

        return payload;
    };
    // const onSubmit = async (data) => {
    //     if (!warningId) {
    //         toast.error(t('warning.missingEntityData'));
    //         return;
    //     }
    //     const payload = buildPayload(data);
    //     updateWarningMutation.mutate({ id: warningId, data: payload }, {
    //         onSuccess: () => {
    //             toast.success(t('warning.updateSuccess'));
    //             setMode('view');
    //             onClose();
    //         },
    //         onError: (error) => {
    //             const errorMessage = error?.response?.data?.message ||
    //                 error?.message ||
    //                 t('warning.updateError');
    //             toast.error(errorMessage);
    //         }
    //     });
    // };
    const onSubmit = async (data) => {
        if (!warningId) {
            toast.error(t('warning.missingEntityData'));
            return;
        }

        const payload = buildPayload(data);

        console.log('UPDATE WARNING ID:', warningId);
        console.log('FINAL UPDATE PAYLOAD:', payload);

        updateWarningMutation.mutate(
            { id: warningId, data: payload },
            {
                onSuccess: () => {
                    toast.success(t('warning.updateSuccess'));
                    setMode('view');
                    onClose();
                },
                onError: (error) => {
                    console.log('UPDATE ERROR:', error);
                    console.log('UPDATE ERROR DATA:', error?.response?.data);

                    const errorMessage =
                        error?.response?.data?.message ||
                        error?.message ||
                        t('warning.updateError');

                    toast.error(errorMessage);
                }
            }
        );
    };
    const handleClose = () => {
        setMode('view');
        reset();
        onClose();
    };
    useEffect(() => {
        if (isOpen) {
            setMode(initialMode);
        }
    }, [initialMode, isOpen]);
    if (!isOpen)
        return null;
    const isStudentContextMissing = !branchId || !programId || !entityId;
    const isReasonContextMissing = !warningReasonProgramId;
    const isTargetFieldDisabled = isReasonContextMissing || mode === 'view';
    return (<div className="fixed inset-0 z-[60] overflow-y-auto">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black transition-opacity" style={{ opacity: 0.75 }} onClick={handleClose} aria-hidden="true" />

        {/* Modal */}
        <div className="relative flex min-h-full items-center justify-center p-4 pt-20 md:pt-24 z-10">
            <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[calc(100vh-5rem)] md:max-h-[calc(100vh-6rem)] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                    <div className="flex items-center gap-3">
                        {mode === 'view' ? (<EyeIcon width={24} height={24} className="text-indigo-600" />) : (<EditIcon width={24} height={24} className="text-indigo-600" />)}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                {mode === 'view'
                                    ? t('warning.viewWarning')
                                    : t('warning.editWarning')}
                            </h2>
                        </div>
                    </div>
                    <button type="button" onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors" aria-label={t('common.close', 'Close')}>
                        <XIcon width={24} height={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(100vh-12rem)] md:max-h-[calc(100vh-14rem)]">
                    {isLoadingWarning ? (<div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>) : !warning ? (<div className="text-center py-12 text-red-600">
                        {t('warning.notFound')}
                    </div>) : mode === 'view' ? (
                        // View Mode
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">
                                        {t('warning.date', 'Date')}
                                    </label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {getDisplayDate(warning.date)}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">
                                        {t('warning.warningType', 'Warning Type')}
                                    </label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {String(t(`warning.type.${warning.warning_type}`, warning.warning_type))}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">
                                        {t('warning.branch', 'Branch')}
                                    </label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {getLocalizedText(warning.branch?.name)}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">
                                        {t('warning.program', 'Program')}
                                    </label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {getLocalizedText(warning.program?.name)}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">
                                        {t('warning.target', 'Target')}
                                    </label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {warning.warning_type === 'student' && warning.student
                                            ? getLocalizedText(warning.student.name)
                                            : warning.warning_type === 'teacher' && warning.teacher
                                                ? getLocalizedText(warning.teacher.name)
                                                : warning.warning_type === 'entity' && warning.entity
                                                    ? getLocalizedText(warning.entity.name)
                                                    : '-'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">
                                        {t('warning.warningReason', 'Warning Reason')}
                                    </label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {getLocalizedText(warning.warning_reason?.name)}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">
                                        {t('warning.status', 'Status')}
                                    </label>
                                    <p className="mt-1">
                                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${warning.status
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'}`}>
                                            {warning.status ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">
                                        {t('warning.createdBy')}
                                    </label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {getLocalizedText(warning.created_by?.name)}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">
                                    {t('warning.note', 'Note')}
                                </label>
                                <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                                    {warning.note || warning.notes || '-'}
                                </p>
                            </div>
                            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                                {supportsEdit && (<Button type="button" variant="primary" onClick={() => setMode('edit')}>
                                    <EditIcon width={16} height={16} className="me-2" />
                                    {t('common.edit', 'Edit')}
                                </Button>)}
                            </div>
                        </div>) : (
                        // Edit Mode
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Warning Type */}
                                <FormSelect name="warning_type" label={t('warning.warningType', 'Warning Type')} control={control} error={errors.warning_type?.message} options={warningTypeOptions} disabled={true} // Don't allow changing warning type
                                />

                                {/* Warning Reason */}
                                <FormSelect name="warning_reason_id" label={t('warning.warningReason', 'Warning Reason')} control={control} error={errors.warning_reason_id?.message} options={warningReasonOptions} isLoading={isLoadingReasons} disabled={isLoadingReasons} />

                                {/* Conditional: Student ID */}
                                {warningType === 'student' && (<SelectRFH key="warning-edit-target-student" name="student_id" label={t('warning.student', 'Student')} control={control} error={errors.student_id?.message} isAsync={true} loadOptions={studentsLoader} defaultOptions={true} cacheOptions={true} disabled={mode === 'view'} placeholder={t('warning.searchStudent')} />)}

                                {/* Conditional: Teacher ID */}
                                {warningType === 'teacher' && (<SelectRFH key="warning-edit-target-teacher" name="teacher_id" label={t('warning.teacher', 'Teacher')} control={control} error={errors.teacher_id?.message} isAsync={true} loadOptions={teachersLoader} defaultOptions={true} cacheOptions={true} disabled={mode === 'view'} placeholder={t('warning.searchTeacher')} />)}

                                {/* Date */}
                                <FormInput name="date" label={t('warning.date', 'Date')} type="date" control={control} error={errors.date?.message} />

                                {/* Status */}
                                <div className="flex items-center gap-2">
                                    <Controller name="status" control={control} render={({ field }) => (<input type="checkbox" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />)} />
                                    <label className="text-sm font-medium text-gray-700">
                                        {t('warning.statusActive')}
                                    </label>
                                </div>
                            </div>

                            {/* Note */}
                            <FormTextarea name="note" label={t('warning.note', 'Note')} control={control} error={errors.note?.message} rows={4} />

                            {/* Actions */}
                            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                                <Button type="button" variant="outline" onClick={() => {
                                    setMode('view');
                                    reset();
                                }}>
                                    {t('common.cancel', 'Cancel')}
                                </Button>
                                <Button type="submit" variant="primary" disabled={updateWarningMutation.isPending}>
                                    {updateWarningMutation.isPending
                                        ? t('common.loading', 'Loading...')
                                        : t('common.saveChanges')}
                                </Button>
                            </div>
                        </form>)}
                </div>
            </div>
        </div>
    </div>);
};
export default WarningViewEditModal;
