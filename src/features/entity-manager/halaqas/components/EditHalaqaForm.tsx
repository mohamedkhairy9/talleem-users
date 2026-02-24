import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormWithValidation } from '@/utils';
import { FormInput, FormSelect, Button } from '@/globals/components';
import SelectRFH from '@/globals/components/ui/SelectRFH';
import { useHalaqa, useUpdateHalaqa } from '../hooks/useHalaqas';
import { useCreateHalaqaFormQueries } from '../hooks/useCreateHalaqaFormQueries';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import {
    HALAQA_PERIODS,
    HALAQA_ACTIVITIES
} from '../config';
import { updateHalaqaSchema, UpdateHalaqaFormData } from '../schemas/halaqa.schema';

/**
 * Normalize date to ISO format (YYYY-MM-DD) - ensures 24-hour system compatibility
 */
const normalizeDate = (dateStr: string): string => {
    if (!dateStr) return dateStr;
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    // Otherwise, parse and format to ISO
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toISOString().split('T')[0];
};

/**
 * Edit Halaqa Form Component
 * Only allows editing: name, teacher_id, period, start_date, end_date, activities, student_ids
 */
const EditHalaqaForm: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id, lang } = useParams<{ id: string; lang: string }>();
    const queryClient = useQueryClient();
    const updateHalaqaMutation = useUpdateHalaqa();
    const { data, isLoading: isLoadingHalaqa, error: halaqaError } = useHalaqa(id || '');

    const {
        control,
        handleSubmit,
        formState: { errors },
        reset
    } = useFormWithValidation<UpdateHalaqaFormData>({
        schema: updateHalaqaSchema
    });

    const {
        teachersOptions,
        studentsOptions,
        isLoadingTeachers,
        isLoadingStudents,
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

    // Extract halaqa data from API response
    const raw = data?.data;
    const halaqa = raw && typeof raw === 'object' && 'data' in raw ? (raw as { data: any }).data : raw;

    // Load halaqa data into form when available
    useEffect(() => {
        if (halaqa) {
            // Extract teacher_id from teacher object
            const teacherId = halaqa.teacher?.id || halaqa.teacher_id || 0;
            
            // Extract student_ids from students array (array of objects with id property)
            const studentIds = halaqa.students?.map((student: any) => student.id) || 
                              halaqa.student_ids || 
                              [];

            reset({
                name: {
                    ar: halaqa.name?.ar || '',
                    en: halaqa.name?.en || ''
                },
                teacher_id: teacherId,
                period: halaqa.period || 'morning',
                start_date: halaqa.start_date || '',
                end_date: halaqa.end_date || '',
                activities: halaqa.activities || [],
                student_ids: studentIds
            });
        }
    }, [halaqa, reset]);

    const onSubmit = async (data: UpdateHalaqaFormData) => {
        if (!id) return;

        // Normalize dates to ISO format (YYYY-MM-DD) - ensure 24-hour system
        const normalizedData = {
            ...data,
            start_date: normalizeDate(data.start_date),
            end_date: normalizeDate(data.end_date)
        };

        updateHalaqaMutation.mutate(
            { id, data: normalizedData },
            {
                onSuccess: () => {
                    toast.success(t('halaqa.updateSuccess', 'Halaqa updated successfully'));
                    queryClient.invalidateQueries({ queryKey: ['halaqas'] });
                    queryClient.invalidateQueries({ queryKey: ['halaqa', id] });
                    navigate(`/${lang || 'ar'}/halaqas/${id}`);
                },
                onError: (error: any) => {
                    toast.error(error?.message || t('halaqa.updateError', 'Error updating halaqa. Please try again.'));
                }
            }
        );
    };

    if (isLoadingHalaqa) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (halaqaError || !halaqa) {
        return (
            <div className="text-center py-12 text-red-600">
                {t('halaqa.notFound', 'Halaqa not found')}
            </div>
        );
    }

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

            {/* Error Message */}
            {updateHalaqaMutation.error && (
                <div className="text-red-600 text-sm">
                    {(updateHalaqaMutation.error as any).message || t('halaqa.updateError', 'Error updating halaqa. Please try again.')}
                </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(`/${lang || 'ar'}/halaqas/${id}`)}
                >
                    {t('common.cancel', 'Cancel')}
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    loading={updateHalaqaMutation.isPending}
                    disabled={updateHalaqaMutation.isPending}
                >
                    {updateHalaqaMutation.isPending ? t('common.loading', 'Loading...') : t('halaqa.update', 'Update Halaqa')}
                </Button>
            </div>
        </form>
    );
};

export default EditHalaqaForm;

