import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWatch } from 'react-hook-form';
import { useFormWithValidation } from '@/utils';
import { FormInput, FormSelect, Button } from '@/globals/components';
import SelectRFH from '@/globals/components/ui/SelectRFH';
import { useCreatePlan, useHalaqa } from '../hooks/useHalaqas';
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
import { quranSegmentsService, type QuranSegment, type SegmentAfterResponse } from '../services/quran-segments.service';
import SegmentViewer from './SegmentViewer';

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
    const planType = useWatch({
        control,
        name: 'plan_type'
    });
    const dailyAmount = useWatch({
        control,
        name: 'daily_amount'
    });

    // Fetch halaqa data for duration
    const { data: halaqaData } = useHalaqa(halaqaId);
    const halaqa = halaqaData?.data?.data || halaqaData?.data;
    const durationInDays = halaqa?.duration_in_days || 0;

    // Segment selection state
    const [pageNumber, setPageNumber] = useState<number | undefined>(undefined);
    const [segments, setSegments] = useState<QuranSegment[]>([]);
    const [selectedStartSegment, setSelectedStartSegment] = useState<QuranSegment | null>(null);
    const [endSegmentData, setEndSegmentData] = useState<SegmentAfterResponse | null>(null);
    const [isLoadingSegments, setIsLoadingSegments] = useState(false);
    const [isLoadingEndSegment, setIsLoadingEndSegment] = useState(false);
    
    // End segment selection state (for start_end plan type)
    const [selectedEndSegment, setSelectedEndSegment] = useState<QuranSegment | null>(null);
    const [endSegmentViewData, setEndSegmentViewData] = useState<SegmentAfterResponse | null>(null);

    // Fetch segments when page number is set
    useEffect(() => {
        if (currentUnit === 'segments' && pageNumber && pageNumber >= 1 && pageNumber <= 604) {
            setIsLoadingSegments(true);
            quranSegmentsService
                .getSegmentsByPage(pageNumber)
                .then((data: any) => {
                    // Handle different response formats
                    const segs = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
                    setSegments(segs);
                })
                .catch((error) => {
                    console.error('Error fetching segments:', error);
                    toast.error(t('quran.errorFetchingSegments', 'Error fetching segments'));
                    setSegments([]);
                })
                .finally(() => {
                    setIsLoadingSegments(false);
                });
        } else {
            setSegments([]);
        }
    }, [pageNumber, currentUnit, t]);

    // Calculate segments_number and fetch end segment when start segment is selected (only for daily_amount)
    useEffect(() => {
        if (
            currentUnit === 'segments' &&
            planType === 'daily_amount' &&
            selectedStartSegment &&
            dailyAmount > 0 &&
            durationInDays > 0
        ) {
            const segmentsNumber = dailyAmount * durationInDays;
            setIsLoadingEndSegment(true);
            quranSegmentsService
                .getSegmentAfter(selectedStartSegment.id, segmentsNumber)
                .then((data) => {
                    setEndSegmentData(data);
                    // Auto-set the start_segment_id in the form
                    setValue('start_segment_id', selectedStartSegment.id);
                })
                .catch((error) => {
                    console.error('Error fetching end segment:', error);
                    toast.error(t('quran.errorFetchingEndSegment', 'Error fetching end segment'));
                    setEndSegmentData(null);
                })
                .finally(() => {
                    setIsLoadingEndSegment(false);
                });
        } else if (planType !== 'daily_amount') {
            setEndSegmentData(null);
        }
    }, [selectedStartSegment, dailyAmount, durationInDays, currentUnit, planType, setValue, t]);


    // Fetch end segment details when end segment is selected (for start_end plan type)
    useEffect(() => {
        if (currentUnit === 'segments' && planType === 'start_end' && selectedEndSegment) {
            // Fetch the segment details to show the last verse
            quranSegmentsService
                .getSegmentAfter(selectedEndSegment.id, 1)
                .then((data) => {
                    setEndSegmentViewData(data);
                    setValue('end_segment_id', selectedEndSegment.id);
                })
                .catch((error) => {
                    console.error('Error fetching end segment details:', error);
                    setEndSegmentViewData(null);
                });
        } else {
            setEndSegmentViewData(null);
        }
    }, [selectedEndSegment, currentUnit, planType, setValue]);

    // Clear start fields when unit changes
    useEffect(() => {
        if (currentUnit) {
            setValue('start_segment_id', undefined);
            setValue('start_juz_number', undefined);
            setValue('start_surah_id', undefined);
            setValue('end_segment_id', undefined);
            setPageNumber(undefined);
            setSegments([]);
            setSelectedStartSegment(null);
            setEndSegmentData(null);
            setSelectedEndSegment(null);
            setEndSegmentViewData(null);
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
            ...(data.unit === 'surahs' && data.start_surah_id && { start_surah_id: data.start_surah_id }),
            // Include end_segment_id when plan_type is start_end and unit is segments
            ...(data.unit === 'segments' && data.plan_type === 'start_end' && data.end_segment_id && { end_segment_id: data.end_segment_id })
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
                    // Reset segment selection state
                    setPageNumber(undefined);
                    setSegments([]);
                    setSelectedStartSegment(null);
                    setEndSegmentData(null);
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

            {/* Daily Amount */}
            <FormInput
                name="daily_amount"
                control={control}
                label={t('plan.dailyAmount', 'Daily Amount')}
                required
                type="number"
                error={errors.daily_amount?.message}
            />

            {/* Conditional Start Fields based on Unit */}
            {currentUnit === 'segments' && (
                <div className="space-y-4">
                    {/* Page Number Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('quran.pageNumber', 'Page Number')}
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="604"
                            value={pageNumber || ''}
                            onChange={(e) => {
                                const value = e.target.value ? parseInt(e.target.value) : undefined;
                                if (value && value >= 1 && value <= 604) {
                                    setPageNumber(value);
                                } else if (!value) {
                                    setPageNumber(undefined);
                                }
                            }}
                            placeholder={t('quran.enterPageNumber', 'Enter page number (1-604)')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Segments List */}
                    {pageNumber && (
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                {t('quran.segmentsForPage', 'Segments for Page')} {pageNumber}
                            </h4>
                            {isLoadingSegments ? (
                                <div className="text-center py-4">
                                    <p className="text-sm text-gray-500">
                                        {t('common.loading', 'Loading...')}
                                    </p>
                                </div>
                            ) : segments.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">
                                    {t('quran.noSegmentsFound', 'No segments found for this page')}
                                </p>
                            ) : (
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {segments.map((segment) => (
                                        <button
                                            key={segment.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedStartSegment(segment);
                                            }}
                                            className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                                                selectedStartSegment?.id === segment.id
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 bg-white hover:border-blue-300'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold text-gray-900 mb-1.5">
                                                        {t('quran.segment', 'Segment')} {segment.segment_number}
                                                    </p>
                                                    <div className="space-y-0.5">
                                                        <p className="text-xs text-gray-600">
                                                            {t('quran.firstAyah', 'First Ayah')}: {segment.first_verse_key.split(':')[1]}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {segment.first_verse_key.split(':')[1] === segment.last_verse_key.split(':')[1]
                                                                ? segment.first_verse_key.split(':')[1]
                                                                : `${segment.first_verse_key.split(':')[1]} to ${segment.last_verse_key.split(':')[1]}`
                                                            }
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-gray-200">
                                                            <span className="text-xs text-gray-500">
                                                                {t('quran.juz', 'Juz')}: {segment.juz_number}
                                                            </span>
                                                            <span className="text-xs text-gray-400">•</span>
                                                            <span className="text-xs text-gray-500">
                                                                {t('quran.surah', 'Surah')}: {segment.surah_number}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {selectedStartSegment?.id === segment.id && (
                                                    <span className="text-blue-600 text-sm font-semibold ml-2">
                                                        ✓
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Start Segment Info */}
                    {selectedStartSegment && (
                        <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                            <h4 className="text-sm font-semibold text-blue-900 mb-2">
                                {t('quran.selectedStartSegment', 'Selected Start Segment')}
                            </h4>
                            <p className="text-sm text-blue-800">
                                {t('quran.segment', 'Segment')} {selectedStartSegment.segment_number}:{' '}
                                {selectedStartSegment.first_verse_key} - {selectedStartSegment.last_verse_key}
                            </p>
                            {dailyAmount > 0 && durationInDays > 0 && (
                                <p className="text-xs text-blue-700 mt-2">
                                    {t('quran.totalSegments', 'Total segments')}: {dailyAmount * durationInDays}
                                </p>
                            )}
                        </div>
                    )}

                    {/* End Segment Selection (for start_end plan type) */}
                    {planType === 'start_end' && pageNumber && segments.length > 0 && (
                        <div className="space-y-4">
                            <div className="border-t border-gray-200 pt-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                    {t('quran.selectEndSegment', 'Select End Segment')}
                                </h4>

                                {/* End Segments List (using same segments from the page) */}
                                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                    <h5 className="text-sm font-semibold text-gray-700 mb-3">
                                        {t('quran.segmentsForPage', 'Segments for Page')} {pageNumber}
                                    </h5>
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {segments.map((segment) => (
                                            <button
                                                key={segment.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedEndSegment(segment);
                                                }}
                                                className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                                                    selectedEndSegment?.id === segment.id
                                                        ? 'border-green-500 bg-green-50'
                                                        : 'border-gray-200 bg-white hover:border-green-300'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <p className="text-sm font-semibold text-gray-900 mb-1.5">
                                                            {t('quran.segment', 'Segment')} {segment.segment_number}
                                                        </p>
                                                        <div className="space-y-0.5">
                                                            <p className="text-xs text-gray-600">
                                                                {t('quran.firstAyah', 'First Ayah')}: {segment.first_verse_key.split(':')[1]}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {segment.first_verse_key.split(':')[1] === segment.last_verse_key.split(':')[1]
                                                                    ? segment.first_verse_key.split(':')[1]
                                                                    : `${segment.first_verse_key.split(':')[1]} to ${segment.last_verse_key.split(':')[1]}`
                                                                }
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-gray-200">
                                                                <span className="text-xs text-gray-500">
                                                                    {t('quran.juz', 'Juz')}: {segment.juz_number}
                                                                </span>
                                                                <span className="text-xs text-gray-400">•</span>
                                                                <span className="text-xs text-gray-500">
                                                                    {t('quran.surah', 'Surah')}: {segment.surah_number}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {selectedEndSegment?.id === segment.id && (
                                                        <span className="text-green-600 text-sm font-semibold ml-2">
                                                            ✓
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* End Segment Viewer */}
                                {endSegmentViewData && (
                                    <div className="border border-green-200 rounded-lg p-4 bg-green-50 mt-4">
                                        <h4 className="text-sm font-semibold text-green-900 mb-3">
                                            {t('quran.endSegment', 'End Segment')}
                                        </h4>
                                        <div className="mb-3 p-3 bg-white rounded-lg border border-green-200">
                                            <p className="text-sm font-semibold text-green-900 mb-1.5">
                                                {t('quran.segment', 'Segment')} {endSegmentViewData.target_segment.segment_number}
                                            </p>
                                            <div className="space-y-0.5">
                                                <p className="text-xs text-gray-600">
                                                    {t('quran.firstAyah', 'First Ayah')}: {endSegmentViewData.target_segment.first_verse_key.split(':')[1]}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {endSegmentViewData.target_segment.first_verse_key.split(':')[1] === endSegmentViewData.target_segment.last_verse_key.split(':')[1]
                                                        ? endSegmentViewData.target_segment.first_verse_key.split(':')[1]
                                                        : `${endSegmentViewData.target_segment.first_verse_key.split(':')[1]} to ${endSegmentViewData.target_segment.last_verse_key.split(':')[1]}`
                                                    }
                                                </p>
                                                <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-gray-200">
                                                    {endSegmentViewData.target_segment.juz_number && (
                                                        <>
                                                            <span className="text-xs text-gray-500">
                                                                {t('quran.juz', 'Juz')}: {endSegmentViewData.target_segment.juz_number}
                                                            </span>
                                                            <span className="text-xs text-gray-400">•</span>
                                                        </>
                                                    )}
                                                    <span className="text-xs text-gray-500">
                                                        {t('quran.surah', 'Surah')}: {endSegmentViewData.target_segment.surah_number}
                                                    </span>
                                                    <span className="text-xs text-gray-400">•</span>
                                                    <span className="text-xs text-gray-500">
                                                        {t('quran.page', 'Page')}: {endSegmentViewData.target_segment.page_number}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="max-h-96 overflow-y-auto">
                                            <SegmentViewer
                                                verses={endSegmentViewData.verses.length > 0 ? [endSegmentViewData.verses[endSegmentViewData.verses.length - 1]] : []}
                                                segmentInfo={{
                                                    first_verse_key: endSegmentViewData.target_segment.first_verse_key,
                                                    last_verse_key: endSegmentViewData.target_segment.last_verse_key,
                                                    surah_number: endSegmentViewData.target_segment.surah_number
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* End Segment Viewer (for daily_amount plan type) */}
                    {planType === 'daily_amount' && isLoadingEndSegment && (
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <p className="text-sm text-gray-500 text-center">
                                {t('quran.calculatingEndSegment', 'Calculating end segment...')}
                            </p>
                        </div>
                    )}

                    {planType === 'daily_amount' && endSegmentData && (
                        <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                            <h4 className="text-sm font-semibold text-green-900 mb-3">
                                {t('quran.endSegment', 'End Segment')}
                            </h4>
                            <div className="mb-3 p-3 bg-white rounded-lg border border-green-200">
                                <p className="text-sm font-semibold text-green-900 mb-1.5">
                                    {t('quran.segment', 'Segment')} {endSegmentData.target_segment.segment_number}
                                </p>
                                <div className="space-y-0.5">
                                    <p className="text-xs text-gray-600">
                                        {t('quran.firstAyah', 'First Ayah')}: {endSegmentData.target_segment.first_verse_key.split(':')[1]}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {endSegmentData.target_segment.first_verse_key.split(':')[1] === endSegmentData.target_segment.last_verse_key.split(':')[1]
                                            ? endSegmentData.target_segment.first_verse_key.split(':')[1]
                                            : `${endSegmentData.target_segment.first_verse_key.split(':')[1]} to ${endSegmentData.target_segment.last_verse_key.split(':')[1]}`
                                        }
                                    </p>
                                    <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-gray-200">
                                        {endSegmentData.target_segment.juz_number && (
                                            <>
                                                <span className="text-xs text-gray-500">
                                                    {t('quran.juz', 'Juz')}: {endSegmentData.target_segment.juz_number}
                                                </span>
                                                <span className="text-xs text-gray-400">•</span>
                                            </>
                                        )}
                                        <span className="text-xs text-gray-500">
                                            {t('quran.surah', 'Surah')}: {endSegmentData.target_segment.surah_number}
                                        </span>
                                        <span className="text-xs text-gray-400">•</span>
                                        <span className="text-xs text-gray-500">
                                            {t('quran.page', 'Page')}: {endSegmentData.target_segment.page_number}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                <SegmentViewer
                                    verses={endSegmentData.verses.length > 0 ? [endSegmentData.verses[endSegmentData.verses.length - 1]] : []}
                                    segmentInfo={{
                                        first_verse_key: endSegmentData.target_segment.first_verse_key,
                                        last_verse_key: endSegmentData.target_segment.last_verse_key,
                                        surah_number: endSegmentData.target_segment.surah_number
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Hidden inputs for segment IDs */}
                    <input
                        type="hidden"
                        {...control.register('start_segment_id')}
                    />
                    <input
                        type="hidden"
                        {...control.register('end_segment_id')}
                    />
                </div>
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

