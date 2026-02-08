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

interface CreateWarningFormProps {
    onSuccess?: () => void;
}

/**
 * Create Warning Form Component
 */
const CreateWarningForm: React.FC<CreateWarningFormProps> = ({ onSuccess }) => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'en';
    const queryClient = useQueryClient();
    const createWarningMutation = useCreateWarning();

    const {
        control,
        handleSubmit,
        formState: { errors },
        setValue,
        reset
    } = useFormWithValidation<CreateWarningFormData>({
        schema: createWarningSchema,
        defaultValues: {
            branch_id: 0,
            program_id: 0,
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
    const branchId = useWatch({ control, name: 'branch_id' });
    const programId = useWatch({ control, name: 'program_id' });
    const warningType = useWatch({ control, name: 'warning_type' });

    // Fetch form options
    const {
        branchesOptions,
        programsOptions,
        studentsOptions,
        teachersOptions,
        entitiesOptions,
        isLoadingBranches,
        isLoadingPrograms,
        isLoadingStudents,
        isLoadingTeachers,
        isLoadingEntities,
        mainProgramId
    } = useWarningFormQueries({
        branchId: branchId > 0 ? branchId : null,
        programId: programId > 0 ? programId : null,
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

    // Reset program when branch changes
    useEffect(() => {
        if (branchId === 0 || !branchId) {
            setValue('program_id', 0);
        }
    }, [branchId, setValue]);

    // Reset target fields when program changes
    useEffect(() => {
        if (programId === 0 || !programId) {
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
        // Clean up payload - only include the relevant ID based on warning_type
        const payload = {
            branch_id: data.branch_id,
            program_id: data.program_id,
            warning_reason_id: data.warning_reason_id,
            warning_type: data.warning_type,
            date: data.date,
            note: data.note,
            status: data.status,
            entity_id: data.warning_type === 'entity' ? data.entity_id : null,
            student_id: data.warning_type === 'student' ? data.student_id : null,
            teacher_id: data.warning_type === 'teacher' ? data.teacher_id : null
        };

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

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Branch */}
                <FormSelect
                    name="branch_id"
                    label={t('warning.branch', 'Branch')}
                    control={control}
                    error={errors.branch_id?.message}
                    options={branchesOptions}
                    isLoading={isLoadingBranches}
                />

                {/* Program */}
                <FormSelect
                    name="program_id"
                    label={t('warning.program', 'Program')}
                    control={control}
                    error={errors.program_id?.message}
                    options={programsOptions}
                    isLoading={isLoadingPrograms}
                    disabled={!branchId || branchId === 0}
                />

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
                        isLoading={isLoadingStudents}
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
                        isLoading={isLoadingTeachers}
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
                        isLoading={isLoadingEntities}
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
                    onClick={() => reset()}
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

