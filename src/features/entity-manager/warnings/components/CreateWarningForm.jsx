import React, { useEffect, useMemo } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useFormWithValidation } from '@/utils';
import { FormInput, FormSelect, FormTextarea, Button } from '@/globals/components';
import SelectRFH from '@/globals/components/ui/SelectRFH';
import { useCreateWarning, useWarningReasons } from '../hooks';
import { createWarningSchema } from '../schemas';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores';
import { createStudentsLoader, createTeachersLoader } from '../utils';
import { WARNING_TYPES } from '../config';
/**
 * Create Warning Form Component
 * Allows creating warnings for students, teachers, or entities
 */
const CreateWarningForm = ({ onSuccess, onCancel }) => {
    const { t, i18n } = useTranslation();
    const queryClient = useQueryClient();
    const createWarningMutation = useCreateWarning();
    const entity = useAuthStore((s) => s.user?.entity);
    // Extract entity data
    const branchId = entity?.branch?.id;
    const mainProgramId = entity?.main_program?.id;
    const entityId = entity?.id;
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
    const warningType = useWatch({ control, name: 'warning_type' });
    // Create async loaders with proper dependencies
    const studentsLoader = useMemo(() => createStudentsLoader(branchId, mainProgramId, entityId), [branchId, mainProgramId, entityId]);
    const teachersLoader = useMemo(() => createTeachersLoader(branchId, mainProgramId, entityId), [branchId, mainProgramId, entityId]);
    // Fetch warning reasons
    const { data: warningReasonsData, isLoading: isLoadingReasons } = useWarningReasons(mainProgramId);
    // Transform warning reasons to options
    const warningReasonOptions = useMemo(() => {
        const reasons = warningReasonsData?.data || [];
        const currentLang = i18n.language || 'ar';
        return reasons.map((reason) => ({
            value: reason.id,
            label: currentLang === 'ar' && reason.name.ar ? reason.name.ar : (reason.name.en || '')
        }));
    }, [warningReasonsData, i18n.language]);
    // Warning type options
    const warningTypeOptions = useMemo(() => WARNING_TYPES.map(type => ({
        value: type.value,
        label: t(type.labelKey, type.value)
    })), [t]);
    // Reset target fields when warning type changes
    useEffect(() => {
        setValue('student_id', null);
        setValue('teacher_id', null);
    }, [warningType, setValue]);
    // Reset target fields when main program is unavailable
    useEffect(() => {
        if (!mainProgramId) {
            setValue('student_id', null);
            setValue('teacher_id', null);
        }
    }, [mainProgramId, setValue]);
    /**
     * Build payload with only relevant target ID based on warning type
     */
    const buildPayload = (data) => {
        const payload = {
            branch_id: branchId,
            program_id: mainProgramId, // Note: This is program_id in the payload, not main_program_id
            warning_reason_id: data.warning_reason_id,
            warning_type: data.warning_type,
            date: data.date,
            note: data.note,
            status: data.status
        };
        // Add only the relevant target ID
        switch (data.warning_type) {
            case 'student':
                if (data.student_id)
                    payload.student_id = data.student_id;
                break;
            case 'teacher':
                if (data.teacher_id)
                    payload.teacher_id = data.teacher_id;
                break;
        }
        return payload;
    };
    const onSubmit = async (data) => {
        if (!branchId || !mainProgramId) {
            toast.error(t('warning.missingEntityData'));
            return;
        }
        const payload = buildPayload(data);
        createWarningMutation.mutate(payload, {
            onSuccess: () => {
                toast.success(t('warning.createSuccess'));
                queryClient.invalidateQueries({ queryKey: ['warnings'] });
                reset();
                onSuccess?.();
            },
            onError: (error) => {
                const errorMessage = error?.response?.data?.message ||
                    error?.message ||
                    t('warning.createError');
                toast.error(errorMessage);
            }
        });
    };
    // Early return if entity data is missing
    if (!branchId || !mainProgramId) {
        return (<div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-800">
                    {t('warning.missingEntityDataAccount')}
                </p>
            </div>);
    }
    const isTargetFieldDisabled = !mainProgramId;
    return (<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Warning Type */}
                <FormSelect name="warning_type" label={t('warning.warningType', 'Warning Type')} control={control} error={errors.warning_type?.message} options={warningTypeOptions}/>

                {/* Warning Reason */}
                <FormSelect name="warning_reason_id" label={t('warning.warningReason', 'Warning Reason')} control={control} error={errors.warning_reason_id?.message} options={warningReasonOptions} isLoading={isLoadingReasons} disabled={!mainProgramId}/>

                {/* Conditional: Student ID */}
                {warningType === 'student' && (<SelectRFH name="student_id" label={t('warning.student', 'Student')} control={control} error={errors.student_id?.message} isAsync={true} loadOptions={studentsLoader} defaultOptions={true} cacheOptions={true} disabled={isTargetFieldDisabled} placeholder={t('warning.searchStudent', 'Search and select student...')}/>)}

                {/* Conditional: Teacher ID */}
                {warningType === 'teacher' && (<SelectRFH name="teacher_id" label={t('warning.teacher', 'Teacher')} control={control} error={errors.teacher_id?.message} isAsync={true} loadOptions={teachersLoader} defaultOptions={true} cacheOptions={true} disabled={isTargetFieldDisabled} placeholder={t('warning.searchTeacher', 'Search and select teacher...')}/>)}

                {/* Date */}
                <FormInput name="date" label={t('warning.date', 'Date')} type="date" control={control} error={errors.date?.message}/>

                {/* Status */}
                <div className="flex items-center gap-2">
                    <Controller name="status" control={control} render={({ field }) => (<input type="checkbox" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"/>)}/>
                    <label className="text-sm font-medium text-gray-700">
                        {t('warning.status', 'Active')}
                    </label>
                </div>
                
            </div>

            {/* Note */}
            <FormTextarea name="note" label={t('warning.note', 'Note')} control={control} error={errors.note?.message} rows={4}/>

            {/* Actions */}
            <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => {
            reset();
            onCancel?.();
        }}>
                    {t('common.cancel', 'Cancel')}
                </Button>
                <Button type="submit" variant="primary" disabled={createWarningMutation.isPending}>
                    {createWarningMutation.isPending
            ? t('common.loading', 'Loading...')
            : t('warning.create', 'Create Warning')}
                </Button>
            </div>
        </form>);
};
export default CreateWarningForm;
