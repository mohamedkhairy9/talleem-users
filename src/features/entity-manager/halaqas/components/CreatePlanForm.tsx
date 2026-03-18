import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWatch } from 'react-hook-form';
import { useFormWithValidation } from '@/utils';
import { FormInput, FormSelect, Button } from '@/globals/components';
import SelectRFH from '@/globals/components/ui/SelectRFH';
import { useCreatePlan } from '../hooks/useHalaqas';
import { useCreateHalaqaFormQueries } from '../hooks/useCreateHalaqaFormQueries';
import type { CreatePlanPayload, CreatePlanResponseData } from '../types';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import {
    HALAQA_ACTIVITIES,
    PLAN_TYPES,
    PLAN_DIRECTIONS,
    type HalaqaActivity
} from '../config';
import { createPlanSchema, CreatePlanFormData } from '../schemas/plan.schema';
import type { QuranSegment } from '../services/quran-segments.service';
import MushafPageModal from './MushafPageModal';
import MushafSegmentPickerModal from './MushafSegmentPickerModal';
import PlanPreviewCard from './PlanPreviewCard';
import { BookOpenIcon } from '@/globals/icons';
import { loadSurahData, getVerseKeyDisplay, getJuzNumberForVerseKey, type SurahDataMap } from '@/utils/helpers/surahHelper';

interface CreatePlanFormProps {
    halaqaId: number | string;
    students?: Array<{ id: number; name?: { en?: string; ar?: string } }>;
    activities?: HalaqaActivity[];
    onSuccess?: () => void;
    onCancel?: () => void;
}

/**
 * Create Plan Form Component
 * Creates a plan for a specific student in a halaqa
 */
const CreatePlanForm: React.FC<CreatePlanFormProps> = ({ halaqaId, students, activities, onSuccess, onCancel }) => {
    const { t, i18n } = useTranslation();
    const queryClient = useQueryClient();
    const createPlanMutation = useCreatePlan();
    const currentLang = i18n.language || 'ar';

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
            daily_amount: 1
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
    
    // Segment picker + mushaf modal (open from plan form)
    const [showMushafSegmentPickerModal, setShowMushafSegmentPickerModal] = useState(false);
    // Plan mushaf viewer state
    const [showPlanMushafViewer, setShowPlanMushafViewer] = useState(false);
    const [planStartVerseKey, setPlanStartVerseKey] = useState<string | undefined>(undefined);
    const [planEndVerseKey, setPlanEndVerseKey] = useState<string | undefined>(undefined);
    
    // Surah data state
    const [surahData, setSurahData] = useState<SurahDataMap | null>(null);

    // Plan preview state (after calling API with save_or_not: 0)
    const [planPreviewData, setPlanPreviewData] = useState<CreatePlanResponseData | null>(null);
    const planPreviewRef = useRef<HTMLDivElement>(null);

    // Scroll to plan preview when it loads so user sees result and can submit
    useEffect(() => {
        if (planPreviewData && planPreviewRef.current) {
            planPreviewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [planPreviewData]);

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

    /** Format segment as verse info (Surah Name, Ayah X · Juz Y) for display; fallback to verse key if no surah data */
    const formatSegmentVerseInfo = React.useCallback(
        (seg: QuranSegment): string => {
            if (!seg) return '—';
            const firstDisplay = getVerseKeyDisplay(seg.first_verse_key, surahData, currentLang);
            const juzFirst = getJuzNumberForVerseKey(seg.first_verse_key);
            const firstStr = firstDisplay
                ? `${firstDisplay.surahName}, ${t('quran.ayah', 'Ayah')} ${firstDisplay.ayahNumber} · ${t('quran.juzShort', { number: juzFirst })}`
                : seg.first_verse_key;
            if (seg.first_verse_key === seg.last_verse_key) return firstStr;
            const lastDisplay = getVerseKeyDisplay(seg.last_verse_key, surahData, currentLang);
            const juzLast = getJuzNumberForVerseKey(seg.last_verse_key);
            const lastStr = lastDisplay
                ? `${lastDisplay.surahName}, ${t('quran.ayah', 'Ayah')} ${lastDisplay.ayahNumber} · ${t('quran.juzShort', { number: juzLast })}`
                : seg.last_verse_key;
            return `${firstStr} – ${lastStr}`;
        },
        [surahData, currentLang, t]
    );

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

    // Set end_segment_verse_key when end segment is selected (start_end plan type). Use last verse of segment as end.
    useEffect(() => {
        if (currentUnit === 'segments' && planType === 'start_end' && selectedEndSegment) {
            setValue('end_segment_verse_key', selectedEndSegment.last_verse_key);
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
                    ? (currentLang === 'ar' && student.name.ar ? student.name.ar : student.name.en) || t('plan.studentId', { id: student.id })
                    : t('plan.studentId', { id: student.id })
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

    const directionOptions = PLAN_DIRECTIONS.map(direction => ({
        value: direction.value,
        label: t(direction.labelKey, direction.value)
    }));

    /** Build start_verse_key from segment selection (unit is fixed to segments). */
    const getStartVerseKey = (data: CreatePlanFormData): string | null => {
        return data.start_segment_verse_key ?? null;
    };

    const buildPayload = (data: CreatePlanFormData, saveOrNot: 0 | 1): CreatePlanPayload | null => {
        const startVerseKey = getStartVerseKey(data);
        if (!startVerseKey || !data.student_ids?.length) return null;
        const payload: CreatePlanPayload = {
            activity: data.activity,
            student_ids: data.student_ids,
            plan_type: data.plan_type,
            unit: 'segments',
            direction: data.direction,
            start_verse_key: startVerseKey,
            save_or_not: saveOrNot,
            ...(data.plan_type === 'daily_amount' && data.daily_amount ? { daily_amount: data.daily_amount } : {}),
            ...(data.plan_type === 'start_end' && data.end_segment_verse_key ? { end_verse_key: data.end_segment_verse_key } : {})
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
            daily_amount: 1
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

            {/* Row 1: Activity, Plan Type (2 cols on md) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormSelect
                    name="activity"
                    control={control}
                    label={t('plan.activity', 'Activity')}
                    required
                    options={activityOptions}
                    error={errors.activity?.message}
                />
                <FormSelect
                    name="plan_type"
                    control={control}
                    label={t('plan.planType', 'Plan Type')}
                    required
                    options={planTypeOptions}
                    error={errors.plan_type?.message}
                />
            </div>

            {/* Row 2: Direction, Daily amount (unit fixed to segments) */}
            <div className={`grid gap-4 ${planType === 'daily_amount' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                <FormSelect
                    name="direction"
                    control={control}
                    label={t('plan.direction', 'Direction')}
                    required
                    options={directionOptions}
                    error={errors.direction?.message}
                />
                {planType === 'daily_amount' && (
                    <FormInput
                        name="daily_amount"
                        control={control}
                        label={t('plan.dailyAmount', 'Daily Amount')}
                        required
                        type="number"
                        error={errors.daily_amount?.message}
                        min={1}
                        
                        helperText={t('plan.dailyAmountHelperText', 'Enter the daily amount of segments to read. This will be the number of segments read each day.')}
                    />
                )}
            </div>

            {/* Students (multi-select) - full width */}
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

            {/* Segment selection: open in modal only */}
            <div className="space-y-2">
                <div className="flex items-start flex-col gap-2">
                    <span className="text-sm font-medium text-gray-700">
                        {t('plan.segmentRange', 'Segment range')}
                    </span>
                    <Button
                        type="button"
                        onClick={() => setShowMushafSegmentPickerModal(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                        title={t('quran.openMushafViewer', 'Open Mushaf viewer')}
                    >
                        <BookOpenIcon width={18} height={18} />
                        {t('quran.openMushafViewer', 'Open Mushaf viewer')}
                    </Button>
                </div>
                {(selectedStartSegment || selectedEndSegment) && (
                    <p className="text-sm text-gray-500">
                        {selectedStartSegment && (
                            <span>{t('quran.startSegment', 'Start')}: {formatSegmentVerseInfo(selectedStartSegment)}</span>
                        )}
                        {selectedStartSegment && selectedEndSegment && planType === 'start_end' && ' · '}
                        {selectedEndSegment && planType === 'start_end' && (
                            <span>{t('quran.endSegment', 'End')}: {formatSegmentVerseInfo(selectedEndSegment)}</span>
                        )}
                    </p>
                )}
                <input type="hidden" {...control.register('start_segment_verse_key')} />
                <input type="hidden" {...control.register('end_segment_verse_key')} />
            </div>

            {/* Segment picker + Mushaf viewer modal */}
            <MushafSegmentPickerModal
                isOpen={showMushafSegmentPickerModal}
                onClose={() => setShowMushafSegmentPickerModal(false)}
                selectedStartSegment={selectedStartSegment}
                selectedEndSegment={selectedEndSegment}
                onSelectStartSegment={setSelectedStartSegment}
                onSelectEndSegment={setSelectedEndSegment}
                planType={planType}
                getSurahName={getSurahName}
            />

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

            {/* Plan preview: data from API with save_or_not: 0 — not created yet. Shown for both daily_amount and start_end. */}
            {planPreviewData && (
                <PlanPreviewCard
                    planPreviewData={planPreviewData}
                    surahData={surahData}
                    currentLang={currentLang}
                    isSaving={createPlanMutation.isPending}
                    onConfirmSave={handleConfirmSave}
                    onBackToEdit={() => setPlanPreviewData(null)}
                    onViewInMushaf={() => {
                        setPlanStartVerseKey(planPreviewData.start_verse_key ?? undefined);
                        setPlanEndVerseKey(planPreviewData.end_verse_key ?? planPreviewData.computed_last_verse_key ?? undefined);
                        setShowPlanMushafViewer(true);
                    }}
                    planPreviewRef={planPreviewRef}
                />
            )}

            {/* Error Message */}
            {createPlanMutation.error && (
                <div className="text-red-600 text-sm">
                    {(createPlanMutation.error as any).message || t('plan.createError', 'Error creating plan. Please try again.')}
                </div>
            )}

            {/* Submit / Cancel */}
            <div className="flex justify-end gap-4">
                {onCancel && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={createPlanMutation.isPending}
                    >
                        {t('common.cancel', 'Cancel')}
                    </Button>
                )}
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

