import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWatch } from 'react-hook-form';
import { useFormWithValidation } from '@/utils';
import { FormInput, FormSelect, Button } from '@/globals/components';
import SelectRFH from '@/globals/components/ui/SelectRFH';
import { useCreatePlan } from '../hooks/useHalaqas';
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
import type { QuranSegment } from '../services/quran-segments.service';
import MushafPageModal from './MushafPageModal';
import InlineMushafSegmentPicker from './InlineMushafSegmentPicker';
import { loadSurahData, getJuzFirstVerseKey, getSurahFirstVerseKey, type SurahDataMap } from '@/utils/helpers/surahHelper';
import { BookOpenIcon } from '@/globals/icons';

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

    // Segment selection state (used by InlineMushafSegmentPicker)
    const [pageNumber, setPageNumber] = useState<number | undefined>(undefined);
    const [selectedStartSegment, setSelectedStartSegment] = useState<QuranSegment | null>(null);
    const [, setEndPageNumber] = useState<number | undefined>(undefined);
    const [selectedEndSegment, setSelectedEndSegment] = useState<QuranSegment | null>(null);
    
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
            setSelectedStartSegment(null);
            setSelectedEndSegment(null);
            setValue('start_segment_verse_key', undefined);
            setValue('end_segment_verse_key', undefined);
            setValue('end_juz_number', undefined);
            setValue('end_surah_id', undefined);
        }
    }, [pageNumber, currentUnit, setValue]);

    // Set start_segment_verse_key when user selects a segment (InlineMushafSegmentPicker).
    useEffect(() => {
        if (currentUnit === 'segments' && selectedStartSegment) {
            setValue('start_segment_verse_key', selectedStartSegment.first_verse_key);
        }
    }, [selectedStartSegment, currentUnit, setValue]);

    // Set end_segment_verse_key when end segment is selected (start_end plan type).
    useEffect(() => {
        if (currentUnit === 'segments' && planType === 'start_end' && selectedEndSegment) {
            setValue('end_segment_verse_key', selectedEndSegment.first_verse_key);
        }
    }, [selectedEndSegment, currentUnit, planType, setValue]);

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
            setSelectedStartSegment(null);
            setSelectedEndSegment(null);
        }
    }, [currentUnit, setValue]);

    // Clear end fields when plan type changes from start_end to daily_amount
    useEffect(() => {
        if (planType === 'daily_amount') {
            setValue('end_segment_verse_key', undefined);
            setValue('end_juz_number', undefined);
            setValue('end_surah_id', undefined);
            setEndPageNumber(undefined);
            setSelectedEndSegment(null);
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
        setEndPageNumber(undefined);
        setSelectedStartSegment(null);
        setSelectedEndSegment(null);
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
                    {/* Inline Mushaf viewer: navigate pages, fetch segments per page, click to select */}
                    <InlineMushafSegmentPicker
                        selectedStartSegment={selectedStartSegment}
                        selectedEndSegment={selectedEndSegment}
                        onSelectStartSegment={setSelectedStartSegment}
                        onSelectEndSegment={setSelectedEndSegment}
                        planType={planType}
                        getSurahName={getSurahName}
                    />

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

