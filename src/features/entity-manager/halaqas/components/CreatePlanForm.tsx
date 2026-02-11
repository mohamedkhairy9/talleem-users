import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWatch } from 'react-hook-form';
import { useFormWithValidation } from '@/utils';
import { FormInput, FormSelect, Button } from '@/globals/components';
import SelectRFH from '@/globals/components/ui/SelectRFH';
import { useCreatePlan } from '../hooks/useHalaqas';
import { useCreateHalaqaFormQueries } from '../hooks/useCreateHalaqaFormQueries';
import type { CreatePlanPayload } from '../services/halaqas.service';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import {
    HALAQA_ACTIVITIES,
    PLAN_TYPES,
    PLAN_UNITS,
    PLAN_DIRECTIONS,
    type HalaqaActivity
} from '../config';
import { createPlanSchema, CreatePlanFormData } from '../schemas/plan.schema';

interface CreatePlanFormProps {
    halaqaId: number | string;
    students?: Array<{ id: number; name?: { en?: string; ar?: string } }>;
    activities?: HalaqaActivity[];
    onSuccess?: () => void;
}

/**
 * Create Plan Form Component
 * Creates a plan for a specific student in a halaqa
 */
const CreatePlanForm: React.FC<CreatePlanFormProps> = ({ halaqaId, students, activities, onSuccess }) => {
    const { t, i18n } = useTranslation();
    const queryClient = useQueryClient();
    const createPlanMutation = useCreatePlan();
    const currentLang = i18n.language || 'en';

    // Get default activity from halaqa activities or fallback to 'hifz'
    const defaultActivity = React.useMemo(() => {
        if (activities && activities.length > 0) {
            return activities[0];
        }
        return 'hifz' as const;
    }, [activities]);

    const {
        control,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch
    } = useFormWithValidation<CreatePlanFormData>({
        schema: createPlanSchema,
        defaultValues: {
            activity: defaultActivity,
            student_id: 0,
            plan_type: 'daily_amount',
            unit: 'segments',
            direction: 'incremental',
            start_segment_id: undefined,
            start_juz_number: undefined,
            start_surah_id: undefined,
            daily_amount: 0
        }
    });

    const currentActivity = watch('activity');
    const currentUnit = useWatch({
        control,
        name: 'unit'
    });

    // Clear start fields when unit changes
    useEffect(() => {
        if (currentUnit) {
            setValue('start_segment_id', undefined);
            setValue('start_juz_number', undefined);
            setValue('start_surah_id', undefined);
        }
    }, [currentUnit, setValue]);

    // Update activity if current value is not in halaqa activities
    React.useEffect(() => {
        if (activities && activities.length > 0 && currentActivity && !activities.includes(currentActivity)) {
            setValue('activity', activities[0]);
        }
    }, [activities, currentActivity, setValue]);

    // Build students options from halaqa students or fetch all students
    const { studentsOptions: allStudentsOptions, isLoadingStudents } = useCreateHalaqaFormQueries();
    
    const studentsOptions = React.useMemo(() => {
        if (students && students.length > 0) {
            return students.map(student => ({
                value: student.id,
                label: typeof student.name === 'object' && student.name
                    ? (currentLang === 'ar' && student.name.ar ? student.name.ar : student.name.en) || `Student #${student.id}`
                    : `Student #${student.id}`
            }));
        }
        return allStudentsOptions;
    }, [students, allStudentsOptions, currentLang]);

    // Get localized options for activities - filter to only show halaqa activities
    const activityOptions = React.useMemo(() => {
        const allActivities = HALAQA_ACTIVITIES.map(activity => ({
            value: activity.value,
            label: t(activity.labelKey, activity.value)
        }));
        
        // If halaqa activities are provided, filter to only show those
        if (activities && activities.length > 0) {
            return allActivities.filter(activity => 
                activities.includes(activity.value as 'hifz' | 'tasbit' | 'murajaa')
            );
        }
        
        return allActivities;
    }, [activities, t]);

    const planTypeOptions = PLAN_TYPES.map(type => ({
        value: type.value,
        label: t(type.labelKey, type.value)
    }));

    const unitOptions = PLAN_UNITS.map(unit => ({
        value: unit.value,
        label: t(unit.labelKey, unit.value)
    }));

    const directionOptions = PLAN_DIRECTIONS.map(direction => ({
        value: direction.value,
        label: t(direction.labelKey, direction.value)
    }));

    const onSubmit = async (data: CreatePlanFormData) => {
        // Build payload with only the relevant start field based on unit
        const payload: CreatePlanPayload = {
            activity: data.activity,
            student_id: data.student_id,
            plan_type: data.plan_type,
            unit: data.unit,
            direction: data.direction,
            daily_amount: data.daily_amount,
            // Include only the start field that matches the selected unit
            ...(data.unit === 'segments' && data.start_segment_id && { start_segment_id: data.start_segment_id }),
            ...(data.unit === 'parts' && data.start_juz_number && { start_juz_number: data.start_juz_number }),
            ...(data.unit === 'surahs' && data.start_surah_id && { start_surah_id: data.start_surah_id })
        };

        createPlanMutation.mutate(
            { halaqaId, data: payload },
            {
                onSuccess: () => {
                    toast.success(t('plan.createSuccess', 'Plan created successfully'));
                    queryClient.invalidateQueries({ queryKey: ['halaqa', halaqaId] });
                    reset({
                        activity: defaultActivity,
                        student_id: 0,
                        plan_type: 'daily_amount',
                        unit: 'segments',
                        direction: 'incremental',
                        start_segment_id: undefined,
                        start_juz_number: undefined,
                        start_surah_id: undefined,
                        daily_amount: 0
                    });
                    if (onSuccess) {
                        onSuccess();
                    }
                },
                onError: (error: any) => {
                    toast.error(error?.message || t('plan.createError', 'Error creating plan. Please try again.'));
                }
            }
        );
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Activity */}
            <FormSelect
                name="activity"
                control={control}
                label={t('plan.activity', 'Activity')}
                required
                options={activityOptions}
                error={errors.activity?.message}
            />

            {/* Student */}
            <SelectRFH
                name="student_id"
                control={control}
                label={t('plan.student', 'Student')}
                required
                options={studentsOptions}
                loading={isLoadingStudents}
                error={errors.student_id?.message}
                placeholder={t('plan.selectStudent', 'Select a student')}
            />

            {/* Plan Type */}
            <FormSelect
                name="plan_type"
                control={control}
                label={t('plan.planType', 'Plan Type')}
                required
                options={planTypeOptions}
                error={errors.plan_type?.message}
            />

            {/* Unit */}
            <FormSelect
                name="unit"
                control={control}
                label={t('plan.unit', 'Unit')}
                required
                options={unitOptions}
                error={errors.unit?.message}
            />

            {/* Direction */}
            <FormSelect
                name="direction"
                control={control}
                label={t('plan.direction', 'Direction')}
                required
                options={directionOptions}
                error={errors.direction?.message}
            />

            {/* Conditional Start Fields based on Unit */}
            {currentUnit === 'segments' && (
                <FormInput
                    name="start_segment_id"
                    control={control}
                    label={t('plan.startSegmentId', 'Start Segment ID')}
                    required
                    type="number"
                    error={errors.start_segment_id?.message}
                />
            )}
            {currentUnit === 'parts' && (
                <FormInput
                    name="start_juz_number"
                    control={control}
                    label={t('plan.startJuzNumber', 'Start Juz Number')}
                    required
                    type="number"
                    error={errors.start_juz_number?.message}
                />
            )}
            {currentUnit === 'surahs' && (
                <FormInput
                    name="start_surah_id"
                    control={control}
                    label={t('plan.startSurahId', 'Start Surah ID')}
                    required
                    type="number"
                    error={errors.start_surah_id?.message}
                />
            )}

            {/* Daily Amount */}
            <FormInput
                name="daily_amount"
                control={control}
                label={t('plan.dailyAmount', 'Daily Amount')}
                required
                type="number"
                error={errors.daily_amount?.message}
            />

            {/* Error Message */}
            {createPlanMutation.error && (
                <div className="text-red-600 text-sm">
                    {(createPlanMutation.error as any).message || t('plan.createError', 'Error creating plan. Please try again.')}
                </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
                <Button
                    type="submit"
                    variant="primary"
                    loading={createPlanMutation.isPending}
                    disabled={createPlanMutation.isPending}
                >
                    {createPlanMutation.isPending ? t('common.loading', 'Loading...') : t('plan.create', 'Create Plan')}
                </Button>
            </div>
        </form>
    );
};

export default CreatePlanForm;

