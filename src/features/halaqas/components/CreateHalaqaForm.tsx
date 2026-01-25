import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormWithValidation } from '@/utils';
import { FormInput, FormSelect, Button } from '@/globals/components';
import AsyncSelect from '@/globals/components/ui/AsyncSelect';
import { useCreateHalaqa } from '../hooks/useHalaqas';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import {
    useTeachersAsyncSelect,
    useStudentsAsyncSelect,
    usePlatformsAsyncSelect,
    useMemorizationProgramEntityTypesAsyncSelect
} from '../hooks/useFormFields';
import {
    HALAQA_PERIODS,
    HALAQA_ACTIVITIES,
    HALAQA_TEACHING_METHODS
} from '@/config/halaqa.config';
import { createHalaqaSchema, CreateHalaqaFormData } from '../schemas/halaqa.schema';

/**
 * Create Halaqa Form Component
 */
const CreateHalaqaForm: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { lang } = useParams<{ lang: string }>();
    const queryClient = useQueryClient();
    const createHalaqaMutation = useCreateHalaqa();

    const {
        control,
        handleSubmit,
        formState: { errors },
        setValue,
        watch
    } = useFormWithValidation<CreateHalaqaFormData>({
        schema: createHalaqaSchema,
        defaultValues: {
            name: { ar: '', en: '' },
            teacher_id: 0,
            memorization_program_entity_type_id: 0,
            period: 'morning',
            start_date: '',
            end_date: '',
            activities: [],
            student_ids: [],
            session_time: '',
            platform_id: 0,
            teaching_method: 'in_person'
        }
    });

    const { loadTeachers } = useTeachersAsyncSelect();
    const { loadStudents } = useStudentsAsyncSelect();
    const { loadPlatforms } = usePlatformsAsyncSelect();
    const { loadMemorizationProgramEntityTypes } = useMemorizationProgramEntityTypesAsyncSelect();

    // Get localized options for static fields
    const periodOptions = HALAQA_PERIODS.map(period => ({
        value: period.value,
        label: t(period.labelKey, period.value)
    }));

    const activityOptions = HALAQA_ACTIVITIES.map(activity => ({
        value: activity.value,
        label: t(activity.labelKey, activity.value)
    }));

    const teachingMethodOptions = HALAQA_TEACHING_METHODS.map(method => ({
        value: method.value,
        label: t(method.labelKey, method.value)
    }));

    const selectedActivities = watch('activities') || [];

    const onSubmit = async (data: CreateHalaqaFormData) => {
        createHalaqaMutation.mutate(data, {
            onSuccess: () => {
                toast.success(t('halaqa.createSuccess', 'Halaqa created successfully'));
                queryClient.invalidateQueries({ queryKey: ['halaqas'] });
                navigate(`/${lang || 'en'}/halaqas`);
            },
            onError: (error: any) => {
                toast.error(error?.message || t('halaqa.createError', 'Error creating halaqa. Please try again.'));
            }
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name Fields (Arabic and English) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                    name="name.en"
                    control={control}
                    label={t('halaqa.name.en', 'Name (English)')}
                    required
                    error={errors.name?.en?.message}
                />
                <FormInput
                    name="name.ar"
                    control={control}
                    label={t('halaqa.name.ar', 'Name (Arabic)')}
                    required
                    error={errors.name?.ar?.message}
                />
            </div>

            {/* Teacher */}
            <AsyncSelect
                name="teacher_id"
                control={control}
                label={t('halaqa.teacher', 'Teacher')}
                required
                loadOptions={loadTeachers}
                error={errors.teacher_id?.message}
                placeholder={t('halaqa.selectTeacher', 'Select a teacher')}
            />

            {/* Memorization Program Entity Type */}
            <AsyncSelect
                name="memorization_program_entity_type_id"
                control={control}
                label={t('halaqa.memorizationProgramEntityType', 'Memorization Program Entity Type')}
                required
                loadOptions={loadMemorizationProgramEntityTypes}
                error={errors.memorization_program_entity_type_id?.message}
                placeholder={t('halaqa.selectMemorizationProgramEntityType', 'Select memorization program entity type')}
            />

            {/* Period */}
            <FormSelect
                name="period"
                control={control}
                label={t('halaqa.period', 'Period')}
                required
                options={periodOptions}
                error={errors.period?.message}
            />

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                    name="start_date"
                    control={control}
                    label={t('halaqa.startDate', 'Start Date')}
                    required
                    type="date"
                    error={errors.start_date?.message}
                />
                <FormInput
                    name="end_date"
                    control={control}
                    label={t('halaqa.endDate', 'End Date')}
                    required
                    type="date"
                    error={errors.end_date?.message}
                />
            </div>

            {/* Activities (Multi-select) */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('halaqa.activities', 'Activities')}
                    <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="space-y-2">
                    {activityOptions.map(activity => (
                        <label key={activity.value} className="flex items-center">
                            <input
                                type="checkbox"
                                checked={selectedActivities.includes(activity.value as any)}
                                onChange={(e) => {
                                    const currentActivities = selectedActivities;
                                    if (e.target.checked) {
                                        setValue('activities', [...currentActivities, activity.value as any]);
                                    } else {
                                        setValue('activities', currentActivities.filter(a => a !== activity.value));
                                    }
                                }}
                                className="mr-2"
                            />
                            <span>{activity.label}</span>
                        </label>
                    ))}
                </div>
                {errors.activities && (
                    <p className="mt-1 text-xs text-red-600">{errors.activities.message}</p>
                )}
            </div>

            {/* Students (Multi-select) */}
            <AsyncSelect
                name="student_ids"
                control={control}
                label={t('halaqa.students', 'Students')}
                required
                isMulti
                loadOptions={loadStudents}
                error={errors.student_ids?.message}
                placeholder={t('halaqa.selectStudents', 'Select students')}
            />

            {/* Session Time */}
            <FormInput
                name="session_time"
                control={control}
                label={t('halaqa.sessionTime', 'Session Time')}
                required
                placeholder="05:00-07:30"
                helperText={t('halaqa.sessionTimeHelper', 'Format: HH:MM-HH:MM (e.g., 05:00-07:30)')}
                error={errors.session_time?.message}
            />

            {/* Platform */}
            <AsyncSelect
                name="platform_id"
                control={control}
                label={t('halaqa.platform', 'Platform')}
                required
                loadOptions={loadPlatforms}
                error={errors.platform_id?.message}
                placeholder={t('halaqa.selectPlatform', 'Select a platform')}
            />

            {/* Teaching Method */}
            <FormSelect
                name="teaching_method"
                control={control}
                label={t('halaqa.teachingMethod', 'Teaching Method')}
                required
                options={teachingMethodOptions}
                error={errors.teaching_method?.message}
            />

            {/* Error Message */}
            {createHalaqaMutation.error && (
                <div className="text-red-600 text-sm">
                    {(createHalaqaMutation.error as any).message || t('halaqa.createError', 'Error creating halaqa. Please try again.')}
                </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
                <Button
                    type="submit"
                    variant="primary"
                    loading={createHalaqaMutation.isPending}
                    disabled={createHalaqaMutation.isPending}
                >
                    {createHalaqaMutation.isPending ? t('common.loading', 'Loading...') : t('halaqa.create', 'Create Halaqa')}
                </Button>
            </div>
        </form>
    );
};

export default CreateHalaqaForm;

