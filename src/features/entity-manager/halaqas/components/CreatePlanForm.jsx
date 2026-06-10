import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/shared/components';
import SelectRFH from '@/shared/components/ui/SelectRFH';
import { BookOpenIcon, CheckIcon, ChevronRightIcon, SearchIcon, UserIcon, UsersIcon } from '@/shared/icons';
import { useFormWithValidation } from '@/shared/utils';
import { getJuzNumberForVerseKey, getVerseKeyDisplay, loadSurahData } from '@/shared/utils/helpers/surahHelper';
import { useCreatePlan } from '../hooks/useHalaqas';
import { useCreateHalaqaFormQueries } from '../hooks/useCreateHalaqaFormQueries';
import { HALAQA_ACTIVITIES, PLAN_DIRECTIONS, PLAN_TYPES } from '../config';
import { createPlanSchema } from '../schemas/plan.schema';
import MushafPageModal from './MushafPageModal';
import MushafSegmentPickerModal from './MushafSegmentPickerModal';
import PlanPreviewCard from './PlanPreviewCard';

const CARD_CLASS = 'rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.5)] md:p-6';
const SELECT_FIELD_CLASSES = '[&_.react-select__control]:min-h-[56px] [&_.react-select__control]:rounded-2xl [&_.react-select__control]:border-slate-200 [&_.react-select__control]:shadow-sm [&_.react-select__control]:px-1 [&_.react-select__control--is-focused]:border-[#0d7a78] [&_.react-select__placeholder]:text-slate-400';

const SectionCard = ({ title, hint, action, children }) => (
    <section className={CARD_CLASS}>
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
                <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                {hint ? <p className="text-sm text-slate-500">{hint}</p> : null}
            </div>
            {action}
        </div>
        <div className="space-y-5">{children}</div>
    </section>
);

const SearchField = ({ value, onChange, placeholder }) => (
    <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4 text-slate-400">
            <SearchIcon width={18} height={18} />
        </span>
        <input
            type="text"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="h-14 w-full rounded-[18px] border border-slate-200 bg-white ps-11 pe-4 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#0d7a78] focus:ring-2 focus:ring-[#0d7a78]/10"
        />
    </div>
);

const StudentSelectionCard = ({ student, selected, onToggle, subtitle }) => (
    <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center gap-3 rounded-[22px] border p-4 text-start transition ${
            selected
                ? 'border-[#33c6c3] bg-[#f3fffe] shadow-[0_16px_30px_-26px_rgba(13,122,120,0.8)]'
                : 'border-slate-200 bg-white hover:border-slate-300'
        }`}
    >
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
            selected
                ? 'border-[#0d7a78] bg-[#0d7a78] text-white'
                : 'border-slate-300 bg-white text-transparent'
        }`}>
            <CheckIcon width={14} height={14} />
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-500">
                {student?.avatar ? (
                    <img src={student.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                    <UserIcon width={20} height={20} />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{student.label}</p>
                {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
            </div>
        </div>
    </button>
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
                <div className={`flex flex-wrap gap-2 rounded-[24px] bg-slate-100 p-1.5 ${compact ? 'max-w-max' : ''}`}>
                    {options.map((option) => {
                        const isSelected = String(field.value) === String(option.value);

                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => field.onChange(option.value)}
                                className={`inline-flex min-w-[128px] flex-1 items-center justify-center gap-2 rounded-[18px] px-4 py-3 text-sm font-semibold transition ${
                                    isSelected
                                        ? 'bg-[#0d7a78] text-white shadow-[0_14px_28px_-18px_rgba(13,122,120,0.9)]'
                                        : 'bg-transparent text-slate-600 hover:bg-white'
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

const DirectionField = ({ name, control, label, options, error, helperText }) => (
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
                                className={`relative rounded-[24px] border p-5 text-start transition ${
                                    isSelected
                                        ? 'border-[#33c6c3] bg-[#f3fffe] shadow-[0_16px_34px_-28px_rgba(13,122,120,0.8)]'
                                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <p className="text-base font-semibold text-slate-900">{option.label}</p>
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
                {helperText ? <p className="mt-2 text-xs text-slate-500">{helperText}</p> : null}
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
                    <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-3">
                        <div className="grid grid-cols-[72px_1fr_72px] items-center gap-3 rounded-[22px] bg-white p-2">
                            <button
                                type="button"
                                onClick={() => handleChange(value - 1)}
                                className="flex h-16 items-center justify-center rounded-[18px] bg-slate-100 text-3xl text-slate-500 transition hover:bg-slate-200"
                            >
                                -
                            </button>
                            <div className="text-center">
                                <div className="text-4xl font-semibold leading-none text-[#004247]">{value}</div>
                                <div className="mt-2 text-xs text-slate-500">{helperText}</div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleChange(value + 1)}
                                className="flex h-16 items-center justify-center rounded-[18px] bg-[#0d7a78] text-3xl text-white transition hover:bg-[#0b6664]"
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

const AutoTasbitNotice = ({ title, description }) => (
    <div className="rounded-[24px] border border-emerald-100 bg-emerald-50/80 p-4">
        <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">{title}</p>
                <p className="text-sm text-slate-600">{description}</p>
            </div>
            <div className="relative h-8 w-14 rounded-full bg-emerald-500 shadow-inner">
                <span className="absolute end-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm">
                    <CheckIcon width={12} height={12} />
                </span>
            </div>
        </div>
    </div>
);

const LearningPathSummary = ({ title, buttonLabel, onOpen, planType, selectedStartSegment, selectedEndSegment, formatSegmentVerseInfo, emptyText, startText, endText }) => {
    const hasSelection = Boolean(selectedStartSegment || selectedEndSegment);

    return (
        <SectionCard
            title={title}
            action={(
                <button
                    type="button"
                    onClick={onOpen}
                    className="inline-flex items-center gap-2 rounded-full border border-[#0d7a78]/15 bg-[#e7f5f3] px-4 py-2 text-sm font-medium text-[#0d7a78] transition hover:bg-[#d8efec]"
                >
                    <BookOpenIcon width={16} height={16} />
                    <span>{buttonLabel}</span>
                </button>
            )}
        >
            {hasSelection ? (
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <div className={`grid gap-4 ${planType === 'start_end' ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
                        <div className="rounded-[20px] border border-slate-200 bg-white p-4">
                            <p className="mb-2 text-xs font-medium text-slate-500">{startText}</p>
                            <p className="text-sm font-semibold text-slate-900">{selectedStartSegment ? formatSegmentVerseInfo(selectedStartSegment) : emptyText}</p>
                        </div>
                        {planType === 'start_end' ? (
                            <div className="rounded-[20px] border border-slate-200 bg-white p-4">
                                <p className="mb-2 text-xs font-medium text-slate-500">{endText}</p>
                                <p className="text-sm font-semibold text-slate-900">{selectedEndSegment ? formatSegmentVerseInfo(selectedEndSegment) : emptyText}</p>
                            </div>
                        ) : null}
                    </div>
                </div>
            ) : (
                <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    {emptyText}
                </div>
            )}
        </SectionCard>
    );
};

/**
 * Create Plan Form Component
 * Creates a plan for a specific student in a halaqa
 */
const CreatePlanForm = ({ halaqaId, students, activities, onSuccess, onCancel, wizardMode = false, onWizardStepChange }) => {
    const { t, i18n } = useTranslation();
    const queryClient = useQueryClient();
    const createPlanMutation = useCreatePlan();
    const currentLang = i18n.language || 'ar';
    const isArabic = currentLang === 'ar';
    const copy = useCallback((arabicText, englishText) => (isArabic ? arabicText : englishText), [isArabic]);

    const defaultActivity = useMemo(() => {
        if (activities && activities.length > 0) {
            return activities[0];
        }

        return 'hifz';
    }, [activities]);

    const {
        control,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch,
        register
    } = useFormWithValidation({
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

    const currentActivity = useWatch({ control, name: 'activity' });
    const planType = useWatch({ control, name: 'plan_type' });
    const selectedStudentIds = useWatch({ control, name: 'student_ids' });
    const [wizardStep, setWizardStep] = useState(1);
    const [studentSearch, setStudentSearch] = useState('');

    const [pageNumber, setPageNumber] = useState(undefined);
    const [selectedStartSegment, setSelectedStartSegment] = useState(null);
    const [, setEndPageNumber] = useState(undefined);
    const [selectedEndSegment, setSelectedEndSegment] = useState(null);
    const [showMushafSegmentPickerModal, setShowMushafSegmentPickerModal] = useState(false);
    const [showPlanMushafViewer, setShowPlanMushafViewer] = useState(false);
    const [planStartVerseKey, setPlanStartVerseKey] = useState(undefined);
    const [planEndVerseKey, setPlanEndVerseKey] = useState(undefined);
    const [surahData, setSurahData] = useState(null);
    const [planPreviewData, setPlanPreviewData] = useState(null);
    const planPreviewRef = useRef(null);

    useEffect(() => {
        if (!wizardMode || !onWizardStepChange) {
            return;
        }

        const outerStep = wizardStep === 1 ? 3 : wizardStep === 2 ? 4 : 5;
        onWizardStepChange(outerStep);
    }, [onWizardStepChange, wizardMode, wizardStep]);

    useEffect(() => {
        if (planPreviewData && planPreviewRef.current) {
            planPreviewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [planPreviewData]);

    useEffect(() => {
        loadSurahData()
            .then((data) => {
                setSurahData(data);
            })
            .catch((error) => {
                console.error('Error loading surah data:', error);
            });
    }, []);

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

    useEffect(() => {
        setSelectedStartSegment(null);
        setSelectedEndSegment(null);
        setValue('start_segment_verse_key', undefined);
        setValue('end_segment_verse_key', undefined);
        setValue('end_juz_number', undefined);
        setValue('end_surah_id', undefined);
    }, [pageNumber, setValue]);

    useEffect(() => {
        if (selectedStartSegment) {
            setValue('start_segment_verse_key', selectedStartSegment.first_verse_key);
        }
    }, [selectedStartSegment, setValue]);

    useEffect(() => {
        if (planType === 'start_end' && selectedEndSegment) {
            setValue('end_segment_verse_key', selectedEndSegment.last_verse_key);
        }
    }, [planType, selectedEndSegment, setValue]);

    useEffect(() => {
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
    }, [setValue]);

    useEffect(() => {
        if (planType === 'daily_amount') {
            setValue('end_segment_verse_key', undefined);
            setValue('end_juz_number', undefined);
            setValue('end_surah_id', undefined);
            setEndPageNumber(undefined);
            setSelectedEndSegment(null);
        }
    }, [planType, setValue]);

    useEffect(() => {
        if (activities && activities.length > 0 && currentActivity && !activities.includes(currentActivity)) {
            setValue('activity', activities[0]);
        }
    }, [activities, currentActivity, setValue]);

    const { studentsOptions: allStudentsOptions, isLoadingStudents } = useCreateHalaqaFormQueries();

    const studentsOptions = useMemo(() => {
        if (students && students.length > 0) {
            return students.map((student) => ({
                value: student.id,
                label: typeof student.name === 'object' && student.name
                    ? (currentLang === 'ar' && student.name.ar ? student.name.ar : student.name.en) || t('plan.studentId', { id: student.id })
                    : t('plan.studentId', { id: student.id })
            }));
        }

        return allStudentsOptions;
    }, [allStudentsOptions, currentLang, students, t]);

    const wizardStudents = useMemo(() => (
        studentsOptions.map((student) => ({
            ...student,
            id: Number(student.value ?? student.id),
            avatar: student.avatar
        }))
    ), [studentsOptions]);

    const filteredWizardStudents = useMemo(() => {
        const searchValue = studentSearch.trim().toLowerCase();
        if (!searchValue) {
            return wizardStudents;
        }

        return wizardStudents.filter((student) => String(student.label ?? '').toLowerCase().includes(searchValue));
    }, [studentSearch, wizardStudents]);

    const activityOptions = useMemo(() => {
        const allActivities = HALAQA_ACTIVITIES.map((activity) => ({
            value: activity.value,
            label: t(activity.labelKey, activity.value)
        }));

        if (activities && activities.length > 0) {
            return allActivities.filter((activity) => activities.includes(activity.value));
        }

        return allActivities;
    }, [activities, t]);

    const planTypeOptions = useMemo(() => PLAN_TYPES.map((type) => ({
        value: type.value,
        label: t(type.labelKey, type.value)
    })), [t]);

    const directionOptions = useMemo(() => PLAN_DIRECTIONS.map((direction) => ({
        value: direction.value,
        label: t(direction.labelKey, direction.value),
        description: direction.value === 'incremental'
            ? copy('للبداية من البداية إلى الناس', 'From the beginning toward the end')
            : copy('للبداية من الناس إلى البقرة', 'From the end back to the beginning')
    })), [copy, t]);

    const hasTasbitActivity = Array.isArray(activities) && activities.includes('tasbit');

    const getStartVerseKey = (formData) => formData.start_segment_verse_key ?? null;

    const buildPayload = (formData, saveOrNot) => {
        const startVerseKey = getStartVerseKey(formData);

        if (!startVerseKey || !formData.student_ids?.length) {
            return null;
        }

        return {
            activity: formData.activity,
            student_ids: formData.student_ids,
            plan_type: formData.plan_type,
            unit: 'segments',
            direction: formData.direction,
            start_verse_key: startVerseKey,
            save_or_not: saveOrNot,
            ...(formData.plan_type === 'daily_amount' && formData.daily_amount ? { daily_amount: formData.daily_amount } : {}),
            ...(formData.plan_type === 'start_end' && formData.end_segment_verse_key ? { end_verse_key: formData.end_segment_verse_key } : {})
        };
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

    const getErrorMessage = useCallback((message) => {
        if (!message) {
            return '';
        }

        return t(message, message);
    }, [t]);

    const onSubmit = (formData) => {
        const payload = buildPayload(formData, 0);

        if (!payload) {
            toast.error(t('plan.invalidForm', copy('يرجى استكمال جميع الحقول المطلوبة.', 'Please fill all required fields.')));
            return;
        }

        createPlanMutation.mutate({ halaqaId, data: payload }, {
            onSuccess: (response, variables) => {
                const isPreviewRequest = variables?.data?.save_or_not === 0;
                const normalizedResponse = response?.data ?? response;
                const responseData = normalizedResponse?.data ?? normalizedResponse;

                if (isPreviewRequest && responseData) {
                    setPlanPreviewData(responseData);
                    if (wizardMode) {
                        setWizardStep(3);
                    }
                    toast.info(t('plan.previewLoaded', copy('تم تجهيز معاينة الخطة. راجع الملخص ثم أكّد الحفظ.', 'Plan preview is ready. Review the summary and confirm save.')));
                    return;
                }

                if (!isPreviewRequest) {
                    toast.success(t('plan.createSuccess', copy('تم إنشاء الخطة بنجاح', 'Plan created successfully')));
                    queryClient.invalidateQueries({ queryKey: ['halaqa', halaqaId] });
                    resetForm();
                    if (wizardMode) {
                        setWizardStep(1);
                    }
                    if (onSuccess) {
                        onSuccess();
                    }
                }
            },
            onError: (error) => {
                toast.error(error?.message || t('plan.createError', copy('حدث خطأ أثناء إنشاء الخطة. حاول مرة أخرى.', 'Error creating plan. Please try again.')));
            }
        });
    };

    const handleConfirmSave = () => {
        const payload = buildPayload(watch(), 1);
        if (!payload) {
            return;
        }

        createPlanMutation.mutate({ halaqaId, data: payload }, {
            onSuccess: () => {
                toast.success(t('plan.createSuccess', copy('تم إنشاء الخطة بنجاح', 'Plan created successfully')));
                queryClient.invalidateQueries({ queryKey: ['halaqa', halaqaId] });
                setPlanPreviewData(null);
                resetForm();
                if (wizardMode) {
                    setWizardStep(1);
                }
                if (onSuccess) {
                    onSuccess();
                }
            },
            onError: (error) => {
                toast.error(error?.message || t('plan.createError', copy('حدث خطأ أثناء إنشاء الخطة. حاول مرة أخرى.', 'Error creating plan. Please try again.')));
            }
        });
    };

    const handleContinueToPlanBuilder = () => {
        if (!selectedStudentIds?.length) {
            toast.error(copy('اختر طالباً واحداً على الأقل', 'Select at least one student'));
            return;
        }

        setWizardStep(2);
    };

    if (wizardMode && wizardStep === 1) {
        return (
            <div className="space-y-6">
                <SectionCard
                    title={copy('نشاط الحلقة', 'Halaqa Activity')}
                    hint={copy('اختر النشاط ثم حدد الطلاب من الحلقة لهذا النشاط.', 'Choose the activity, then select students from the halaqa for that activity.')}
                >
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

                <SectionCard
                    title={copy('طلاب الحلقة', 'Halaqa Students')}
                    hint={selectedStudentIds?.length
                        ? copy(`تم اختيار ${selectedStudentIds.length} طالب`, `${selectedStudentIds.length} students selected`)
                        : copy('اختر الطلاب الذين ستبني لهم خطة هذا النشاط.', 'Choose the students who should receive this activity plan.')}
                    action={(
                        <div className="inline-flex items-center gap-2 rounded-full bg-[#e7f5f3] px-3 py-1.5 text-xs font-medium text-[#0d7a78]">
                            <UsersIcon width={14} height={14} />
                            <span>{copy(`${wizardStudents.length} طلاب`, `${wizardStudents.length} students`)}</span>
                        </div>
                    )}
                >
                    <SearchField
                        value={studentSearch}
                        onChange={(event) => setStudentSearch(event.target.value)}
                        placeholder={copy('ابحث عن اسم الطالب...', 'Search student name...')}
                    />
                    <div className="space-y-3">
                        {filteredWizardStudents.map((student) => (
                            <StudentSelectionCard
                                key={student.id}
                                student={student}
                                selected={selectedStudentIds.includes(student.id)}
                                subtitle={copy('متاح في هذا الوقت', 'Available right now')}
                                onToggle={() => {
                                    const nextValues = selectedStudentIds.includes(student.id)
                                        ? selectedStudentIds.filter((value) => value !== student.id)
                                        : [...selectedStudentIds, student.id];
                                    setValue('student_ids', nextValues, { shouldValidate: true, shouldDirty: true });
                                }}
                            />
                        ))}
                    </div>
                </SectionCard>

                <Button
                    type="button"
                    variant="primary"
                    onClick={handleContinueToPlanBuilder}
                    className="w-full justify-between rounded-[20px] bg-[#0d7a78] px-6 py-4 text-base font-semibold hover:bg-[#0b6664]"
                >
                    <span>{copy('تخصيص الخطة', 'Customize the Plan')}</span>
                    <ChevronRightIcon width={18} height={18} className={isArabic ? 'rotate-180' : ''} />
                </Button>
            </div>
        );
    }

    if (wizardMode && wizardStep === 3 && planPreviewData) {
        return (
            <div className="space-y-6">
                <SectionCard
                    title={copy('ملخص الخطة', 'Plan Review')}
                    hint={copy('راجع الملخص النهائي واعتمد الخطة لهذا النشاط.', 'Review the final summary and approve the plan for this activity.')}
                >
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
                <PlanPreviewCard
                    planPreviewData={planPreviewData}
                    surahData={surahData}
                    currentLang={currentLang}
                    isSaving={createPlanMutation.isPending}
                    onConfirmSave={handleConfirmSave}
                    onBackToEdit={() => {
                        setPlanPreviewData(null);
                        setWizardStep(2);
                    }}
                    onViewInMushaf={() => {
                        setPlanStartVerseKey(planPreviewData.start_verse_key ?? undefined);
                        setPlanEndVerseKey(planPreviewData.end_verse_key ?? planPreviewData.computed_last_verse_key ?? undefined);
                        setShowPlanMushafViewer(true);
                    }}
                    planPreviewRef={planPreviewRef}
                    wizardMode
                />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <SectionCard title={copy('نوع النشاط', 'Activity Type')} hint={copy('اختر النشاط الذي تريد بناء الخطة له أولاً.', 'Choose which activity to build this plan for first.')}>
                <SegmentedField
                    name="activity"
                    control={control}
                    label={t('plan.activity', copy('نشاط الحلقة', 'Plan Activity'))}
                    required
                    options={activityOptions}
                    error={getErrorMessage(errors.activity?.message)}
                />
            </SectionCard>

            <SectionCard title={copy('طريقة بناء الخطة', 'Plan Method')}>
                <SegmentedField
                    name="plan_type"
                    control={control}
                    label={t('plan.planType', copy('طريقة الحفظ', 'Plan Type'))}
                    required
                    options={planTypeOptions.map((option) => ({
                        ...option,
                        label: option.value === 'daily_amount'
                            ? copy('مقدار يومي', 'Daily Amount')
                            : copy('البداية والنهاية', 'Start and End')
                    }))}
                    error={getErrorMessage(errors.plan_type?.message)}
                />

                {planType === 'daily_amount' ? (
                    <StepperField
                        name="daily_amount"
                        control={control}
                        label={t('plan.dailyAmount', copy('مقدار التسميع اليومي', 'Daily Recitation Amount'))}
                        helperText={copy('لوح / يوم', 'segments / day')}
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
                    helperText={copy('اختر المسار الأنسب لبداية الطالب.', 'Choose the direction that best fits the student.')}
                    error={getErrorMessage(errors.direction?.message)}
                />
            </SectionCard>

            <LearningPathSummary
                title={copy('مسار التعلم', 'Learning Path')}
                buttonLabel={copy('تحديد البداية والنهاية', 'Select Start and End')}
                onOpen={() => setShowMushafSegmentPickerModal(true)}
                planType={planType}
                selectedStartSegment={selectedStartSegment}
                selectedEndSegment={selectedEndSegment}
                formatSegmentVerseInfo={formatSegmentVerseInfo}
                emptyText={copy('لم يتم تحديد المقاطع بعد. افتح المصحف لاختيار البداية والنهاية.', 'No segments selected yet. Open the Mushaf to choose the range.')}
                startText={copy('نقطة البداية', 'Start Point')}
                endText={copy('نقطة النهاية', 'End Point')}
            />

            {!wizardMode ? (
                <SectionCard
                    title={t('plan.students', copy('الطلاب المستهدفون', 'Target Students'))}
                    hint={selectedStudentIds?.length
                        ? copy(`تم اختيار ${selectedStudentIds.length} طالب`, `${selectedStudentIds.length} students selected`)
                        : copy('اختر طالباً واحداً أو أكثر لتطبيق الخطة عليهم.', 'Choose one or more students to apply this plan to.')}
                >
                    <SelectRFH
                        name="student_ids"
                        control={control}
                        label={t('plan.students', copy('الطلاب', 'Students'))}
                        required
                        isMulti
                        options={studentsOptions}
                        loading={isLoadingStudents}
                        error={getErrorMessage(errors.student_ids?.message)}
                        placeholder={t('plan.selectStudents', copy('اختر طالباً أو أكثر', 'Select one or more students'))}
                        classes={SELECT_FIELD_CLASSES}
                    />
                </SectionCard>
            ) : null}

            {currentActivity === 'hifz' && hasTasbitActivity ? (
                <AutoTasbitNotice
                    title={copy('تفعيل التثبيت التلقائي', 'Automatic Tasbit is Enabled')}
                    description={copy('سيقوم النظام تلقائياً بربط خطة التثبيت مع جدول التسميع اليومي للطالب عند الحاجة.', 'The system will automatically connect the tasbit plan with the student daily recitation flow when needed.')}
                />
            ) : null}

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
                getSurahName={getSurahName}
            />

            {showPlanMushafViewer && planStartVerseKey && planEndVerseKey ? (
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
            ) : null}

            {planPreviewData && !wizardMode ? (
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
            ) : null}

            {createPlanMutation.error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {createPlanMutation.error.message || t('plan.createError', copy('حدث خطأ أثناء إنشاء الخطة. حاول مرة أخرى.', 'Error creating plan. Please try again.'))}
                </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                {onCancel && !wizardMode ? (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={createPlanMutation.isPending}
                        className="rounded-full border-slate-300 px-5 py-3"
                    >
                        {t('common.cancel', copy('إلغاء', 'Cancel'))}
                    </Button>
                ) : <span />}
                <Button
                    type="submit"
                    variant="primary"
                    loading={createPlanMutation.isPending}
                    disabled={createPlanMutation.isPending}
                    className="rounded-[20px] bg-[#0d7a78] px-6 py-4 text-base font-semibold hover:bg-[#0b6664]"
                >
                    {createPlanMutation.isPending
                        ? t('common.loading', copy('جارٍ التحضير...', 'Preparing...'))
                        : wizardMode
                            ? copy(`تخصيص نشاط ${t(`halaqa.activity.${currentActivity}`, currentActivity)}`, `Customize ${t(`halaqa.activity.${currentActivity}`, currentActivity)} activity`)
                            : t('plan.preview', copy('معاينة الخطة', 'Preview Plan'))}
                </Button>
            </div>
        </form>
    );
};

export default CreatePlanForm;
