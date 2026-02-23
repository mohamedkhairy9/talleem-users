import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWatch } from 'react-hook-form';
import { useFormWithValidation } from '@/utils';
import { FormInput, FormSelect, Button } from '@/globals/components';
import SelectRFH from '@/globals/components/ui/SelectRFH';
import { useCreatePlan, useHalaqa } from '../hooks/useHalaqas';
import { useCreateHalaqaFormQueries } from '../hooks/useCreateHalaqaFormQueries';
import type { CreatePlanPayload, CreatePlanResponseData } from '../services/halaqas.service';
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
import MushafPageModal from './MushafPageModal';
import { loadSurahData, getJuzFirstVerseKey, getSurahFirstVerseKey, type SurahDataMap } from '@/utils/helpers/surahHelper';
import { ChevronRightIcon, BookOpenIcon } from '@/globals/icons';

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
            student_ids: [],
            plan_type: 'daily_amount',
            unit: 'segments',
            direction: 'incremental',
            start_segment_verse_key: undefined,
            start_juz_number: undefined,
            start_surah_id: undefined,
            end_segment_verse_key: undefined,
            end_juz_number: undefined,
            end_surah_id: undefined,
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
    const [isLoadingEndSegment] = useState(false);
    
    // End segment selection state (for start_end plan type)
    const [endPageNumber, setEndPageNumber] = useState<number | undefined>(undefined);
    const [endSegments, setEndSegments] = useState<QuranSegment[]>([]);
    const [selectedEndSegment, setSelectedEndSegment] = useState<QuranSegment | null>(null);
    const [endSegmentViewData, setEndSegmentViewData] = useState<SegmentAfterResponse | null>(null);
    const [isLoadingEndSegments, setIsLoadingEndSegments] = useState(false);
    
    // Mushaf modal state
    const [showMushafModal, setShowMushafModal] = useState(false);
    const [mushafPageNumber, setMushafPageNumber] = useState<number | undefined>(undefined);
    const [selectedAyahsForMushaf, setSelectedAyahsForMushaf] = useState<Set<string>>(new Set());
    
    // Plan mushaf viewer state
    const [showPlanMushafViewer, setShowPlanMushafViewer] = useState(false);
    const [planStartVerseKey, setPlanStartVerseKey] = useState<string | undefined>(undefined);
    const [planEndVerseKey, setPlanEndVerseKey] = useState<string | undefined>(undefined);
    
    // Surah data state
    const [surahData, setSurahData] = useState<SurahDataMap | null>(null);

    // Plan preview state (after calling API with save_or_not: 0)
    const [planPreviewData, setPlanPreviewData] = useState<CreatePlanResponseData | null>(null);

    // Load surah data on mount
    useEffect(() => {
        loadSurahData()
            .then((data) => {
                setSurahData(data);
            })
            .catch((error) => {
                console.error('Error loading surah data:', error);
            });
    }, []);

    // Helper function to get surah name
    const getSurahName = React.useCallback((surahNumber: number | undefined): string => {
        if (!surahNumber || !surahData) return '';
        const surah = surahData[String(surahNumber)];
        if (!surah) return '';
        return currentLang === 'ar' ? surah.name_arabic : (surah.name_simple || surah.name);
    }, [surahData, currentLang]);

    // Create surah options for dropdown
    const surahOptions = React.useMemo(() => {
        if (!surahData) return [];
        
        return Object.keys(surahData)
            .sort((a, b) => Number(a) - Number(b))
            .map((key) => {
                const surah = surahData[key];
                const displayName = currentLang === 'ar' 
                    ? surah.name_arabic 
                    : (surah.name_simple || surah.name);
                return {
                    value: surah.id,
                    label: `${surah.id}. ${displayName}`
                };
            });
    }, [surahData, currentLang]);

    // Clear selected segments when page number changes
    useEffect(() => {
        if (currentUnit === 'segments') {
            // Clear all segment-related state when page number changes
            setSelectedStartSegment(null);
            setSelectedEndSegment(null);
            setEndSegmentData(null);
            setEndSegmentViewData(null);
            setValue('start_segment_verse_key', undefined);
            setValue('end_segment_verse_key', undefined);
            setValue('end_juz_number', undefined);
            setValue('end_surah_id', undefined);
        }
    }, [pageNumber, currentUnit, setValue]);

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

    // Fetch end segments when end page number is set (for start_end plan type)
    useEffect(() => {
        if (currentUnit === 'segments' && planType === 'start_end' && endPageNumber && endPageNumber >= 1 && endPageNumber <= 604) {
            setIsLoadingEndSegments(true);
            quranSegmentsService
                .getSegmentsByPage(endPageNumber)
                .then((data: any) => {
                    // Handle different response formats
                    const segs = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
                    setEndSegments(segs);
                })
                .catch((error) => {
                    console.error('Error fetching end segments:', error);
                    toast.error(t('quran.errorFetchingSegments', 'Error fetching segments'));
                    setEndSegments([]);
                })
                .finally(() => {
                    setIsLoadingEndSegments(false);
                });
        } else {
            setEndSegments([]);
        }
    }, [endPageNumber, currentUnit, planType, t]);

    // For daily_amount with segments: set start_segment_verse_key when user selects a segment.
    // End of plan is now obtained from plan preview API (save_or_not: 0), not from segment/after.
    useEffect(() => {
        if (currentUnit === 'segments' && selectedStartSegment) {
            setValue('start_segment_verse_key', selectedStartSegment.first_verse_key);
        }
        if (planType !== 'daily_amount') {
            setEndSegmentData(null);
        }
    }, [selectedStartSegment, currentUnit, planType, setValue]);


    // Fetch end segment details when end segment is selected (for start_end plan type)
    useEffect(() => {
        if (currentUnit === 'segments' && planType === 'start_end' && selectedEndSegment) {
            const direction = watch('direction') || 'incremental';
            // Fetch the segment details to show the last verse
            quranSegmentsService
                .getSegmentAfter(selectedEndSegment.id, 1, direction)
                .then((data) => {
                    setEndSegmentViewData(data);
                    // Set the end_segment_verse_key using first_verse_key from selected segment
                    setValue('end_segment_verse_key', selectedEndSegment.first_verse_key);
                })
                .catch((error) => {
                    console.error('Error fetching end segment details:', error);
                    setEndSegmentViewData(null);
                });
        } else {
            setEndSegmentViewData(null);
        }
    }, [selectedEndSegment, currentUnit, planType, setValue, watch]);

    // Clear start fields when unit changes
    useEffect(() => {
        if (currentUnit) {
            setValue('start_segment_verse_key', undefined);
            setValue('start_juz_number', undefined);
            setValue('start_surah_id', undefined);
            setValue('end_segment_verse_key', undefined);
            setValue('end_juz_number', undefined);
            setValue('end_surah_id', undefined);
            setPageNumber(undefined);
            setEndPageNumber(undefined);
            setSegments([]);
            setEndSegments([]);
            setSelectedStartSegment(null);
            setEndSegmentData(null);
            setSelectedEndSegment(null);
            setEndSegmentViewData(null);
        }
    }, [currentUnit, setValue]);

    // Clear end fields when plan type changes from start_end to daily_amount
    useEffect(() => {
        if (planType === 'daily_amount') {
            setValue('end_segment_verse_key', undefined);
            setValue('end_juz_number', undefined);
            setValue('end_surah_id', undefined);
            setEndPageNumber(undefined);
            setEndSegments([]);
            setSelectedEndSegment(null);
            setEndSegmentViewData(null);
        }
    }, [planType, setValue]);

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
        // Display "Juz" for parts unit, otherwise use translation
        label: unit.value === 'parts' ? t('plan.unit.juz', 'Juz') : t(unit.labelKey, unit.value)
    }));

    const directionOptions = PLAN_DIRECTIONS.map(direction => ({
        value: direction.value,
        label: t(direction.labelKey, direction.value)
    }));

    /** Build start_verse_key from form data based on unit (local: segments = selected, parts = juz first verse, surahs = surah:1) */
    const getStartVerseKey = (data: CreatePlanFormData): string | null => {
        if (data.unit === 'segments' && data.start_segment_verse_key) return data.start_segment_verse_key;
        if (data.unit === 'parts' && data.start_juz_number) return getJuzFirstVerseKey(data.start_juz_number);
        if (data.unit === 'surahs' && data.start_surah_id) return getSurahFirstVerseKey(data.start_surah_id);
        return null;
    };

    const buildPayload = (data: CreatePlanFormData, saveOrNot: 0 | 1): CreatePlanPayload | null => {
        const startVerseKey = getStartVerseKey(data);
        if (!startVerseKey || !data.student_ids?.length) return null;
        const payload: CreatePlanPayload = {
            activity: data.activity,
            student_ids: data.student_ids,
            plan_type: data.plan_type,
            unit: data.unit,
            direction: data.direction,
            start_verse_key: startVerseKey,
            save_or_not: saveOrNot,
            ...(data.plan_type === 'daily_amount' && data.daily_amount ? { daily_amount: data.daily_amount } : {}),
            ...(data.unit === 'segments' && data.plan_type === 'start_end' && data.end_segment_verse_key ? { end_segment_verse_key: data.end_segment_verse_key } : {}),
            ...(data.unit === 'parts' && data.plan_type === 'start_end' && data.end_juz_number ? { end_juz_number: data.end_juz_number } : {}),
            ...(data.unit === 'surahs' && data.plan_type === 'start_end' && data.end_surah_id ? { end_surah_id: data.end_surah_id } : {})
        };
        return payload;
    };

    const resetForm = () => {
        reset({
            activity: defaultActivity,
            student_ids: [],
            plan_type: 'daily_amount',
            unit: 'segments',
            direction: 'incremental',
            start_segment_verse_key: undefined,
            start_juz_number: undefined,
            start_surah_id: undefined,
            end_segment_verse_key: undefined,
            end_juz_number: undefined,
            end_surah_id: undefined,
            daily_amount: 0
        });
        setPageNumber(undefined);
        setSegments([]);
        setSelectedStartSegment(null);
        setEndSegmentData(null);
        setPlanPreviewData(null);
    };

    const onSubmit = async (data: CreatePlanFormData) => {
        const payload = buildPayload(data, 0);
        if (!payload) {
            toast.error(t('plan.invalidForm', 'Please fill all required fields.'));
            return;
        }
        createPlanMutation.mutate(
            { halaqaId, data: payload },
            {
                onSuccess: (res, variables) => {
                    // We sent save_or_not: 0 → this is preview only; plan is NOT created. Use response to show plan/Mushaf. Do not close form or show "created" toast.
                    const isPreviewRequest = variables?.data?.save_or_not === 0;
                    const response = res?.data ?? res;
                    const responseData = response?.data ?? response;
                    if (isPreviewRequest && responseData) {
                        setPlanPreviewData(responseData);
                        toast.info(t('plan.previewLoaded', 'Plan preview loaded. View in Mushaf below, then confirm to create.'));
                        return;
                    }
                    if (!isPreviewRequest) {
                        toast.success(t('plan.createSuccess', 'Plan created successfully'));
                        queryClient.invalidateQueries({ queryKey: ['halaqa', halaqaId] });
                        resetForm();
                        if (onSuccess) onSuccess();
                    }
                },
                onError: (error: any) => {
                    toast.error(error?.message || t('plan.createError', 'Error creating plan. Please try again.'));
                }
            }
        );
    };

    const handleConfirmSave = () => {
        const formValues = watch();
        const payload = buildPayload(formValues as CreatePlanFormData, 1);
        if (!payload) return;
        createPlanMutation.mutate(
            { halaqaId, data: payload },
            {
                onSuccess: () => {
                    toast.success(t('plan.createSuccess', 'Plan created successfully'));
                    queryClient.invalidateQueries({ queryKey: ['halaqa', halaqaId] });
                    setPlanPreviewData(null);
                    resetForm();
                    if (onSuccess) onSuccess();
                },
                onError: (error: any) => {
                    toast.error(error?.message || t('plan.createError', 'Error creating plan. Please try again.'));
                }
            }
        );
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Plan preview: data from API with save_or_not: 0 — not created yet; used to show plan and open in Mushaf; user confirms to create with save_or_not: 1 */}
            {planPreviewData && (
                <div className="rounded-lg border-2 border-primary-200 bg-primary-50 p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-primary-900">
                        {t('plan.previewTitle', 'Plan preview (not created yet)')}
                    </h3>
                    <p className="text-sm text-primary-800">
                        {t('plan.computedEnd', 'Computed end')}: <strong>{planPreviewData.computed_last_verse_key}</strong>
                    </p>
                    {planPreviewData.daily_schedule?.length > 0 && (
                        <div className="text-xs text-primary-700">
                            <span className="font-medium">{t('plan.dailySchedule', 'Daily schedule')}:</span>{' '}
                            {planPreviewData.daily_schedule.length} {t('plan.days', 'days')}
                            {planPreviewData.has_empty_days && (
                                <span className="ml-2 text-amber-700">({t('plan.hasEmptyDays', 'Has empty days')})</span>
                            )}
                        </div>
                    )}
                    {planPreviewData.warning && (
                        <p className="text-sm text-amber-700">{planPreviewData.warning}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                        <Button
                            type="button"
                            variant="primary"
                            loading={createPlanMutation.isPending}
                            disabled={createPlanMutation.isPending}
                            onClick={handleConfirmSave}
                        >
                            {createPlanMutation.isPending ? t('common.loading', 'Loading...') : t('plan.confirmAndSave', 'Confirm & Save')}
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            disabled={createPlanMutation.isPending}
                            onClick={() => setPlanPreviewData(null)}
                        >
                            {t('plan.backToEdit', 'Back to edit')}
                        </Button>
                        <button
                            type="button"
                            onClick={() => {
                                setPlanStartVerseKey(planPreviewData.start_verse_key);
                                setPlanEndVerseKey(planPreviewData.computed_last_verse_key);
                                setShowPlanMushafViewer(true);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-700 bg-primary-100 rounded-lg hover:bg-primary-200 transition-colors"
                        >
                            <BookOpenIcon width={18} height={18} />
                            {t('quran.viewFullPlan', 'View Full Plan in Mushaf')}
                        </button>
                    </div>
                </div>
            )}

            {/* Activity */}
            <FormSelect
                name="activity"
                control={control}
                label={t('plan.activity', 'Activity')}
                required
                options={activityOptions}
                error={errors.activity?.message}
            />

            {/* Students (multi-select) */}
            <SelectRFH
                name="student_ids"
                control={control}
                label={t('plan.students', 'Students')}
                required
                isMulti
                options={studentsOptions}
                loading={isLoadingStudents}
                error={errors.student_ids?.message}
                placeholder={t('plan.selectStudents', 'Select one or more students')}
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

            {/* Daily Amount - only show when plan_type is daily_amount */}
            {planType === 'daily_amount' && (
                <FormInput
                    name="daily_amount"
                    control={control}
                    label={t('plan.dailyAmount', 'Daily Amount')}
                    required
                    type="number"
                    error={errors.daily_amount?.message}
                />
            )}

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
                            onFocus={(e) => {
                                // Clear the input if value is 0 when user focuses
                                if (e.target.value === '0') {
                                    e.target.value = '';
                                    setPageNumber(undefined);
                                } else {
                                    // Select all text for easy replacement
                                    e.target.select();
                                }
                            }}
                            onChange={(e) => {
                                const inputValue = e.target.value;
                                // If input is empty or just whitespace, set to undefined
                                if (!inputValue || inputValue.trim() === '') {
                                    setPageNumber(undefined);
                                    return;
                                }
                                const value = parseInt(inputValue);
                                if (!isNaN(value) && value >= 1 && value <= 604) {
                                    setPageNumber(value);
                                } else if (value === 0) {
                                    // Allow 0 temporarily while typing, but clear on blur if still 0
                                    setPageNumber(undefined);
                                }
                            }}
                            placeholder={t('quran.enterPageNumber', 'Enter page number (1-604)')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                                                    ? 'border-primary-500 bg-primary-50'
                                                    : 'border-gray-200 bg-white hover:border-primary-300'
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
                                                                {t('quran.surah', 'Surah')}: {getSurahName(segment.surah_number) || segment.surah_number}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {selectedStartSegment?.id === segment.id && (
                                                    <span className="text-primary-600 text-sm font-semibold ml-2">
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

                    {/* Selected Segments Card (Start and End) */}
                    {selectedStartSegment && (
                        <div className="border border-primary-200 rounded-lg p-4 bg-primary-50">
                            <h4 className="text-sm font-semibold text-primary-900 mb-4">
                                {t('quran.selectedSegments', 'Selected Segments')}
                            </h4>
                            
                            <div className="flex items-center gap-4">
                                {/* Start Segment */}
                                <div className="flex-1 border border-primary-300 rounded-lg p-3 bg-white">
                                    <div className="mb-2">
                                        <span className="text-xs font-medium text-primary-600 uppercase">
                                            {t('quran.startSegment', 'Start')}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        {/* <p className="text-xs text-gray-600">
                                            {t('quran.verseKey', 'Verse')}: {selectedStartSegment.first_verse_key}
                                            {selectedStartSegment.first_verse_key !== selectedStartSegment.last_verse_key && ` - ${selectedStartSegment.last_verse_key}`}
                                        </p> */}
                                        <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-gray-200">
                                            <span className="text-xs text-gray-500">
                                                {t('quran.juz', 'Juz')}: {selectedStartSegment.juz_number}
                                            </span>
                                            <span className="text-xs text-gray-400">•</span>
                                            <span className="text-xs text-gray-500">
                                                {t('quran.surah', 'Surah')}: {getSurahName(selectedStartSegment.surah_number) || selectedStartSegment.surah_number}
                                            </span>
                                            <span className="text-xs text-gray-400">•</span>
                                            <span className="text-xs text-gray-500">
                                                {t('quran.page', 'Page')}: {selectedStartSegment.page_number}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMushafPageNumber(selectedStartSegment.page_number);
                                            const [startSurah, startAyah] = selectedStartSegment.first_verse_key.split(':').map(Number);
                                            const [endSurah, endAyah] = selectedStartSegment.last_verse_key.split(':').map(Number);
                                            const ayahs = new Set<string>();
                                            for (let s = startSurah; s <= endSurah; s++) {
                                                const startA = (s === startSurah) ? startAyah : 1;
                                                const endA = (s === endSurah) ? endAyah : 999;
                                                for (let a = startA; a <= endA; a++) {
                                                    ayahs.add(`${s}:${a}`);
                                                }
                                            }
                                            setSelectedAyahsForMushaf(ayahs);
                                            setShowMushafModal(true);
                                        }}
                                        className="mt-2 w-full px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-100 rounded-lg hover:bg-primary-200 transition-colors"
                                    >
                                        {t('quran.viewInMushaf', 'View in Mushaf')}
                                    </button>
                                </div>

                                {/* Arrow */}
                                {(planType === 'daily_amount' && (endSegmentData || planPreviewData)) || (planType === 'start_end' && (endSegmentViewData || selectedEndSegment)) ? (
                                    <div className="flex-shrink-0">
                                        <ChevronRightIcon 
                                            width={24} 
                                            height={24} 
                                            className="text-primary-500" 
                                        />
                                    </div>
                                ) : null}

                                {/* End Segment */}
                                {planType === 'daily_amount' && (endSegmentData || planPreviewData) && (
                                    <div className="flex-1 border border-primary-300 rounded-lg p-3 bg-white">
                                        <div className="mb-2">
                                            <span className="text-xs font-medium text-primary-600 uppercase">
                                                {t('quran.endSegment', 'End')}
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            {planPreviewData ? (
                                                <p className="text-xs text-gray-600">
                                                    {t('quran.verseKey', 'Verse')}: <strong>{planPreviewData.computed_last_verse_key}</strong>
                                                </p>
                                            ) : endSegmentData ? (
                                                <>
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
                                                            {t('quran.surah', 'Surah')}: {getSurahName(endSegmentData.target_segment.surah_number) || endSegmentData.target_segment.surah_number}
                                                        </span>
                                                        <span className="text-xs text-gray-400">•</span>
                                                        <span className="text-xs text-gray-500">
                                                            {t('quran.page', 'Page')}: {endSegmentData.target_segment.page_number}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setMushafPageNumber(endSegmentData.target_segment.page_number);
                                                            const [surah, ayah] = endSegmentData.target_segment.last_verse_key.split(':').map(Number);
                                                            setSelectedAyahsForMushaf(new Set([`${surah}:${ayah}`]));
                                                            setShowMushafModal(true);
                                                        }}
                                                        className="mt-2 w-full px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-100 rounded-lg hover:bg-primary-200 transition-colors"
                                                    >
                                                        {t('quran.viewInMushaf', 'View in Mushaf')}
                                                    </button>
                                                </>
                                            ) : null}
                                        </div>
                                    </div>
                                )}
                                
                                {/* End Segment Selection (for start_end plan type) */}
                                {planType === 'start_end' && (endSegmentViewData || selectedEndSegment) && (
                                    <div className="flex-1 border border-primary-300 rounded-lg p-3 bg-white">
                                        <div className="mb-2">
                                            <span className="text-xs font-medium text-primary-600 uppercase">
                                                {t('quran.endSegment', 'End')}
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            {endSegmentViewData ? (
                                                <>
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {t('quran.segment', 'Segment')} {endSegmentViewData.target_segment.segment_number}
                                                    </p>
                                                    <p className="text-xs text-gray-600">
                                                        {t('quran.verseKey', 'Verse')}: {endSegmentViewData.target_segment.first_verse_key}
                                                        {endSegmentViewData.target_segment.first_verse_key !== endSegmentViewData.target_segment.last_verse_key && ` - ${endSegmentViewData.target_segment.last_verse_key}`}
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
                                                            {t('quran.surah', 'Surah')}: {getSurahName(endSegmentViewData.target_segment.surah_number) || endSegmentViewData.target_segment.surah_number}
                                                        </span>
                                                        <span className="text-xs text-gray-400">•</span>
                                                        <span className="text-xs text-gray-500">
                                                            {t('quran.page', 'Page')}: {endSegmentViewData.target_segment.page_number}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setMushafPageNumber(endSegmentViewData.target_segment.page_number);
                                                            const [surah, ayah] = endSegmentViewData.target_segment.last_verse_key.split(':').map(Number);
                                                            setSelectedAyahsForMushaf(new Set([`${surah}:${ayah}`]));
                                                            setShowMushafModal(true);
                                                        }}
                                                        className="mt-2 w-full px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-100 rounded-lg hover:bg-primary-200 transition-colors"
                                                    >
                                                        {t('quran.viewInMushaf', 'View in Mushaf')}
                                                    </button>
                                                </>
                                            ) : selectedEndSegment ? (
                                                <>
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {t('quran.segment', 'Segment')} {selectedEndSegment.segment_number}
                                                    </p>
                                                    <p className="text-xs text-gray-600">
                                                        {t('quran.verseKey', 'Verse')}: {selectedEndSegment.first_verse_key}
                                                        {selectedEndSegment.first_verse_key !== selectedEndSegment.last_verse_key && ` - ${selectedEndSegment.last_verse_key}`}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-gray-200">
                                                        <span className="text-xs text-gray-500">
                                                            {t('quran.juz', 'Juz')}: {selectedEndSegment.juz_number}
                                                        </span>
                                                        <span className="text-xs text-gray-400">•</span>
                                                        <span className="text-xs text-gray-500">
                                                            {t('quran.surah', 'Surah')}: {getSurahName(selectedEndSegment.surah_number) || selectedEndSegment.surah_number}
                                                        </span>
                                                        <span className="text-xs text-gray-400">•</span>
                                                        <span className="text-xs text-gray-500">
                                                            {t('quran.page', 'Page')}: {selectedEndSegment.page_number}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setMushafPageNumber(selectedEndSegment.page_number);
                                                            const [startSurah, startAyah] = selectedEndSegment.first_verse_key.split(':').map(Number);
                                                            const [endSurah, endAyah] = selectedEndSegment.last_verse_key.split(':').map(Number);
                                                            const ayahs = new Set<string>();
                                                            for (let s = startSurah; s <= endSurah; s++) {
                                                                const startA = (s === startSurah) ? startAyah : 1;
                                                                const endA = (s === endSurah) ? endAyah : 999;
                                                                for (let a = startA; a <= endA; a++) {
                                                                    ayahs.add(`${s}:${a}`);
                                                                }
                                                            }
                                                            setSelectedAyahsForMushaf(ayahs);
                                                            setShowMushafModal(true);
                                                        }}
                                                        className="mt-2 w-full px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-100 rounded-lg hover:bg-primary-200 transition-colors"
                                                    >
                                                        {t('quran.viewInMushaf', 'View in Mushaf')}
                                                    </button>
                                                </>
                                            ) : null}
                                        </div>
                                    </div>
                                )}

                                {/* Loading state for end segment */}
                                {planType === 'daily_amount' && isLoadingEndSegment && (
                                    <div className="flex-1 border border-primary-300 rounded-lg p-3 bg-white flex items-center justify-center">
                                        <p className="text-xs text-gray-500">
                                            {t('quran.calculatingEndSegment', 'Calculating end segment...')}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Additional info for daily_amount */}
                            {planType === 'daily_amount' && dailyAmount > 0 && durationInDays > 0 && (
                                <div className="mt-3 pt-3 border-t border-primary-200">
                                    <p className="text-xs text-primary-700">
                                        {t('quran.totalSegments', 'Total segments')}: {dailyAmount * durationInDays}
                                    </p>
                                </div>
                            )}

                            {/* View Full Plan Button */}
                            {((planType === 'daily_amount' && (endSegmentData || planPreviewData)) || (planType === 'start_end' && selectedStartSegment && selectedEndSegment)) && (
                                <div className="mt-4 pt-4 border-t border-primary-200">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            let startKey: string;
                                            let endKey: string;
                                            if (planType === 'daily_amount') {
                                                if (planPreviewData) {
                                                    startKey = planPreviewData.start_verse_key;
                                                    endKey = planPreviewData.computed_last_verse_key;
                                                } else if (endSegmentData && selectedStartSegment) {
                                                    startKey = selectedStartSegment.first_verse_key;
                                                    endKey = endSegmentData.target_segment.last_verse_key;
                                                } else return;
                                            } else {
                                                startKey = selectedStartSegment!.first_verse_key;
                                                if (endSegmentViewData) {
                                                    endKey = endSegmentViewData.target_segment.last_verse_key;
                                                } else if (selectedEndSegment) {
                                                    endKey = selectedEndSegment.last_verse_key;
                                                } else return;
                                            }
                                            setPlanStartVerseKey(startKey);
                                            setPlanEndVerseKey(endKey);
                                            setShowPlanMushafViewer(true);
                                        }}
                                        className="w-full px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <BookOpenIcon width={18} height={18} />
                                        {t('quran.viewFullPlan', 'View Full Plan in Mushaf')}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* End Segment Selection (for start_end plan type) */}
                    {planType === 'start_end' && (
                        <div className="space-y-4">
                            <div className="border-t border-gray-200 pt-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                    {t('quran.selectEndSegment', 'Select End Segment')}
                                </h4>

                                {/* End Page Number Input */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('quran.endPageNumber', 'End Page Number')}
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="604"
                                        value={endPageNumber || ''}
                                        onFocus={(e) => {
                                            if (e.target.value === '0') {
                                                e.target.value = '';
                                                setEndPageNumber(undefined);
                                            } else {
                                                e.target.select();
                                            }
                                        }}
                                        onChange={(e) => {
                                            const inputValue = e.target.value;
                                            if (inputValue === '' || inputValue.trim() === '') {
                                                setEndPageNumber(undefined);
                                                setEndSegments([]);
                                                setSelectedEndSegment(null);
                                                setValue('end_segment_verse_key', undefined);
                                            } else {
                                                const value = parseInt(inputValue, 10);
                                                if (!isNaN(value) && value >= 1 && value <= 604) {
                                                    setEndPageNumber(value);
                                                }
                                            }
                                        }}
                                        placeholder={t('quran.enterPageNumber', 'Enter page number (1-604)')}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>

                                {/* End Segments List */}
                                {endPageNumber && (
                                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                        {isLoadingEndSegments ? (
                                            <div className="text-center py-4">
                                                <p className="text-sm text-gray-500">{t('common.loading', 'Loading...')}</p>
                                            </div>
                                        ) : endSegments.length > 0 ? (
                                            <>
                                                <h5 className="text-sm font-semibold text-gray-700 mb-3">
                                                    {t('quran.segmentsForPage', 'Segments for Page')} {endPageNumber}
                                                </h5>
                                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                                    {endSegments.map((segment) => (
                                                        <button
                                                            key={segment.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedEndSegment(segment);
                                                                // Set the end_segment_verse_key when end segment is selected
                                                                setValue('end_segment_verse_key', segment.first_verse_key);
                                                            }}
                                                            className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                                                                selectedEndSegment?.id === segment.id
                                                                    ? 'border-primary-500 bg-primary-50'
                                                                    : 'border-gray-200 bg-white hover:border-primary-300'
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
                                                                    <span className="text-primary-600 text-sm font-semibold ml-2">
                                                                        ✓
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center py-4">
                                                <p className="text-sm text-gray-500">{t('quran.noSegmentsFound', 'No segments found for this page')}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}


                    {/* Mushaf Page Modal */}
                    {showMushafModal && mushafPageNumber && (
                        <MushafPageModal
                            isOpen={showMushafModal}
                            onClose={() => {
                                setShowMushafModal(false);
                                setMushafPageNumber(undefined);
                                setSelectedAyahsForMushaf(new Set());
                            }}
                            pageNumber={mushafPageNumber}
                            selectedAyahs={selectedAyahsForMushaf}
                        />
                    )}

                    {/* Hidden inputs for segment verse keys */}
                    <input
                        type="hidden"
                        {...control.register('start_segment_verse_key')}
                    />
                    <input
                        type="hidden"
                        {...control.register('end_segment_verse_key')}
                    />
                </div>
            )}
            {currentUnit === 'parts' && (
                <>
                    <FormInput
                        name="start_juz_number"
                        control={control}
                        label={t('plan.startJuzNumber', 'Start Juz Number')}
                        required
                        type="number"
                        error={errors.start_juz_number?.message}
                    />
                    {planType === 'start_end' && (
                        <FormInput
                            name="end_juz_number"
                            control={control}
                            label={t('plan.endJuzNumber', 'End Juz Number')}
                            required
                            type="number"
                            error={errors.end_juz_number?.message}
                        />
                    )}
                </>
            )}
            {currentUnit === 'surahs' && (
                <>
                    <FormSelect
                        name="start_surah_id"
                        control={control}
                        label={t('plan.startSurahId', 'Start Surah')}
                        required
                        options={surahOptions}
                        error={errors.start_surah_id?.message}
                        placeholder={t('plan.selectSurah', 'Select a surah')}
                    />
                    {planType === 'start_end' && (
                        <FormSelect
                            name="end_surah_id"
                            control={control}
                            label={t('plan.endSurahId', 'End Surah')}
                            required
                            options={surahOptions}
                            error={errors.end_surah_id?.message}
                            placeholder={t('plan.selectSurah', 'Select a surah')}
                        />
                    )}
                </>
            )}

            {/* Plan Mushaf Viewer Modal — available for all units (segments, juz, surah) after preview */}
            {showPlanMushafViewer && planStartVerseKey && planEndVerseKey && (
                <MushafPageModal
                    isOpen={showPlanMushafViewer}
                    onClose={() => {
                        setShowPlanMushafViewer(false);
                        setPlanStartVerseKey(undefined);
                        setPlanEndVerseKey(undefined);
                    }}
                    startVerseKey={planStartVerseKey}
                    endVerseKey={planEndVerseKey}
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
                    {createPlanMutation.isPending ? t('common.loading', 'Loading...') : t('plan.preview', 'Preview')}
                </Button>
            </div>
        </form>
    );
};

export default CreatePlanForm;

