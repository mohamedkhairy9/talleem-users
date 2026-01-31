import React from 'react';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormWithValidation } from '@/utils';
import { FormInput, FormSelect, Button } from '@/globals/components';
import SelectRFH from '@/globals/components/ui/SelectRFH';
import { useAuthStore } from '@/stores';
import { useCreateHalaqa } from '../hooks/useHalaqas';
import { useCreateHalaqaFormQueries } from '../hooks/useCreateHalaqaFormQueries';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
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
        formState: { errors }
    } = useFormWithValidation<CreateHalaqaFormData>({
        schema: createHalaqaSchema,
        defaultValues: {
            name: { ar: '', en: '' },
            teacher_id: 0,
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

    const entity = useAuthStore((s) => s.user?.entity);
    const {
        teachersOptions,
        studentsOptions,
        platformsOptions,
        isLoadingTeachers,
        isLoadingStudents,
        isLoadingPlatforms,
    } = useCreateHalaqaFormQueries();

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

    const onSubmit = async (data: CreateHalaqaFormData) => {
        const memorization_program_entity_type_id = entity?.memorization_program_entity_type?.id ?? 0;
        const session_mode_id = entity?.session_mode?.id;
        const payload = {
            ...data,
            memorization_program_entity_type_id,
            ...(session_mode_id != null && { session_mode_id })
        };
        createHalaqaMutation.mutate(payload, {
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
                    label={t('halaqa.nameEn', 'Name (English)')}
                    required
                    error={errors.name?.en?.message}
                />
                <FormInput
                    name="name.ar"
                    control={control}
                    label={t('halaqa.nameAr', 'Name (Arabic)')}
                    required
                    error={errors.name?.ar?.message}
                />
            </div>

            {/* Teacher */}
            <SelectRFH
                name="teacher_id"
                control={control}
                label={t('halaqa.teacher', 'Teacher')}
                required
                options={teachersOptions}
                loading={isLoadingTeachers}
                error={errors.teacher_id?.message}
                placeholder={t('halaqa.selectTeacher', 'Select a teacher')}
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
            <SelectRFH
                name="activities"
                control={control}
                label={t('halaqa.activities', 'Activities')}
                required
                isMulti
                options={activityOptions}
                error={errors.activities?.message}
                placeholder={t('halaqa.selectActivities', 'Select activities')}
            />

            {/* Students (Multi-select) */}
            <SelectRFH
                name="student_ids"
                control={control}
                label={t('halaqa.students', 'Students')}
                required
                isMulti
                options={studentsOptions}
                loading={isLoadingStudents}
                error={errors.student_ids?.message}
                placeholder={t('halaqa.selectStudents', 'Select students')}
            />

            {/* Session Time (time range picker) */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('halaqa.sessionTime', 'Session Time')}
                    <span className="text-red-500 ms-1">*</span>
                </label>
                <Controller
                    name="session_time"
                    control={control}
                    render={({ field, fieldState }) => {
                        const match = (field.value || '').match(/^(\d{2}:\d{2})-(\d{2}:\d{2})$/);
                        const startTime = match ? match[1] : '';
                        const endTime = match ? match[2] : '';
                        return (
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex-1 min-w-[120px]">
                                    <input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => {
                                            const start = e.target.value;
                                            const end = endTime || start;
                                            field.onChange(start ? `${start}-${end}` : '');
                                        }}
                                        onBlur={field.onBlur}
                                        className={`w-full px-4 py-3 border outline-none rounded-lg focus:border-primary-600 transition-colors duration-200 ${
                                            fieldState.error ? 'border-red-300 focus:border-red-500' : 'border-gray-300'
                                        }`}
                                        aria-label={t('halaqa.sessionStartTime', 'Start time')}
                                    />
                                    <span className="block text-xs text-gray-500 mt-0.5">
                                        {t('halaqa.sessionStartTime', 'Start time')}
                                    </span>
                                </div>
                                <span className="text-gray-400 font-medium pt-5">–</span>
                                <div className="flex-1 min-w-[120px]">
                                    <input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => {
                                            const end = e.target.value;
                                            const start = startTime || end;
                                            field.onChange(end ? `${start}-${end}` : '');
                                        }}
                                        onBlur={field.onBlur}
                                        className={`w-full px-4 py-3 border outline-none rounded-lg focus:border-primary-600 transition-colors duration-200 ${
                                            fieldState.error ? 'border-red-300 focus:border-red-500' : 'border-gray-300'
                                        }`}
                                        aria-label={t('halaqa.sessionEndTime', 'End time')}
                                    />
                                    <span className="block text-xs text-gray-500 mt-0.5">
                                        {t('halaqa.sessionEndTime', 'End time')}
                                    </span>
                                </div>
                            </div>
                        );
                    }}
                />
                {errors.session_time?.message && (
                    <p className="mt-1 text-xs text-red-600">{errors.session_time.message}</p>
                )}
            </div>

            {/* Platform */}
            <SelectRFH
                name="platform_id"
                control={control}
                label={t('halaqa.platform', 'Platform')}
                required
                options={platformsOptions}
                loading={isLoadingPlatforms}
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

