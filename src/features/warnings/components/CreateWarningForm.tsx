import React, { useEffect } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useFormWithValidation } from '@/utils';
import { FormInput, FormSelect, FormTextarea, Button } from '@/globals/components';
import SelectRFH from '@/globals/components/ui/SelectRFH';
import { useCreateWarning, useWarningReasons } from '../hooks/useWarnings';
import { useWarningFormQueries } from '../hooks/useWarningFormQueries';
import { createWarningSchema, CreateWarningFormData } from '../schemas/warning.schema';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores';

interface CreateWarningFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

/**
 * Create Warning Form Component
 */
const CreateWarningForm: React.FC<CreateWarningFormProps> = ({ onSuccess, onCancel }) => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'en';
    const queryClient = useQueryClient();
    const createWarningMutation = useCreateWarning();
    
    // Get entity from auth store (which loads from cookies on initialization, like halaqa form)
    const entity = useAuthStore((s) => s.user?.entity);
    
    // Get branch_id and program_id from entity nested objects (restored from cookies via auth store)
    // The auth store loads from cookies and restores entity.branch.id and entity.main_program.id
    const branchId = entity?.branch?.id as number | undefined;
    const programId = entity?.main_program?.id as number | undefined;

    const {
        control,
        handleSubmit,
        formState: { errors },
        setValue,
        reset
    } = useFormWithValidation<CreateWarningFormData>({
        schema: createWarningSchema,
        defaultValues: {
            warning_type: 'student',
            entity_id: null,
            student_id: null,
            teacher_id: null,
            warning_reason_id: 0,
            date: new Date().toISOString().split('T')[0],
            note: '',
            status: true
        }
    });

    // Watch form values for dependencies
    const warningType = useWatch({ control, name: 'warning_type' });

    // Fetch form options (using entity branch_id and program_id)
    const {
        studentsOptions,
        teachersOptions,
        entitiesOptions,
        isLoadingStudents,
        isLoadingTeachers,
        isLoadingEntities,
        mainProgramId
    } = useWarningFormQueries({
        branchId: branchId && branchId > 0 ? branchId : null,
        programId: programId && programId > 0 ? programId : null,
        warningType: warningType || null
    });

    // Fetch warning reasons (depends on main_program_id)
    const { data: warningReasonsData, isLoading: isLoadingReasons } = useWarningReasons(mainProgramId || undefined);

    // Transform warning reasons to options
    const warningReasonOptions = React.useMemo(() => {
        // Axios interceptor returns response.data directly, so data = { data: [], meta: {} }
        const reasons = warningReasonsData?.data || [];
        return reasons.map((reason) => ({
            value: reason.id,
            label: currentLang === 'ar' && reason.name.ar ? reason.name.ar : (reason.name.en || '')
        }));
    }, [warningReasonsData, currentLang]);

    // Reset dependent fields when warning_type changes
    useEffect(() => {
        setValue('entity_id', null);
        setValue('student_id', null);
        setValue('teacher_id', null);
    }, [warningType, setValue]);

    // Reset target fields when program changes (from entity)
    useEffect(() => {
        if (!programId || programId === 0) {
            setValue('student_id', null);
            setValue('teacher_id', null);
            setValue('entity_id', null);
        }
    }, [programId, setValue]);

    const warningTypeOptions = [
        { value: 'student' as const, label: t('warning.type.student', 'Student') },
        { value: 'teacher' as const, label: t('warning.type.teacher', 'Teacher') },
        { value: 'entity' as const, label: t('warning.type.entity', 'Entity') }
    ];

    const onSubmit = async (data: CreateWarningFormData) => {
        // Validate that branch_id and program_id are available from entity
        if (!branchId || !programId) {
            toast.error(t('warning.missingEntityData', 'Branch and program information is missing. Please contact support.'));
            return;
        }

        // Clean up payload - branch_id and program_id come from entity, not form
        // Only include the relevant ID based on warning_type
        const payload: any = {
            branch_id: branchId,
            program_id: programId,
            warning_reason_id: data.warning_reason_id,
            warning_type: data.warning_type,
            date: data.date,
            note: data.note,
            status: data.status
        };

        // Add only the relevant ID based on warning_type
        if (data.warning_type === 'entity' && data.entity_id) {
            payload.entity_id = data.entity_id;
        } else if (data.warning_type === 'student' && data.student_id) {
            payload.student_id = data.student_id;
        } else if (data.warning_type === 'teacher' && data.teacher_id) {
            payload.teacher_id = data.teacher_id;
        }

        createWarningMutation.mutate(payload, {
            onSuccess: () => {
                toast.success(t('warning.createSuccess', 'Warning created successfully'));
                queryClient.invalidateQueries({ queryKey: ['warnings'] });
                reset();
                onSuccess?.();
            },
            onError: (error: any) => {
                toast.error(error?.response?.data?.message || t('warning.createError', 'Error creating warning'));
            }
        });
    };

    // Show error if entity data is missing
    if (!branchId || !programId) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-800">
                    {t('warning.missingEntityData', 'Branch and program information is missing from your account. Please contact support.')}
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Info banner showing entity branch/program */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm text-blue-800">
                    {t('warning.entityInfo', 'Warning will be created for your entity\'s branch and program.')}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Warning Type */}
                <FormSelect
                    name="warning_type"
                    label={t('warning.warningType', 'Warning Type')}
                    control={control}
                    error={errors.warning_type?.message}
                    options={warningTypeOptions}
                />

                {/* Warning Reason */}
                <FormSelect
                    name="warning_reason_id"
                    label={t('warning.warningReason', 'Warning Reason')}
                    control={control}
                    error={errors.warning_reason_id?.message}
                    options={warningReasonOptions}
                    isLoading={isLoadingReasons}
                    disabled={!mainProgramId}
                />

                {/* Conditional: Student ID */}
                {warningType === 'student' && (
                    <SelectRFH
                        name="student_id"
                        label={t('warning.student', 'Student')}
                        control={control}
                        error={errors.student_id?.message}
                        options={studentsOptions}
                        loading={isLoadingStudents}
                        disabled={!programId || programId === 0}
                    />
                )}

                {/* Conditional: Teacher ID */}
                {warningType === 'teacher' && (
                    <SelectRFH
                        name="teacher_id"
                        label={t('warning.teacher', 'Teacher')}
                        control={control}
                        error={errors.teacher_id?.message}
                        options={teachersOptions}
                        loading={isLoadingTeachers}
                        disabled={!programId || programId === 0}
                    />
                )}

                {/* Conditional: Entity ID */}
                {warningType === 'entity' && (
                    <SelectRFH
                        name="entity_id"
                        label={t('warning.entity', 'Entity')}
                        control={control}
                        error={errors.entity_id?.message}
                        options={entitiesOptions}
                        loading={isLoadingEntities}
                        disabled={!programId || programId === 0}
                    />
                )}

                {/* Date */}
                <FormInput
                    name="date"
                    label={t('warning.date', 'Date')}
                    type="date"
                    control={control}
                    error={errors.date?.message}
                />

                {/* Status */}
                <div className="flex items-center gap-2">
                    <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                            <input
                                type="checkbox"
                                checked={field.value}
                                onChange={(e) => field.onChange(e.target.checked)}
                                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                        )}
                    />
                    <label className="text-sm font-medium text-gray-700">
                        {t('warning.status', 'Active')}
                    </label>
                </div>
            </div>

            {/* Note */}
            <FormTextarea
                name="note"
                label={t('warning.note', 'Note')}
                control={control}
                error={errors.note?.message}
                rows={4}
            />

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                        reset();
                        onCancel?.();
                    }}
                >
                    {t('common.cancel', 'Cancel')}
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    disabled={createWarningMutation.isPending}
                >
                    {createWarningMutation.isPending
                        ? t('common.loading', 'Loading...')
                        : t('warning.create', 'Create Warning')}
                </Button>
            </div>
        </form>
    );
};

export default CreateWarningForm;

