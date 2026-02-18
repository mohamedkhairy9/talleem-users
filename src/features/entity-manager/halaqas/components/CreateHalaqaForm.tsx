import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormWithValidation } from '@/utils';
import { FormInput, FormSelect, Button } from '@/globals/components';
import SelectRFH from '@/globals/components/ui/SelectRFH';
import { useAuthStore } from '@/stores';
import { useCreateHalaqa, useCheckAvailability } from '../hooks/useHalaqas';
import { useCreateHalaqaFormQueries } from '../hooks/useCreateHalaqaFormQueries';
import type { CreateHalaqaPayload, CheckAvailabilityPayload, CheckAvailabilityResponse } from '../services/halaqas.service';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import {
    HALAQA_PERIODS,
    HALAQA_ACTIVITIES,
    HALAQA_TEACHING_METHODS
} from '../config';
import { createHalaqaSchema, CreateHalaqaFormData } from '../schemas/halaqa.schema';
import { AlertTriangleIcon, ClipboardCheckIcon, CircleIcon, ChevronRightIcon } from '@/globals/icons';
import CreatePlanForm from './CreatePlanForm';

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
 * Normalize session time to 24-hour format (HH:MM-HH:MM)
 */
const normalizeSessionTime = (timeStr: string): string => {
    if (!timeStr) return timeStr;
    // If already in HH:MM-HH:MM format, return as is
    if (/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(timeStr)) return timeStr;
    // Parse and ensure 24-hour format (handles AM/PM if present)
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?-(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (match) {
        let startHour = parseInt(match[1], 10);
        const startMin = match[2];
        const startPeriod = match[3]?.toUpperCase();
        let endHour = parseInt(match[4], 10);
        const endMin = match[5];
        const endPeriod = match[6]?.toUpperCase();

        // Convert to 24-hour format
        if (startPeriod === 'PM' && startHour !== 12) startHour += 12;
        if (startPeriod === 'AM' && startHour === 12) startHour = 0;
        if (endPeriod === 'PM' && endHour !== 12) endHour += 12;
        if (endPeriod === 'AM' && endHour === 12) endHour = 0;

        return `${String(startHour).padStart(2, '0')}:${startMin}-${String(endHour).padStart(2, '0')}:${endMin}`;
    }
    return timeStr;
};

/**
 * Create Halaqa Form Component
 */
const CreateHalaqaForm: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { lang } = useParams<{ lang: string }>();
    const queryClient = useQueryClient();
    const createHalaqaMutation = useCreateHalaqa();
    const currentLang = i18n.language || lang || 'en';
    
    // Multi-step form state
    const [currentStep, setCurrentStep] = useState<1 | 2>(1);
    const [createdHalaqa, setCreatedHalaqa] = useState<any>(null);

    const {
        control,
        handleSubmit,
        formState: { errors },
        setValue
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
            platform_id: undefined,
            teaching_method: 'in_person'
        }
    });

    // Watch teaching_method to conditionally show platform field
    const teachingMethod = useWatch({
        control,
        name: 'teaching_method'
    });

    // Watch fields needed for availability check
    const teacherId = useWatch({ control, name: 'teacher_id' });
    const studentIds = useWatch({ control, name: 'student_ids' });
    const startDate = useWatch({ control, name: 'start_date' });
    const endDate = useWatch({ control, name: 'end_date' });
    const period = useWatch({ control, name: 'period' });
    const sessionTime = useWatch({ control, name: 'session_time' });

    // State for availability check result
    const [availabilityResult, setAvailabilityResult] = useState<CheckAvailabilityResponse | null>(null);

    // Clear platform_id when teaching method changes to in_person
    useEffect(() => {
        if (teachingMethod === 'in_person') {
            setValue('platform_id', undefined);
        }
    }, [teachingMethod, setValue]);

    // Clear availability result when form fields change
    useEffect(() => {
        setAvailabilityResult(null);
    }, [teacherId, studentIds, startDate, endDate, period, sessionTime]);

    // Check availability mutation
    const checkAvailabilityMutation = useCheckAvailability();

    // Check if all required fields are filled for availability check
    const canCheckAvailability = useMemo(() => {
        return !!(
            teacherId &&
            Array.isArray(studentIds) &&
            studentIds.length > 0 &&
            startDate &&
            endDate &&
            period &&
            sessionTime
        );
    }, [teacherId, studentIds, startDate, endDate, period, sessionTime]);

    // Handle availability check button click
    const handleCheckAvailability = useCallback(() => {
        if (!canCheckAvailability) return;

        const payload: CheckAvailabilityPayload = {
            teacher_id: teacherId,
            student_ids: studentIds,
            start_date: normalizeDate(startDate),
            end_date: normalizeDate(endDate),
            period: period as 'morning' | 'evening',
            session_time: normalizeSessionTime(sessionTime)
        };

        checkAvailabilityMutation.mutate(payload, {
            onSuccess: (response: CheckAvailabilityResponse) => {
                // Axios interceptor already extracts response.data, so response IS the CheckAvailabilityResponse
                // API returns 200 even when has_conflict is true
                setAvailabilityResult(response);
            },
            onError: () => {
                setAvailabilityResult(null);
                toast.error(t('halaqa.availabilityCheckError', 'Unable to check availability. Please try again.'));
            }
        });
    }, [canCheckAvailability, teacherId, studentIds, startDate, endDate, period, sessionTime, checkAvailabilityMutation, t]);

    // Check availability status - API returns 200 even with conflicts
    const isAvailable = useMemo(() => {
        return availabilityResult ? !availabilityResult.has_conflict : false;
    }, [availabilityResult]);

    const hasConflict = useMemo(() => {
        return availabilityResult ? Boolean(availabilityResult.has_conflict) : false;
    }, [availabilityResult]);

    const hasConflictsData = useMemo(() => {
        if (!availabilityResult?.conflicts) return false;
        return !!(
            availabilityResult.conflicts.teacher ||
            (Array.isArray(availabilityResult.conflicts.students) && availabilityResult.conflicts.students.length > 0)
        );
    }, [availabilityResult]);

    const isCheckingAvailability = checkAvailabilityMutation.isPending;

    const entity = useAuthStore((s) => s.user?.entity);
    const {
        teachersOptions,
        studentsOptions,
        platformsOptions,
        isLoadingTeachers,
        isLoadingStudents,
        isLoadingPlatforms,
    } = useCreateHalaqaFormQueries();

    // Get localized options for static fields (memoized)
    const periodOptions = useMemo(() => 
        HALAQA_PERIODS.map(period => ({
            value: period.value,
            label: t(period.labelKey, period.value)
        })), [t]
    );

    const activityOptions = useMemo(() => 
        HALAQA_ACTIVITIES.map(activity => ({
            value: activity.value,
            label: t(activity.labelKey, activity.value)
        })), [t]
    );

    const teachingMethodOptions = useMemo(() => 
        HALAQA_TEACHING_METHODS.map(method => ({
            value: method.value,
            label: t(method.labelKey, method.value)
        })), [t]
    );

    const onSubmit = async (data: CreateHalaqaFormData) => {
        const memorization_program_entity_type_id = entity?.memorization_program_entity_type?.id ?? 0;
        const session_mode_id = entity?.session_mode?.id;
        
        // Build payload, excluding platform_id if teaching method is in_person
        const { platform_id, ...restData } = data;
        const payload: CreateHalaqaPayload = {
            ...restData,
            start_date: normalizeDate(data.start_date),
            end_date: normalizeDate(data.end_date),
            session_time: normalizeSessionTime(data.session_time),
            memorization_program_entity_type_id,
            ...(session_mode_id != null && { session_mode_id }),
            // Only include platform_id if teaching method is not in_person and it has a value
            ...(data.teaching_method !== 'in_person' && platform_id ? { platform_id } : {})
        };
        createHalaqaMutation.mutate(payload, {
            onSuccess: (response: any) => {
                // Extract halaqa data from response (API returns { data: { data: {...} } })
                const halaqaData = response?.data?.data || response?.data || response;
                setCreatedHalaqa(halaqaData);
                toast.success(t('halaqa.createSuccess', 'Halaqa created successfully'));
                queryClient.invalidateQueries({ queryKey: ['halaqas'] });
                // Move to step 2 (plan creation)
                setCurrentStep(2);
            },
            onError: (error: any) => {
                toast.error(error?.message || t('halaqa.createError', 'Error creating halaqa. Please try again.'));
            }
        });
    };

    // Handle finish (skip plan creation or finish after creating plans)
    const handleFinish = () => {
        queryClient.invalidateQueries({ queryKey: ['halaqas'] });
        navigate(`/${lang || 'en'}/halaqas`);
    };

    // Render step 1: Halaqa creation form
    const renderStep1 = () => (
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
                                        step="60"
                                        value={endTime}
                                        onChange={(e) => {
                                            const end = e.target.value; // Already in HH:MM format (24-hour)
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

            {/* Teaching Method */}
            <FormSelect
                name="teaching_method"
                control={control}
                label={t('halaqa.teachingMethod', 'Teaching Method')}
                required
                options={teachingMethodOptions}
                error={errors.teaching_method?.message}
            />

            {/* Platform - Only show if teaching method is not in_person */}
            {teachingMethod && teachingMethod !== 'in_person' && (
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
            )}

            {/* Availability Check Button */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">
                            {t('halaqa.checkAvailability', 'Check Availability')}
                        </h3>
                        <p className="text-xs text-gray-600">
                            {t('halaqa.checkAvailabilityDescription', 'Verify teacher and student availability before creating the halaqa')}
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleCheckAvailability}
                        disabled={!canCheckAvailability || isCheckingAvailability}
                        loading={isCheckingAvailability}
                    >
                        {isCheckingAvailability 
                            ? t('halaqa.checking', 'Checking...') 
                            : t('halaqa.checkAvailability', 'Check Availability')}
                    </Button>
                </div>

                {/* Availability Check Status */}
                {isCheckingAvailability && (
                    <div className="flex items-center gap-3 text-gray-600 p-3 bg-white rounded-lg border border-gray-200">
                        <CircleIcon width={20} height={20} className="animate-spin" />
                        <span className="text-sm font-medium">{t('halaqa.checkingAvailability', 'Checking availability...')}</span>
                    </div>
                )}

                {checkAvailabilityMutation.error && (
                    <div className="flex items-center gap-3 text-amber-600 p-3 bg-white rounded-lg border border-amber-200">
                        <AlertTriangleIcon width={20} height={20} />
                        <span className="text-sm font-medium">{t('halaqa.availabilityCheckError', 'Unable to check availability. Please try again.')}</span>
                    </div>
                )}

                {availabilityResult && (
                    <div className="space-y-4 mt-4">
                        {/* Availability Status */}
                        <div className={`flex items-center gap-3 p-4 rounded-lg border-2 ${
                            isAvailable 
                                ? 'bg-green-50 border-green-300' 
                                : 'bg-red-50 border-red-300'
                        }`}>
                            {isAvailable ? (
                                <>
                                    <ClipboardCheckIcon width={24} height={24} className="text-green-600 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-base font-bold text-green-900">
                                            {t('halaqa.available', 'Available')}
                                        </p>
                                        <p className="text-sm text-green-700 mt-1">{availabilityResult.message}</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <AlertTriangleIcon width={24} height={24} className="text-red-600 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-base font-bold text-red-900">
                                            {t('halaqa.notAvailable', 'Not Available')}
                                        </p>
                                        <p className="text-sm text-red-700 mt-1">{availabilityResult.message}</p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Conflicts - Show when has_conflict is true OR when conflicts object exists */}
                        {(hasConflict || hasConflictsData) && availabilityResult?.conflicts && (
                            <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg mt-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <AlertTriangleIcon width={20} height={20} className="text-red-600" />
                                    <p className="text-base font-bold text-red-900">
                                        {t('halaqa.conflicts', 'Conflicts Detected')}
                                    </p>
                                </div>
                                <div className="space-y-3 text-sm bg-white p-3 rounded border border-red-200">
                                    {availabilityResult.conflicts.teacher && (
                                        <div className="flex items-start gap-2">
                                            <span className="font-semibold text-red-800 min-w-[80px]">{t('halaqa.teacher', 'Teacher')}:</span>
                                            <span className="text-red-700 font-medium">
                                                {currentLang === 'ar' 
                                                    ? availabilityResult.conflicts.teacher.ar 
                                                    : availabilityResult.conflicts.teacher.en}
                                            </span>
                                        </div>
                                    )}
                                    {Array.isArray(availabilityResult.conflicts.students) && availabilityResult.conflicts.students.length > 0 && (
                                        <div className="flex items-start gap-2">
                                            <span className="font-semibold text-red-800 min-w-[80px]">{t('halaqa.students', 'Students')}:</span>
                                            <div className="flex-1">
                                                <span className="text-red-700 font-medium">
                                                    {availabilityResult.conflicts.students.map((student: { ar: string; en: string }) => 
                                                        currentLang === 'ar' ? student.ar : student.en
                                                    ).join(', ')}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    {!availabilityResult.conflicts.teacher && 
                                     (!Array.isArray(availabilityResult.conflicts.students) || availabilityResult.conflicts.students.length === 0) && (
                                        <p className="text-red-700">{t('halaqa.conflictsUnknown', 'Conflicts detected but details are not available')}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Generated Schedule */}
                        {availabilityResult.generated_schedule && availabilityResult.generated_schedule.length > 0 && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm font-semibold text-blue-900 mb-2">
                                    {t('halaqa.generatedSchedule', 'Generated Schedule')}:
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                                    {availabilityResult.generated_schedule.map((schedule: { day: string; from: string; to: string }, index: number) => (
                                        <div key={index} className="p-2 bg-white rounded border border-blue-100">
                                            <p className="font-medium text-blue-900">{schedule.day}</p>
                                            <p className="text-blue-700">{schedule.from} - {schedule.to}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

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
                    disabled={createHalaqaMutation.isPending || !isAvailable}
                >
                    {createHalaqaMutation.isPending ? t('common.loading', 'Loading...') : t('halaqa.createAndContinue', 'Create Halaqa & Continue')}
                </Button>
            </div>
        </form>
    );

    // Render step 2: Plan creation for students
    const renderStep2 = () => {
        if (!createdHalaqa) return null;

        const students = createdHalaqa.students || [];
        const activities = createdHalaqa.activities || [];

        return (
            <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                        {t('halaqa.createPlans', 'Create Plans for Students')}
                    </h3>
                    <p className="text-sm text-blue-700">
                        {t('halaqa.createPlansDescription', 'You can create plans for one or more students. This step is optional - you can skip it and create plans later.')}
                    </p>
                </div>

                {students.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p>{t('halaqa.noStudents', 'No students in this halaqa')}</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {students.map((student: any) => (
                            <div key={student.id} className="border border-gray-200 rounded-lg p-6 bg-white">
                                <h4 className="text-base font-semibold text-gray-900 mb-4">
                                    {currentLang === 'ar' && student.name?.ar ? student.name.ar : student.name?.en || `Student #${student.id}`}
                                </h4>
                                <CreatePlanForm
                                    halaqaId={createdHalaqa.id}
                                    students={[student]}
                                    activities={activities}
                                    onSuccess={() => {
                                        // Refresh halaqa data after plan creation
                                        queryClient.invalidateQueries({ queryKey: ['halaqa', createdHalaqa.id] });
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between gap-4 pt-4 border-t border-gray-200">
                        <Button
                            type="button"
                            variant="primary"
                            onClick={handleFinish}
                        >
                            {t('common.finish', 'Finish')}
                        </Button>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-4 pb-6 border-b border-gray-200">
                <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                        currentStep >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                        1
                    </div>
                    <span className="text-sm font-medium">{t('halaqa.step1', 'Halaqa Details')}</span>
                </div>
                <ChevronRightIcon width={20} height={20} className="text-gray-400" />
                <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                        currentStep >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                        2
                    </div>
                    <span className="text-sm font-medium">{t('halaqa.step2', 'Create Plans (Optional)')}</span>
                </div>
            </div>

            {/* Step Content */}
            {currentStep === 1 ? renderStep1() : renderStep2()}
        </div>
    );
};

export default CreateHalaqaForm;

