import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormWithValidation } from '@/utils';
import { FormInput, FormSelect, Button } from '@/globals/components';
import SelectRFH from '@/globals/components/ui/SelectRFH';
import Select from 'react-select';
import { useAuthStore } from '@/stores';
import { useCreateHalaqa, useCheckAvailability } from '../hooks/useHalaqas';
import { useCreateHalaqaFormQueries } from '../hooks/useCreateHalaqaFormQueries';
import type { CreateHalaqaPayload, CheckAvailabilityPayload, CheckAvailabilityResponse } from '../services/halaqas.service';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import {
    HALAQA_PERIODS,
    HALAQA_ACTIVITIES,
    HALAQA_TEACHING_METHODS,
    HALAQA_WEEKLY_HOLIDAYS,
    HALAQA_EVALUATION_SYSTEM_TYPES
} from '../config';
import { createHalaqaSchema, CreateHalaqaFormData } from '../schemas/halaqa.schema';
import { AlertTriangleIcon, ClipboardCheckIcon, CircleIcon } from '@/globals/icons';

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
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { lang } = useParams<{ lang: string }>();
    const queryClient = useQueryClient();
    const createHalaqaMutation = useCreateHalaqa();

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
            weekly_holiday: [],
            evaluation_system_type: 'رقمي',
            custom_total_mark: undefined,
            max_students: undefined,
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
    const evaluationSystemType = useWatch({
        control,
        name: 'evaluation_system_type'
    });

    // Watch fields needed for availability check
    const teacherId = useWatch({ control, name: 'teacher_id' });
    const startDate = useWatch({ control, name: 'start_date' });
    const endDate = useWatch({ control, name: 'end_date' });
    const period = useWatch({ control, name: 'period' });
    const sessionTime = useWatch({ control, name: 'session_time' });
    const activities = useWatch({ control, name: 'activities' });

    // State for availability check result
    const [availabilityResult, setAvailabilityResult] = useState<CheckAvailabilityResponse | null>(null);

    // Clear platform_id when teaching method changes to in_person
    useEffect(() => {
        if (teachingMethod === 'in_person') {
            setValue('platform_id', undefined);
        }
    }, [teachingMethod, setValue]);

    useEffect(() => {
        if (evaluationSystemType !== 'رقمي') {
            setValue('custom_total_mark', undefined);
        }
    }, [evaluationSystemType, setValue]);

    // Force tasbit to be included when hifz is selected (handled in Controller onChange)
    // Keeping this as a backup in case the direct onChange doesn't catch all cases
    useEffect(() => {
        if (Array.isArray(activities) && activities.length > 0) {
            const hasHifz = activities.includes('hifz');
            const hasTasbit = activities.includes('tasbit');

            if (hasHifz && !hasTasbit) {
                // If hifz is selected but tasbit is not, add tasbit
                setValue('activities', [...activities, 'tasbit'], {
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: false
                });
            }
        }
    }, [activities, setValue]);

    // Clear availability result when form fields change
    useEffect(() => {
        setAvailabilityResult(null);
    }, [teacherId, startDate, endDate, period, sessionTime]);

    // Check availability mutation
    const checkAvailabilityMutation = useCheckAvailability();

    // Check if all required fields are filled for availability check
    const canCheckAvailability = useMemo(() => {
        return !!(
            teacherId &&
            startDate &&
            endDate &&
            period &&
            sessionTime
        );
    }, [teacherId, startDate, endDate, period, sessionTime]);

    // Handle availability check button click
    const handleCheckAvailability = useCallback(() => {
        if (!canCheckAvailability) return;

        const payload: CheckAvailabilityPayload = {
            teacher_id: teacherId,
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
    }, [canCheckAvailability, teacherId, startDate, endDate, period, sessionTime, checkAvailabilityMutation, t]);

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
        platformsOptions,
        isLoadingTeachers,
        isLoadingPlatforms,
    } = useCreateHalaqaFormQueries({ includeStudents: false });

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

    const weeklyHolidayOptions = useMemo(() =>
        HALAQA_WEEKLY_HOLIDAYS.map((day) => ({
            value: day.value,
            label: t(day.labelKey, day.label)
        })), [t]
    );

    const evaluationSystemOptions = useMemo(() =>
        HALAQA_EVALUATION_SYSTEM_TYPES.map((item) => ({
            value: item.value,
            label: t(item.labelKey, item.label)
        })), [t]
    );

    const getErrorMessage = useCallback(
        (message?: string) => (message ? t(message, message) : undefined),
        [t]
    );

    const onSubmit = async (data: CreateHalaqaFormData) => {
        const memorization_program_entity_type_id = entity?.memorization_program_entity_type?.id ?? 0;
        const session_mode_id = entity?.session_mode?.id;

        // Build payload, excluding platform_id if teaching method is in_person
        const { platform_id, weekly_holiday, custom_total_mark, ...restData } = data;
        const payload: CreateHalaqaPayload = {
            ...restData,
            start_date: normalizeDate(data.start_date),
            end_date: normalizeDate(data.end_date),
            session_time: normalizeSessionTime(data.session_time),
            memorization_program_entity_type_id,
            ...(session_mode_id != null && { session_mode_id }),
            ...(Array.isArray(weekly_holiday) && weekly_holiday.length > 0
                ? { weekly_holiday: weekly_holiday.join(',') }
                : {}),
            ...(data.evaluation_system_type === 'رقمي' && typeof custom_total_mark === 'number'
                ? { custom_total_mark }
                : {}),
            // Only include platform_id if teaching method is not in_person and it has a value
            ...(data.teaching_method !== 'in_person' && platform_id ? { platform_id } : {})
        };
        createHalaqaMutation.mutate(payload, {
            onSuccess: () => {
                toast.success(t('halaqa.createSuccess', 'Halaqa created successfully'));
                queryClient.invalidateQueries({ queryKey: ['halaqas'] });
                navigate(`/${lang || 'ar'}/halaqas`);
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
                    error={getErrorMessage(errors.name?.en?.message)}
                />
                <FormInput
                    name="name.ar"
                    control={control}
                    label={t('halaqa.nameAr', 'Name (Arabic)')}
                    required
                    error={getErrorMessage(errors.name?.ar?.message)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {/* Teacher */}
                <SelectRFH
                    name="teacher_id"
                    control={control}
                    label={t('halaqa.teacher', 'Teacher')}
                    required
                    options={teachersOptions}
                    loading={isLoadingTeachers}
                    error={getErrorMessage(errors.teacher_id?.message)}
                    placeholder={t('halaqa.selectTeacher', 'Select a teacher')}
                />
                <SelectRFH
                    name="weekly_holiday"
                    control={control}
                    label={t('halaqa.weeklyHoliday', 'Weekly holiday')}
                    isMulti
                    options={weeklyHolidayOptions}
                    error={getErrorMessage(errors.weekly_holiday?.message)}
                    placeholder={t('halaqa.selectWeeklyHoliday', 'Select weekly holidays')}
                />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                    name="start_date"
                    control={control}
                    label={t('halaqa.startDate', 'Start Date')}
                    required
                    type="date"
                    error={getErrorMessage(errors.start_date?.message)}
                />
                <FormInput
                    name="end_date"
                    control={control}
                    label={t('halaqa.endDate', 'End Date')}
                    required
                    type="date"
                    error={getErrorMessage(errors.end_date?.message)}
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
                <FormSelect
                    name="period"
                    control={control}
                    label={t('halaqa.period', 'Period')}
                    required
                    options={periodOptions}
                    error={getErrorMessage(errors.period?.message)}
                    className="w-full "
                />
                <Controller
                    name="activities"
                    control={control}
                    render={({ field, fieldState }) => {
                        const handleChange = (selectedOptions: any) => {
                            let selectedValues: string[] = [];

                            if (selectedOptions) {
                                if (Array.isArray(selectedOptions)) {
                                    selectedValues = selectedOptions.map((opt: any) => opt.value || opt.id);
                                } else {
                                    selectedValues = [selectedOptions.value || selectedOptions.id];
                                }
                            }

                            const hasHifz = selectedValues.includes('hifz');
                            const hasTasbit = selectedValues.includes('tasbit');

                            if (hasHifz && !hasTasbit) {
                                selectedValues = [...selectedValues, 'tasbit'];
                            }

                            field.onChange(selectedValues);
                        };

                        const currentValue = field.value || [];
                        const selectedOptions = Array.isArray(currentValue)
                            ? currentValue
                                .map(val => activityOptions.find(opt => opt.value === val))
                                .filter(Boolean)
                            : [];

                        return (
                            <div>
                                <label
                                    htmlFor="activities"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    {t('halaqa.activities', 'Activities')}
                                    <span className="text-red-500 ml-1">*</span>
                                </label>
                                <Select
                                    isMulti
                                    value={selectedOptions as any}
                                    options={activityOptions}
                                    onChange={handleChange}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    placeholder={t('halaqa.selectActivities', 'Select activities')}
                                    className="react-select w-full"
                                    classNamePrefix="react-select"
                                    menuPortalTarget={document.body}
                                    menuPosition="fixed"
                                    getOptionValue={(option: any) => String(option.value ?? option.id ?? '')}
                                    getOptionLabel={(option: any) => option.label ?? option.name ?? ''}
                                    styles={{
                                        control: (base: any, state: any) => ({
                                            ...base,
                                            borderColor: fieldState.error ? '#ef4444' : state.isFocused ? '#004247' : '#d1d5db',
                                            boxShadow: state.isFocused
                                                ? (fieldState.error ? '0 0 0 1px #ef4444' : '0 0 0 1px #004247')
                                                : 'none',
                                            minHeight: '48px',
                                            '&:hover': {
                                                borderColor: fieldState.error ? '#ef4444' : '#004247'
                                            }
                                        }),
                                        menu: (base: any) => ({
                                            ...base,
                                            zIndex: 9999
                                        }),
                                        menuPortal: (base: any) => ({
                                            ...base,
                                            zIndex: 9999
                                        }),
                                        option: (base: any, state: any) => ({
                                            ...base,
                                            backgroundColor: state.isSelected
                                                ? '#004247'
                                                : state.isFocused
                                                    ? '#f0f9fa'
                                                    : 'white',
                                            color: state.isSelected ? 'white' : '#374151',
                                            cursor: 'pointer',
                                            '&:active': {
                                                backgroundColor: '#004247',
                                                color: 'white'
                                            }
                                        })
                                    }}
                                />
                                <p className="mt-1 h-4 text-xs text-red-600" role="alert">
                                    {getErrorMessage((fieldState.error?.message || errors.activities?.message) ?? '') ?? ''}
                                </p>
                                {Array.isArray(field.value) && field.value.includes('hifz') && (
                                    <p className="mt-1 text-xs text-blue-600">
                                        {t('halaqa.hifzRequiresTasbit', 'Note: Hifz automatically includes Tasbit')}
                                    </p>
                                )}
                            </div>
                        );
                    }}
                />
            </div>

            <div className={`grid grid-cols-1 gap-4 items-start ${evaluationSystemType === 'رقمي' ? 'xl:grid-cols-3' : 'xl:grid-cols-2'}`}>
                    <FormSelect
                        name="evaluation_system_type"
                        control={control}
                        label={t('halaqa.evaluationSystemType', 'Evaluation system type')}
                        required
                        options={evaluationSystemOptions}
                        error={getErrorMessage(errors.evaluation_system_type?.message)}
                        placeholder={t('halaqa.selectEvaluationSystemType', 'Select evaluation system type')}
                    />
                {evaluationSystemType === 'رقمي' && (
                    <FormInput
                        name="custom_total_mark"
                        control={control}
                        label={t('halaqa.customTotalMark', 'Custom total mark')}
                        required
                        type="number"
                        error={getErrorMessage(errors.custom_total_mark?.message)}
                    />
                )}
                <FormInput
                    name="max_students"
                    control={control}
                    label={t('halaqa.maxStudents', 'Maximum students')}
                    required
                    type="number"
                    error={getErrorMessage(errors.max_students?.message)}
                />
            </div>

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
                                        className={`w-full px-4 py-3 border outline-none rounded-lg focus:border-primary-600 transition-colors duration-200 ${fieldState.error ? 'border-red-300 focus:border-red-500' : 'border-gray-300'
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
                                        className={`w-full px-4 py-3 border outline-none rounded-lg focus:border-primary-600 transition-colors duration-200 ${fieldState.error ? 'border-red-300 focus:border-red-500' : 'border-gray-300'
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
                    <p className="mt-1 text-xs text-red-600">{getErrorMessage(errors.session_time.message)}</p>
                )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
                <div className={teachingMethod && teachingMethod !== 'in_person' ? '' : 'xl:col-span-2'}>
                    <FormSelect
                        name="teaching_method"
                        control={control}
                        label={t('halaqa.teachingMethod', 'Teaching Method')}
                        required
                        options={teachingMethodOptions}
                        error={getErrorMessage(errors.teaching_method?.message)}
                    />
                </div>

                {/* Platform - Only show if teaching method is not in_person */}
                {teachingMethod && teachingMethod !== 'in_person' && (
                    <SelectRFH
                        name="platform_id"
                        control={control}
                        label={t('halaqa.platform', 'Platform')}
                        required
                        options={platformsOptions}
                        loading={isLoadingPlatforms}
                        error={getErrorMessage(errors.platform_id?.message)}
                        placeholder={t('halaqa.selectPlatform', 'Select a platform')}
                    />
                )}
            </div>

            {/* Availability Check Button */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">
                            {t('halaqa.checkAvailability', 'Check Availability')}
                        </h3>
                        <p className="text-xs text-gray-600">
                            {t('halaqa.checkAvailabilityDescription', 'Verify teacher availability before creating the halaqa')}
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
                        <div className={`flex items-center gap-3 p-4 rounded-lg border-2 ${isAvailable
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
                                                {availabilityResult.conflicts.teacher.ar || availabilityResult.conflicts.teacher.en}
                                            </span>
                                        </div>
                                    )}
                                    {!availabilityResult.conflicts.teacher && (
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
                    {createHalaqaMutation.isPending ? t('common.loading', 'Loading...') : t('halaqa.createTitle', 'Create Halaqa')}
                </Button>
            </div>
        </form>
    );
};

export default CreateHalaqaForm;

