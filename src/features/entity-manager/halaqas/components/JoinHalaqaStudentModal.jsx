import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { Button, FormInput } from '@/shared/components';
import SelectRFH from '@/shared/components/ui/SelectRFH';
import { BookOpenIcon, CheckIcon, XIcon } from '@/shared/icons';
import { useFormWithValidation } from '@/shared/utils';
import { getJuzNumberForVerseKey, getVerseKeyDisplay, loadSurahData } from '@/shared/utils/helpers/surahHelper';
import { useCreateHalaqaFormQueries } from '../hooks/useCreateHalaqaFormQueries';
import { useHalaqa, useJoinHalaqaStudent } from '../hooks/useHalaqas';
import { HALAQA_ACTIVITIES, PLAN_DIRECTIONS, PLAN_TYPES } from '../config';
import { joinHalaqaStudentSchema } from '../schemas/join-halaqa-student.schema';
import MushafSegmentPickerModal from './MushafSegmentPickerModal';

const CARD_CLASS = 'rounded-[24px] border border-slate-200 bg-slate-50/70 p-4';
const SELECT_FIELD_CLASSES = '[&_.react-select__control]:min-h-[52px] [&_.react-select__control]:rounded-2xl [&_.react-select__control]:border-slate-200 [&_.react-select__control]:shadow-sm [&_.react-select__control]:px-1 [&_.react-select__control--is-focused]:border-[#0d7a78] [&_.react-select__placeholder]:text-slate-400';
const LAST_QURAN_VERSE_KEY = '114:6';

const getTodayDateString = () => new Date().toISOString().slice(0, 10);

const getSegmentBoundaryVerseKey = (segment, direction, edge = 'start') => {
    if (!segment) {
        return undefined;
    }

    if (edge === 'start') {
        return direction === 'decremental'
            ? segment.last_verse_key
            : segment.first_verse_key;
    }

    return direction === 'decremental'
        ? segment.first_verse_key
        : segment.last_verse_key;
};

const SectionCard = ({ title, hint, children }) => (
    <section className={CARD_CLASS}>
        <div className="mb-4 space-y-1">
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            {hint ? <p className="text-sm text-slate-500">{hint}</p> : null}
        </div>
        <div className="space-y-4">{children}</div>
    </section>
);

const SegmentedField = ({ name, control, label, options, error, required = false, compact = false }) => (
    <Controller
        name={name}
        control={control}
        render={({ field }) => (
            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                    {label}
                    {required ? <span className="ms-1 text-rose-500">*</span> : null}
                </label>
                <div className={`flex flex-wrap gap-2 rounded-[22px] bg-white p-1.5 ${compact ? 'max-w-max' : ''}`}>
                    {options.map((option) => {
                        const isSelected = String(field.value) === String(option.value);

                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => field.onChange(option.value)}
                                className={`inline-flex min-w-[120px] flex-1 items-center justify-center gap-2 rounded-[16px] px-4 py-3 text-sm font-semibold transition ${
                                    isSelected
                                        ? 'bg-[#0d7a78] text-white shadow-[0_14px_28px_-18px_rgba(13,122,120,0.9)]'
                                        : 'bg-transparent text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                {isSelected ? <CheckIcon width={15} height={15} /> : null}
                                <span>{option.label}</span>
                            </button>
                        );
                    })}
                </div>
                <p className="mt-1 min-h-4 text-xs text-red-600">{error ?? ''}</p>
            </div>
        )}
    />
);

const DirectionField = ({ name, control, label, options, error }) => (
    <Controller
        name={name}
        control={control}
        render={({ field }) => (
            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {options.map((option) => {
                        const isSelected = field.value === option.value;

                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => field.onChange(option.value)}
                                className={`rounded-[20px] border p-4 text-start transition ${
                                    isSelected
                                        ? 'border-[#33c6c3] bg-[#f3fffe] shadow-[0_16px_34px_-28px_rgba(13,122,120,0.8)]'
                                        : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-slate-900">{option.label}</p>
                                        <p className="text-sm text-slate-500">{option.description}</p>
                                    </div>
                                    <span className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                                        isSelected
                                            ? 'border-[#0d7a78] bg-[#0d7a78] text-white'
                                            : 'border-slate-300 bg-white text-transparent'
                                    }`}>
                                        <CheckIcon width={12} height={12} />
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
                <p className="mt-1 min-h-4 text-xs text-red-600">{error ?? ''}</p>
            </div>
        )}
    />
);

const StepperField = ({ name, control, label, error, helperText }) => (
    <Controller
        name={name}
        control={control}
        render={({ field }) => {
            const value = Number(field.value) > 0 ? Number(field.value) : 1;

            const handleChange = (nextValue) => {
                const normalized = Math.max(1, Number(nextValue) || 1);
                field.onChange(normalized);
            };

            return (
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                        {label}
                        <span className="ms-1 text-rose-500">*</span>
                    </label>
                    <div className="rounded-[22px] border border-slate-200 bg-white p-3">
                        <div className="grid grid-cols-[64px_1fr_64px] items-center gap-3 rounded-[18px] bg-slate-50 p-2">
                            <button
                                type="button"
                                onClick={() => handleChange(value - 1)}
                                className="flex h-14 items-center justify-center rounded-[14px] bg-slate-200 text-2xl text-slate-600 transition hover:bg-slate-300"
                            >
                                -
                            </button>
                            <div className="text-center">
                                <div className="text-3xl font-semibold leading-none text-[#004247]">{value}</div>
                                <div className="mt-2 text-xs text-slate-500">{helperText}</div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleChange(value + 1)}
                                className="flex h-14 items-center justify-center rounded-[14px] bg-[#0d7a78] text-2xl text-white transition hover:bg-[#0b6664]"
                            >
                                +
                            </button>
                        </div>
                    </div>
                    <p className="mt-1 min-h-4 text-xs text-red-600">{error ?? ''}</p>
                </div>
            );
        }}
    />
);

const LearningPathSummary = ({ title, buttonLabel, onOpen, planType, selectedStartSegment, selectedEndSegment, formatSegmentVerseInfo, emptyText, startText, endText, showEndSelection = false }) => {
    const hasSelection = Boolean(selectedStartSegment || selectedEndSegment);
    const shouldShowEndSelection = planType === 'start_end' || showEndSelection || Boolean(selectedEndSegment);

    return (
        <SectionCard title={title}>
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={onOpen}
                    className="inline-flex items-center gap-2 rounded-full border border-[#0d7a78]/15 bg-[#e7f5f3] px-4 py-2 text-sm font-medium text-[#0d7a78] transition hover:bg-[#d8efec]"
                >
                    <BookOpenIcon width={16} height={16} />
                    <span>{buttonLabel}</span>
                </button>
            </div>

            {hasSelection ? (
                <div className="rounded-[20px] border border-slate-200 bg-white p-4">
                    <div className={`grid gap-4 ${shouldShowEndSelection ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
                        <div className="rounded-[16px] border border-slate-200 bg-slate-50 p-4">
                            <p className="mb-2 text-xs font-medium text-slate-500">{startText}</p>
                            <p className="text-sm font-semibold text-slate-900">{selectedStartSegment ? formatSegmentVerseInfo(selectedStartSegment) : emptyText}</p>
                        </div>
                        {shouldShowEndSelection ? (
                            <div className="rounded-[16px] border border-slate-200 bg-slate-50 p-4">
                                <p className="mb-2 text-xs font-medium text-slate-500">{endText}</p>
                                <p className="text-sm font-semibold text-slate-900">{selectedEndSegment ? formatSegmentVerseInfo(selectedEndSegment) : emptyText}</p>
                            </div>
                        ) : null}
                    </div>
                </div>
            ) : (
                <div className="rounded-[20px] border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
                    {emptyText}
                </div>
            )}
        </SectionCard>
    );
};

const JoinHalaqaStudentModal = ({ isOpen, halaqaId, halaqaName, onClose }) => {
    const { t, i18n } = useTranslation();
    const queryClient = useQueryClient();
    const currentLang = i18n.language || 'ar';
    const isArabic = currentLang === 'ar';
    const copy = useCallback((arabicText, englishText) => (isArabic ? arabicText : englishText), [isArabic]);
    const { data, isLoading: isLoadingHalaqa } = useHalaqa(isOpen ? halaqaId : '');
    const joinStudentMutation = useJoinHalaqaStudent();
    const { studentsOptions: allStudentsOptions, isLoadingStudents } = useCreateHalaqaFormQueries();
    const halaqa = data?.data ?? data ?? null;
    const [surahData, setSurahData] = useState(null);
    const [selectedStartSegment, setSelectedStartSegment] = useState(null);
    const [selectedEndSegment, setSelectedEndSegment] = useState(null);
    const [showMushafSegmentPickerModal, setShowMushafSegmentPickerModal] = useState(false);

    const defaultActivity = useMemo(() => {
        if (Array.isArray(halaqa?.activities) && halaqa.activities.length > 0) {
            return halaqa.activities[0];
        }

        return 'hifz';
    }, [halaqa?.activities]);

    const minStartDate = useMemo(() => {
        const today = getTodayDateString();
        const halaqaStartDate = halaqa?.start_date;

        if (!halaqaStartDate) {
            return today;
        }

        return halaqaStartDate > today ? halaqaStartDate : today;
    }, [halaqa?.start_date]);

    const {
        control,
        handleSubmit,
        register,
        reset,
        setValue,
        formState: { errors }
    } = useFormWithValidation({
        schema: joinHalaqaStudentSchema,
        defaultValues: {
            student_id: undefined,
            start_date: getTodayDateString(),
            activity: defaultActivity,
            plan_type: 'daily_amount',
            direction: 'incremental',
            start_segment_verse_key: '',
            end_segment_verse_key: '',
            daily_amount: 1
        }
    });

    const currentActivity = useWatch({ control, name: 'activity' });
    const planType = useWatch({ control, name: 'plan_type' });
    const currentDirection = useWatch({ control, name: 'direction' });
    const currentStartSegmentVerseKey = useWatch({ control, name: 'start_segment_verse_key' });
    const currentEndSegmentVerseKey = useWatch({ control, name: 'end_segment_verse_key' });
    const isDailyAmountPlan = planType === 'daily_amount';

    useEffect(() => {
        loadSurahData()
            .then((loadedSurahData) => setSurahData(loadedSurahData))
            .catch((error) => {
                console.error('Error loading surah data:', error);
            });
    }, []);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        reset({
            student_id: undefined,
            start_date: minStartDate,
            activity: defaultActivity,
            plan_type: 'daily_amount',
            direction: 'incremental',
            start_segment_verse_key: '',
            end_segment_verse_key: '',
            daily_amount: 1
        });
        setSelectedStartSegment(null);
        setSelectedEndSegment(null);
    }, [defaultActivity, isOpen, minStartDate, reset]);

    useEffect(() => {
        if (Array.isArray(halaqa?.activities) && halaqa.activities.length > 0 && currentActivity && !halaqa.activities.includes(currentActivity) && currentActivity !== halaqa.activities[0]) {
            setValue('activity', halaqa.activities[0]);
        }
    }, [currentActivity, halaqa?.activities, setValue]);

    useEffect(() => {
        const nextStartVerseKey = selectedStartSegment
            ? getSegmentBoundaryVerseKey(selectedStartSegment, currentDirection, 'start')
            : currentDirection === 'decremental'
                ? LAST_QURAN_VERSE_KEY
                : '';

        if (currentStartSegmentVerseKey !== nextStartVerseKey) {
            setValue('start_segment_verse_key', nextStartVerseKey, { shouldValidate: true });
        }
    }, [currentDirection, currentStartSegmentVerseKey, selectedStartSegment, setValue]);

    useEffect(() => {
        const nextEndVerseKey = selectedEndSegment
            ? getSegmentBoundaryVerseKey(selectedEndSegment, currentDirection, 'end')
            : '';

        if (currentEndSegmentVerseKey !== nextEndVerseKey) {
            setValue('end_segment_verse_key', nextEndVerseKey, { shouldValidate: true });
        }
    }, [currentDirection, currentEndSegmentVerseKey, selectedEndSegment, setValue]);

    useEffect(() => {
        if (!isDailyAmountPlan) {
            return;
        }

        if (selectedEndSegment) {
            setSelectedEndSegment(null);
        }

        if (currentEndSegmentVerseKey !== '') {
            setValue('end_segment_verse_key', '', { shouldValidate: true });
        }
    }, [currentEndSegmentVerseKey, isDailyAmountPlan, selectedEndSegment, setValue]);

    const getErrorMessage = useCallback((message) => {
        if (!message) {
            return '';
        }

        return t(message, message);
    }, [t]);

    const currentStudentIds = useMemo(() => new Set(
        Array.isArray(halaqa?.students)
            ? halaqa.students.map((student) => Number(student?.id)).filter((value) => Number.isFinite(value))
            : []
    ), [halaqa?.students]);

    const availableStudentsOptions = useMemo(() => (
        (Array.isArray(allStudentsOptions) ? allStudentsOptions : [])
            .filter((student) => !currentStudentIds.has(Number(student?.value ?? student?.id)))
    ), [allStudentsOptions, currentStudentIds]);

    const activityOptions = useMemo(() => {
        const allActivityOptions = HALAQA_ACTIVITIES.map((activity) => ({
            value: activity.value,
            label: t(activity.labelKey, activity.value)
        }));

        if (Array.isArray(halaqa?.activities) && halaqa.activities.length > 0) {
            return allActivityOptions.filter((activity) => halaqa.activities.includes(activity.value));
        }

        return allActivityOptions;
    }, [halaqa?.activities, t]);

    const planTypeOptions = useMemo(() => PLAN_TYPES.map((type) => ({
        value: type.value,
        label: type.value === 'daily_amount'
            ? copy('مقدار يومي', 'Daily Amount')
            : copy('البداية والنهاية', 'Start and End')
    })), [copy]);

    const directionOptions = useMemo(() => PLAN_DIRECTIONS.map((direction) => ({
        value: direction.value,
        label: t(direction.labelKey, direction.value),
        description: direction.value === 'incremental'
            ? copy('من البداية باتجاه النهاية', 'From the beginning toward the end')
            : copy('من النهاية باتجاه البداية', 'From the end back to the beginning')
    })), [copy, t]);

    const getSurahName = useCallback((surahNumber) => {
        if (!surahNumber || !surahData) {
            return '';
        }

        const surah = surahData[String(surahNumber)];
        if (!surah) {
            return '';
        }

        return currentLang === 'ar' ? surah.name_arabic : (surah.name_simple || surah.name);
    }, [currentLang, surahData]);

    const formatSegmentVerseInfo = useCallback((segment) => {
        if (!segment) {
            return '—';
        }

        const firstDisplay = getVerseKeyDisplay(segment.first_verse_key, surahData, currentLang);
        const firstJuz = getJuzNumberForVerseKey(segment.first_verse_key);
        const firstString = firstDisplay
            ? `${firstDisplay.surahName} • ${t('quran.ayah', 'Ayah')} ${firstDisplay.ayahNumber} • ${t('quran.juzShort', { number: firstJuz })}`
            : segment.first_verse_key;

        if (segment.first_verse_key === segment.last_verse_key) {
            return firstString;
        }

        const lastDisplay = getVerseKeyDisplay(segment.last_verse_key, surahData, currentLang);
        const lastJuz = getJuzNumberForVerseKey(segment.last_verse_key);
        const lastString = lastDisplay
            ? `${lastDisplay.surahName} • ${t('quran.ayah', 'Ayah')} ${lastDisplay.ayahNumber} • ${t('quran.juzShort', { number: lastJuz })}`
            : segment.last_verse_key;

        return `${firstString} - ${lastString}`;
    }, [currentLang, surahData, t]);

    const buildPayload = (formData) => ({
        student_id: Number(formData.student_id),
        start_date: formData.start_date,
        activity: formData.activity,
        plan_type: formData.plan_type,
        unit: 'segments',
        direction: formData.direction,
        start_verse_key: formData.start_segment_verse_key,
        ...(formData.plan_type === 'daily_amount' ? { daily_amount: Number(formData.daily_amount) } : {}),
        ...(formData.end_segment_verse_key ? { end_verse_key: formData.end_segment_verse_key } : {})
    });

    const handleClose = () => {
        if (joinStudentMutation.isPending) {
            return;
        }

        onClose();
    };

    const onSubmit = (formData) => {
        if (!halaqaId) {
            toast.error(t('halaqa.notFound', 'Halaqa not found'));
            return;
        }

        joinStudentMutation.mutate({
            halaqaId,
            data: buildPayload(formData)
        }, {
            onSuccess: () => {
                toast.success(copy('تم إلحاق الطالب بالحلقة بنجاح', 'Student joined the halaqa successfully'));
                queryClient.invalidateQueries({ queryKey: ['halaqa', halaqaId] });
                queryClient.invalidateQueries({ queryKey: ['halaqas'] });
                onClose();
            },
            onError: (error) => {
                toast.error(error?.message || copy('حدث خطأ أثناء إلحاق الطالب بالحلقة', 'Error joining student to halaqa'));
            }
        });
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[70] overflow-y-auto">
            <div className="fixed inset-0 bg-black/50" onClick={handleClose} aria-hidden="true" />

            <div className="relative flex min-h-full items-center justify-center p-4">
                <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
                    <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold text-slate-900">
                                {copy('التحاق الطلاب بعد البداية', 'Join Students After Start')}
                            </h2>
                            <p className="text-sm text-slate-500">
                                {halaqa?.name?.[currentLang] ?? halaqa?.name?.ar ?? halaqa?.name?.en ?? halaqaName ?? ''}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={joinStudentMutation.isPending}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                            aria-label={t('common.close', 'Close')}
                        >
                            <XIcon width={20} height={20} />
                        </button>
                    </div>

                    <div className="max-h-[calc(100vh-10rem)] overflow-y-auto px-6 py-5">
                        {isLoadingHalaqa ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#0d7a78]" />
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                <SectionCard
                                    title={copy('بيانات الإلحاق', 'Join Data')}
                                    hint={copy('اختر الطالب وحدد تاريخ بداية خطته داخل الحلقة.', 'Choose the student and define the plan start date inside the halaqa.')}
                                >
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <SelectRFH
                                            name="student_id"
                                            control={control}
                                            label={t('plan.student', copy('الطالب', 'Student'))}
                                            required
                                            options={availableStudentsOptions}
                                            loading={isLoadingStudents}
                                            error={getErrorMessage(errors.student_id?.message)}
                                            placeholder={copy('اختر الطالب', 'Select student')}
                                            classes={SELECT_FIELD_CLASSES}
                                        />
                                        <FormInput
                                            name="start_date"
                                            control={control}
                                            label={t('halaqa.startDate', 'Start Date')}
                                            required
                                            type="date"
                                            min={minStartDate}
                                            error={getErrorMessage(errors.start_date?.message)}
                                        />
                                    </div>

                                    {availableStudentsOptions.length === 0 ? (
                                        <div className="rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                                            {copy('لا يوجد طلاب متاحون للإلحاق في هذه الحلقة حالياً.', 'No students are currently available to join this halaqa.')}
                                        </div>
                                    ) : null}
                                </SectionCard>

                                <SectionCard title={copy('نوع النشاط', 'Activity Type')}>
                                    <SegmentedField
                                        name="activity"
                                        control={control}
                                        label={t('plan.activity', copy('نشاط الحلقة', 'Plan Activity'))}
                                        required
                                        options={activityOptions}
                                        error={getErrorMessage(errors.activity?.message)}
                                        compact
                                    />
                                </SectionCard>

                                <SectionCard title={copy('طريقة بناء الخطة', 'Plan Method')}>
                                    <SegmentedField
                                        name="plan_type"
                                        control={control}
                                        label={t('plan.planType', copy('طريقة الحفظ', 'Plan Type'))}
                                        required
                                        options={planTypeOptions}
                                        error={getErrorMessage(errors.plan_type?.message)}
                                    />

                                    {planType === 'daily_amount' ? (
                                        <StepperField
                                            name="daily_amount"
                                            control={control}
                                            label={t('plan.dailyAmount', copy('مقدار التسميع اليومي بالمقاطع', 'Daily Recitation Amount by Segment'))}
                                            helperText={copy('مقطع / يوم', 'segments / day')}
                                            error={getErrorMessage(errors.daily_amount?.message)}
                                        />
                                    ) : null}
                                </SectionCard>

                                <SectionCard title={copy('اتجاه الحفظ', 'Recitation Direction')}>
                                    <DirectionField
                                        name="direction"
                                        control={control}
                                        label={t('plan.direction', copy('اتجاه الحفظ', 'Direction'))}
                                        options={directionOptions}
                                        error={getErrorMessage(errors.direction?.message)}
                                    />
                                </SectionCard>

                                <LearningPathSummary
                                    title={copy('مسار التعلم', 'Learning Path')}
                                    buttonLabel={isDailyAmountPlan
                                        ? copy('تحديد البداية', 'Select Start')
                                        : copy('تحديد البداية والنهاية', 'Select Start and End')}
                                    onOpen={() => setShowMushafSegmentPickerModal(true)}
                                    planType={planType}
                                    selectedStartSegment={selectedStartSegment}
                                    selectedEndSegment={selectedEndSegment}
                                    formatSegmentVerseInfo={formatSegmentVerseInfo}
                                    emptyText={isDailyAmountPlan
                                        ? copy('لم يتم تحديد بداية المقدار بعد. السيستم سيحدد النهاية تلقائياً.', 'No start selected yet. The system will determine the end automatically.')
                                        : copy('لم يتم تحديد البداية والنهاية بعد.', 'No range selected yet.')}
                                    startText={copy('نقطة البداية', 'Start Point')}
                                    endText={copy('نقطة النهاية', 'End Point')}
                                    showEndSelection={false}
                                />

                                <input type="hidden" {...register('start_segment_verse_key')} />
                                <input type="hidden" {...register('end_segment_verse_key')} />

                                <MushafSegmentPickerModal
                                    isOpen={showMushafSegmentPickerModal}
                                    onClose={() => setShowMushafSegmentPickerModal(false)}
                                    selectedStartSegment={selectedStartSegment}
                                    selectedEndSegment={selectedEndSegment}
                                    onSelectStartSegment={setSelectedStartSegment}
                                    onSelectEndSegment={setSelectedEndSegment}
                                    planType={planType}
                                    direction={currentDirection}
                                    getSurahName={getSurahName}
                                />

                                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleClose}
                                        disabled={joinStudentMutation.isPending}
                                        className="rounded-[18px] px-5 py-3"
                                    >
                                        {t('common.cancel', 'Cancel')}
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        loading={joinStudentMutation.isPending}
                                        disabled={joinStudentMutation.isPending || availableStudentsOptions.length === 0}
                                        className="rounded-[18px] bg-[#0d7a78] px-5 py-3 hover:bg-[#0b6664]"
                                    >
                                        {copy('إلحاق الطالب', 'Join Student')}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JoinHalaqaStudentModal;
