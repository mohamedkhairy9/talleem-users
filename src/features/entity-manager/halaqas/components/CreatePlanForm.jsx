import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { Button, FormCheckbox } from '@/shared/components';
import SelectRFH from '@/shared/components/ui/SelectRFH';
import { BookOpenIcon, CheckIcon, ChevronRightIcon, SearchIcon, UserIcon, UsersIcon } from '@/shared/icons';
import { getGregorianDate, normalizeDate, useFormWithValidation } from '@/shared/utils';
import { getJuzNumberForVerseKey, getVerseKeyDisplay, loadSurahData } from '@/shared/utils/helpers/surahHelper';
import { useCreatePlan, useHalaqa } from '../hooks/useHalaqas';
import { useCreateHalaqaFormQueries } from '../hooks/useCreateHalaqaFormQueries';
import { HALAQA_ACTIVITIES, PLAN_DIRECTIONS, PLAN_TYPES } from '../config';
import { createPlanSchema } from '../schemas/plan.schema';
import MushafPageModal from './MushafPageModal';
import MushafSegmentPickerModal from './MushafSegmentPickerModal';
import PlanPreviewCard from './PlanPreviewCard';

const CARD_CLASS = 'rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.5)] md:p-6';
const SELECT_FIELD_CLASSES = '[&_.react-select__control]:min-h-[56px] [&_.react-select__control]:rounded-2xl [&_.react-select__control]:border-slate-200 [&_.react-select__control]:shadow-sm [&_.react-select__control]:px-1 [&_.react-select__control--is-focused]:border-[#0d7a78] [&_.react-select__placeholder]:text-slate-400';
const LAST_QURAN_VERSE_KEY = '114:6';

const addDaysToDateString = (dateStr, days) => {
    const normalizedDate = normalizeDate(dateStr);

    if (!normalizedDate) {
        return '';
    }

    const date = new Date(`${normalizedDate}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return normalizedDate;
    }

    date.setDate(date.getDate() + days);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

const getInclusiveDaysBetween = (startDate, endDate) => {
    const normalizedStart = normalizeDate(startDate);
    const normalizedEnd = normalizeDate(endDate);

    if (!normalizedStart || !normalizedEnd) {
        return undefined;
    }

    const start = new Date(`${normalizedStart}T00:00:00`);
    const end = new Date(`${normalizedEnd}T00:00:00`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
        return undefined;
    }

    return Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
};

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

const getPlanStudentIds = (plan) => {
    if (!plan || typeof plan !== 'object') {
        return [];
    }

    if (Array.isArray(plan.students) && plan.students.length > 0) {
        return plan.students.map((student) => Number(student?.id)).filter(Boolean);
    }

    if (Array.isArray(plan.student_ids) && plan.student_ids.length > 0) {
        return plan.student_ids.map((studentId) => Number(studentId)).filter(Boolean);
    }

    if (plan.student?.id) {
        return [Number(plan.student.id)].filter(Boolean);
    }

    if (plan.student_id) {
        return [Number(plan.student_id)].filter(Boolean);
    }

    return [];
};

const collectStudentPlanActivities = (students = [], plans = []) => {
    const activitiesByStudentId = new Map();

    const registerActivity = (studentId, activity) => {
        const normalizedStudentId = Number(studentId);
        if (!normalizedStudentId || !activity) {
            return;
        }

        if (!activitiesByStudentId.has(normalizedStudentId)) {
            activitiesByStudentId.set(normalizedStudentId, new Set());
        }

        activitiesByStudentId.get(normalizedStudentId).add(activity);
    };

    (Array.isArray(students) ? students : []).forEach((student) => {
        const studentId = Number(student?.id);
        if (!studentId || !Array.isArray(student?.plans)) {
            return;
        }

        student.plans.forEach((plan) => {
            registerActivity(studentId, plan?.activity);
        });
    });

    (Array.isArray(plans) ? plans : []).forEach((plan) => {
        const activity = plan?.activity;
        getPlanStudentIds(plan).forEach((studentId) => {
            registerActivity(studentId, activity);
        });
    });

    return activitiesByStudentId;
};

const getBlockedActivitiesForPlan = ({ activity, autoTasbitEnabled, hasTasbitActivity }) => {
    const blockedActivities = new Set();

    if (activity) {
        blockedActivities.add(activity);
    }

    if (activity === 'hifz' && hasTasbitActivity && autoTasbitEnabled) {
        blockedActivities.add('tasbit');
    }

    return blockedActivities;
};

const SectionCard = ({ title, hint, action, children }) => {
    const visibleChildren = React.Children.toArray(children).filter(Boolean);

    if (visibleChildren.length === 0) {
        return null;
    }

    return (
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
};

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

const AutoTasbitNotice = ({ title, description, control }) => (
    <div className="rounded-[24px] border border-emerald-100 bg-emerald-50/80 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">{title}</p>
                <p className="text-sm text-slate-600">{description}</p>
            </div>
            <div className="shrink-0 rounded-[18px] border border-emerald-200 bg-white px-4 py-3">
                <FormCheckbox
                    name="auto_tasbit_enabled"
                    control={control}
                    label={title}
                />
            </div>
        </div>
    </div>
);

const LearningPathSummary = ({ title, buttonLabel, onOpen, planType, selectedStartSegment, selectedEndSegment, formatSegmentVerseInfo, emptyText, startText, endText, showEndSelection = false }) => {
    const hasSelection = Boolean(selectedStartSegment || selectedEndSegment);
    const shouldShowEndSelection = planType === 'start_end' || showEndSelection || Boolean(selectedEndSegment);

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
                    <div className={`grid gap-4 ${shouldShowEndSelection ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
                        <div className="rounded-[20px] border border-slate-200 bg-white p-4">
                            <p className="mb-2 text-xs font-medium text-slate-500">{startText}</p>
                            <p className="text-sm font-semibold text-slate-900">{selectedStartSegment ? formatSegmentVerseInfo(selectedStartSegment) : emptyText}</p>
                        </div>
                        {shouldShowEndSelection ? (
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
    const { data: halaqaResponse } = useHalaqa(halaqaId);
    const currentLang = i18n.language || 'ar';
    const isArabic = currentLang === 'ar';
    const copy = useCallback((arabicText, englishText) => (isArabic ? arabicText : englishText), [isArabic]);

    const halaqaData = useMemo(() => {
        const raw = halaqaResponse?.data;
        return raw && typeof raw === 'object' && 'data' in raw ? raw.data : raw;
    }, [halaqaResponse]);

    const defaultActivity = useMemo(() => {
        if (Array.isArray(activities) && activities.includes('hifz')) {
            return 'hifz';
        }

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
            auto_tasbit_enabled: Array.isArray(activities) && activities.includes('tasbit'),
            student_ids: [],
            plan_type: 'daily_amount',
            unit: 'segments',
            direction: 'incremental',
            start_segment_verse_key: '',
            start_juz_number: undefined,
            start_surah_id: undefined,
            end_segment_verse_key: '',
            end_juz_number: undefined,
            end_surah_id: undefined,
            daily_amount: 1
        }
    });

    const currentActivity = useWatch({ control, name: 'activity' });
    const autoTasbitEnabled = useWatch({ control, name: 'auto_tasbit_enabled' });
    const planType = useWatch({ control, name: 'plan_type' });
    const selectedStudentIds = useWatch({ control, name: 'student_ids' });
    const currentDirection = useWatch({ control, name: 'direction' });
    const currentDailyAmount = useWatch({ control, name: 'daily_amount' });
    const currentStartSegmentVerseKey = useWatch({ control, name: 'start_segment_verse_key' });
    const currentEndSegmentVerseKey = useWatch({ control, name: 'end_segment_verse_key' });
    const isDailyAmountPlan = planType === 'daily_amount';
    const [wizardStep, setWizardStep] = useState(1);
    const [studentSearch, setStudentSearch] = useState('');

    const [selectedStartSegment, setSelectedStartSegment] = useState(null);
    const [selectedEndSegment, setSelectedEndSegment] = useState(null);
    const [showMushafSegmentPickerModal, setShowMushafSegmentPickerModal] = useState(false);
    const [showPlanMushafViewer, setShowPlanMushafViewer] = useState(false);
    const [planStartVerseKey, setPlanStartVerseKey] = useState(undefined);
    const [planEndVerseKey, setPlanEndVerseKey] = useState(undefined);
    const [surahData, setSurahData] = useState(null);
    const [planPreviewItems, setPlanPreviewItems] = useState([]);
    const [planRequestError, setPlanRequestError] = useState(null);
    const [isSubmittingPlanRequests, setIsSubmittingPlanRequests] = useState(false);
    const [hasRequestedPreview, setHasRequestedPreview] = useState(false);
    const planPreviewRef = useRef(null);
    const previewDebounceRef = useRef(null);
    const latestPreviewSignatureRef = useRef(null);
    const latestPreviewRequestIdRef = useRef(0);
    const isSubmittingPlan = createPlanMutation.isPending || isSubmittingPlanRequests;
    const activePlanError = planRequestError ?? createPlanMutation.error ?? null;

    useEffect(() => {
        if (!wizardMode || !onWizardStepChange) {
            return;
        }

        const outerStep = wizardStep === 1 ? 3 : wizardStep === 2 ? 4 : 5;
        onWizardStepChange(outerStep);
    }, [onWizardStepChange, wizardMode, wizardStep]);

    useEffect(() => {
        if (planPreviewItems.length > 0 && planPreviewRef.current) {
            planPreviewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [planPreviewItems]);

    useEffect(() => () => {
        if (previewDebounceRef.current) {
            clearTimeout(previewDebounceRef.current);
        }
    }, []);

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
        const nextStartVerseKey = selectedStartSegment
            ? getSegmentBoundaryVerseKey(selectedStartSegment, currentDirection, 'start')
            : currentDirection === 'decremental'
                ? LAST_QURAN_VERSE_KEY
                : '';

        if (currentStartSegmentVerseKey !== nextStartVerseKey) {
            setValue('start_segment_verse_key', nextStartVerseKey);
        }
    }, [currentDirection, currentStartSegmentVerseKey, selectedStartSegment, setValue]);

    useEffect(() => {
        const nextEndVerseKey = selectedEndSegment
            ? getSegmentBoundaryVerseKey(selectedEndSegment, currentDirection, 'end')
            : '';

        if (currentEndSegmentVerseKey !== nextEndVerseKey) {
            setValue('end_segment_verse_key', nextEndVerseKey);
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
            setValue('end_segment_verse_key', '');
        }
    }, [currentEndSegmentVerseKey, isDailyAmountPlan, selectedEndSegment, setValue]);

    const { studentsOptions: allStudentsOptions, isLoadingStudents } = useCreateHalaqaFormQueries();
    const hasTasbitActivity = Array.isArray(activities) && activities.includes('tasbit');
    const isLinkedHifzTasbitFlow = Array.isArray(activities) && activities.includes('hifz') && activities.includes('tasbit');

    const baseStudentsOptions = useMemo(() => {
        if (students && students.length > 0) {
            return students.map((student) => ({
                value: student.id,
                id: Number(student.id),
                avatar: student.avatar,
                label: typeof student.name === 'object' && student.name
                    ? (currentLang === 'ar' && student.name.ar ? student.name.ar : student.name.en) || t('plan.studentId', { id: student.id })
                    : t('plan.studentId', { id: student.id })
            }));
        }

        return allStudentsOptions;
    }, [allStudentsOptions, currentLang, students, t]);

    const existingPlanActivitiesByStudentId = useMemo(
        () => collectStudentPlanActivities(students, halaqaData?.plans),
        [halaqaData?.plans, students]
    );

    const blockedActivitiesForSelection = useMemo(
        () => getBlockedActivitiesForPlan({
            activity: currentActivity,
            autoTasbitEnabled,
            hasTasbitActivity
        }),
        [autoTasbitEnabled, currentActivity, hasTasbitActivity]
    );

    const studentsOptions = useMemo(() => (
        baseStudentsOptions.filter((student) => {
            const studentId = Number(student.value ?? student.id);
            const existingActivities = existingPlanActivitiesByStudentId.get(studentId);

            if (!existingActivities || existingActivities.size === 0) {
                return true;
            }

            return !Array.from(blockedActivitiesForSelection).some((activity) => existingActivities.has(activity));
        })
    ), [baseStudentsOptions, blockedActivitiesForSelection, existingPlanActivitiesByStudentId]);

    const wizardStudents = useMemo(() => (
        studentsOptions.map((student) => ({
            ...student,
            id: Number(student.value ?? student.id),
            avatar: student.avatar
        }))
    ), [studentsOptions]);

    useEffect(() => {
        const allowedStudentIds = new Set(
            studentsOptions.map((student) => Number(student.value ?? student.id)).filter(Boolean)
        );

        const nextSelectedStudentIds = (Array.isArray(selectedStudentIds) ? selectedStudentIds : [])
            .filter((studentId) => allowedStudentIds.has(Number(studentId)));

        if (nextSelectedStudentIds.length !== (Array.isArray(selectedStudentIds) ? selectedStudentIds.length : 0)) {
            setValue('student_ids', nextSelectedStudentIds, {
                shouldValidate: true,
                shouldDirty: true
            });
        }
    }, [selectedStudentIds, setValue, studentsOptions]);

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
            return allActivities.filter((activity) => (
                activities.includes(activity.value) &&
                (!isLinkedHifzTasbitFlow || activity.value !== 'tasbit')
            ));
        }

        return allActivities;
    }, [activities, isLinkedHifzTasbitFlow, t]);

    useEffect(() => {
        const firstAllowedActivity = activityOptions[0]?.value;

        if (!firstAllowedActivity) {
            return;
        }

        if (currentActivity !== firstAllowedActivity && !activityOptions.some((activity) => activity.value === currentActivity)) {
            setValue('activity', firstAllowedActivity);
        }
    }, [activityOptions, currentActivity, setValue]);

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

    const halaqaPlanDates = useMemo(() => {
        const startDate = normalizeDate(getGregorianDate(halaqaData?.start_date ?? halaqaData?.date?.from));
        const endDate = normalizeDate(getGregorianDate(halaqaData?.end_date ?? halaqaData?.date?.to));

        return {
            startDate: startDate || '',
            endDate: endDate || ''
        };
    }, [halaqaData]);

    const previewFormValues = useMemo(() => ({
        activity: currentActivity,
        auto_tasbit_enabled: autoTasbitEnabled,
        student_ids: selectedStudentIds,
        plan_type: planType,
        direction: currentDirection,
        daily_amount: currentDailyAmount,
        start_segment_verse_key: currentStartSegmentVerseKey,
        end_segment_verse_key: currentEndSegmentVerseKey
    }), [
        currentActivity,
        autoTasbitEnabled,
        selectedStudentIds,
        planType,
        currentDirection,
        currentDailyAmount,
        currentStartSegmentVerseKey,
        currentEndSegmentVerseKey
    ]);

    const getStartVerseKey = useCallback((formData) => formData.start_segment_verse_key ?? null, []);

    const shouldAutoCreateTasbitPlan = useCallback((activity, enabled) => (
        activity === 'hifz' && hasTasbitActivity && Boolean(enabled)
    ), [hasTasbitActivity]);

    const buildPayload = useCallback((formData, saveOrNot, activityOverride = formData.activity, dateOverrides = {}) => {
        const startVerseKey = getStartVerseKey(formData);

        if (!startVerseKey || !formData.student_ids?.length) {
            return null;
        }

        const startDate = dateOverrides.start_date || '';
        const endDate = dateOverrides.end_date || '';

        return {
            activity: activityOverride,
            student_ids: formData.student_ids,
            plan_type: formData.plan_type,
            unit: 'segments',
            direction: formData.direction,
            start_verse_key: startVerseKey,
            save_or_not: saveOrNot,
            ...(startDate ? { start_date: startDate } : {}),
            ...(endDate ? { end_date: endDate } : {}),
            ...(formData.plan_type === 'daily_amount' && formData.daily_amount ? { daily_amount: formData.daily_amount } : {}),
            ...(formData.end_segment_verse_key ? { end_verse_key: formData.end_segment_verse_key } : {})
        };
    }, [getStartVerseKey]);

    const buildPlanRequests = useCallback((formData, saveOrNot) => {
        const primaryPayload = buildPayload(formData, saveOrNot, formData.activity, {
            start_date: halaqaPlanDates.startDate,
            end_date: halaqaPlanDates.endDate
        });

        if (!primaryPayload) {
            return [];
        }

        const requests = [{
            activity: primaryPayload.activity,
            data: primaryPayload
        }];

        if (shouldAutoCreateTasbitPlan(formData.activity, formData.auto_tasbit_enabled)) {
            const tasbitStartDate = halaqaPlanDates.startDate
                ? addDaysToDateString(halaqaPlanDates.startDate, 1)
                : '';

            requests.push({
                activity: 'tasbit',
                data: buildPayload(formData, saveOrNot, 'tasbit', {
                    start_date: tasbitStartDate,
                    end_date: halaqaPlanDates.endDate
                })
            });
        }

        return requests.filter((request) => Boolean(request.data));
    }, [buildPayload, halaqaPlanDates.endDate, halaqaPlanDates.startDate, shouldAutoCreateTasbitPlan]);

    const getPlanRequestsSignature = useCallback((requests) => JSON.stringify(
        requests.map((request) => ({
            activity: request.activity,
            data: request.data
        }))
    ), []);

    const getActivityLabel = useCallback((activity) => (
        t(`halaqa.activity.${activity}`, activity)
    ), [t]);

    const buildLocalPreviewItems = useCallback((formData) => {
        const requests = buildPlanRequests(formData, 0);
        const availableStudyDays = Number(halaqaData?.duration_in_days) > 0
            ? Number(halaqaData.duration_in_days)
            : getInclusiveDaysBetween(halaqaPlanDates.startDate, halaqaPlanDates.endDate);

        return requests.map((request) => {
            const isDailyAmountRequest = request.data?.plan_type === 'daily_amount';

            return {
                activity: request.activity,
                data: {
                    ...request.data,
                    preview_only: true,
                    available_study_days: availableStudyDays,
                    requested_daily_amount: request.data?.daily_amount,
                    warning: isDailyAmountRequest
                        ? copy('هذه معاينة محلية فقط. سيتم احتساب نهاية الخطة والتحقق النهائي عند اعتماد الخطة.', 'This is a local preview only. The plan end and final validation will be calculated when you approve the plan.')
                        : copy('هذه معاينة محلية فقط. سيتم التحقق النهائي عند اعتماد الخطة.', 'This is a local preview only. Final validation will happen when you approve the plan.')
                }
            };
        });
    }, [buildPlanRequests, copy, halaqaData?.duration_in_days, halaqaPlanDates.endDate, halaqaPlanDates.startDate]);

    const _runPreviewRequest = useCallback(async (formData, {
        showSuccessToast = false,
        showErrorToast = false,
        moveWizardToPreview = false
    } = {}) => {
        const requests = buildPlanRequests(formData, 0);

        if (!requests.length) {
            setPlanPreviewItems([]);
            setPlanRequestError(null);
            latestPreviewSignatureRef.current = null;

            if (showErrorToast) {
                toast.error(t('plan.invalidForm', copy('يرجى استكمال جميع الحقول المطلوبة.', 'Please fill all required fields.')));
            }

            return false;
        }

        const signature = getPlanRequestsSignature(requests);
        latestPreviewSignatureRef.current = signature;

        setPlanRequestError(null);
        setPlanPreviewItems(buildLocalPreviewItems(formData));
        setHasRequestedPreview(true);

        if (wizardMode && moveWizardToPreview) {
            setWizardStep(3);
        }


        if (showSuccessToast) {
                toast.info(t('plan.previewLoaded', copy('تم تجهيز معاينة الخطة. راجع الملخص ثم أكّد الحفظ.', 'Plan preview is ready. Review the summary and confirm save.')));
            }

            return true;
    }, [buildLocalPreviewItems, buildPlanRequests, copy, getPlanRequestsSignature, t, wizardMode]);
    /*
    
            }

            
                toast.error(error?.message || t('plan.createError', copy('حدث خطأ أثناء إنشاء الخطة. حاول مرة أخرى.', 'Error creating plan. Please try again.')));
            }

            return false;
        } finally {
            if (latestPreviewRequestIdRef.current === requestId) {
                setIsSubmittingPlanRequests(false);
            }
        }
    }, [buildPlanRequests, copy, createPlanMutation, getPlanRequestsSignature, halaqaId, normalizePlanResponse, t, wizardMode]);

    */
    const resetForm = () => {
        reset({
            activity: defaultActivity,
            student_ids: [],
            plan_type: 'daily_amount',
            unit: 'segments',
            direction: 'incremental',
            start_segment_verse_key: '',
            start_juz_number: undefined,
            start_surah_id: undefined,
            end_segment_verse_key: '',
            end_juz_number: undefined,
            end_surah_id: undefined,
            daily_amount: 1
        });
        setSelectedStartSegment(null);
        setSelectedEndSegment(null);
        setPlanPreviewItems([]);
        setPlanRequestError(null);
        setHasRequestedPreview(false);
        latestPreviewSignatureRef.current = null;
        latestPreviewRequestIdRef.current += 1;
        if (previewDebounceRef.current) {
            clearTimeout(previewDebounceRef.current);
        }
    };

    const getErrorMessage = useCallback((message) => {
        if (!message) {
            return '';
        }

        return t(message, message);
    }, [t]);

    const getConflictingStudentLabels = useCallback((formData) => {
        const blockedActivities = getBlockedActivitiesForPlan({
            activity: formData?.activity,
            autoTasbitEnabled: Boolean(formData?.auto_tasbit_enabled),
            hasTasbitActivity
        });

        if (!blockedActivities.size || !Array.isArray(formData?.student_ids) || formData.student_ids.length === 0) {
            return [];
        }

        const studentLabelById = new Map(
            baseStudentsOptions.map((student) => [Number(student.value ?? student.id), student.label])
        );

        return formData.student_ids
            .map((studentId) => Number(studentId))
            .filter((studentId) => {
                const existingActivities = existingPlanActivitiesByStudentId.get(studentId);
                return existingActivities && Array.from(blockedActivities).some((activity) => existingActivities.has(activity));
            })
            .map((studentId) => studentLabelById.get(studentId) || t('plan.studentId', { id: studentId }));
    }, [baseStudentsOptions, existingPlanActivitiesByStudentId, hasTasbitActivity, t]);

    const normalizePreviewPlanResponse = useCallback((response) => {
        const normalizedResponse = response?.data ?? response;
        return normalizedResponse?.data ?? normalizedResponse;
    }, []);

    const requestComputedPreview = useCallback(async (formData, {
        showSuccessToast = false,
        showErrorToast = false,
        moveWizardToPreview = false
    } = {}) => {
        const conflictingStudentLabels = getConflictingStudentLabels(formData);
        if (conflictingStudentLabels.length > 0) {
            const activityLabel = t(`halaqa.activity.${formData?.activity}`, formData?.activity || '');
            const message = copy(
                `لا يمكن إنشاء خطة ${activityLabel} مكررة للطلاب: ${conflictingStudentLabels.join('، ')}`,
                `Cannot create a duplicate ${activityLabel} plan for: ${conflictingStudentLabels.join(', ')}`
            );
            setPlanRequestError({ message });
            if (showErrorToast) {
                toast.error(message);
            }
            return false;
        }

        const requests = buildPlanRequests(formData, 0);

        if (!requests.length) {
            setPlanPreviewItems([]);
            setPlanRequestError(null);
            latestPreviewSignatureRef.current = null;

            if (showErrorToast) {
                toast.error(t('plan.invalidForm', copy('يرجى استكمال جميع الحقول المطلوبة.', 'Please fill all required fields.')));
            }

            return false;
        }

        const requestId = latestPreviewRequestIdRef.current + 1;
        const signature = getPlanRequestsSignature(requests);
        latestPreviewRequestIdRef.current = requestId;
        latestPreviewSignatureRef.current = signature;

        createPlanMutation.reset();
        setPlanRequestError(null);
        setIsSubmittingPlanRequests(true);

        try {
            const previewItems = [];

            for (const request of requests) {
                const response = await createPlanMutation.mutateAsync({ halaqaId, data: request.data });
                const responseData = normalizePreviewPlanResponse(response);

                if (responseData) {
                    previewItems.push({
                        activity: request.activity,
                        data: responseData
                    });
                }
            }

            if (latestPreviewRequestIdRef.current !== requestId) {
                return false;
            }

            setPlanPreviewItems(previewItems);
            setHasRequestedPreview(true);

            if (wizardMode && moveWizardToPreview) {
                setWizardStep(3);
            }

            if (showSuccessToast) {
                toast.info(t('plan.previewLoaded', copy('تم تجهيز معاينة الخطة. راجع الملخص ثم أكّد الحفظ.', 'Plan preview is ready. Review the summary and confirm save.')));
            }

            return true;
        } catch (error) {
            if (latestPreviewRequestIdRef.current !== requestId) {
                return false;
            }

            setPlanRequestError(error);
            latestPreviewSignatureRef.current = null;

            if (showErrorToast) {
                toast.error(error?.message || t('plan.createError', copy('حدث خطأ أثناء إنشاء الخطة. حاول مرة أخرى.', 'Error creating plan. Please try again.')));
            }

            return false;
        } finally {
            if (latestPreviewRequestIdRef.current === requestId) {
                setIsSubmittingPlanRequests(false);
            }
        }
    }, [buildPlanRequests, copy, createPlanMutation, getConflictingStudentLabels, getPlanRequestsSignature, halaqaId, normalizePreviewPlanResponse, t, wizardMode]);

    const onSubmit = async (formData) => {
        await requestComputedPreview(formData, {
            showSuccessToast: true,
            showErrorToast: true,
            moveWizardToPreview: true
        });
    };

    const handleConfirmSave = async () => {
        const currentFormData = watch();
        const conflictingStudentLabels = getConflictingStudentLabels(currentFormData);
        if (conflictingStudentLabels.length > 0) {
            const activityLabel = t(`halaqa.activity.${currentFormData?.activity}`, currentFormData?.activity || '');
            const message = copy(
                `لا يمكن إنشاء خطة ${activityLabel} مكررة للطلاب: ${conflictingStudentLabels.join('، ')}`,
                `Cannot create a duplicate ${activityLabel} plan for: ${conflictingStudentLabels.join(', ')}`
            );
            setPlanRequestError({ message });
            toast.error(message);
            return;
        }

        const requests = buildPlanRequests(currentFormData, 1);

        if (!requests.length) {
            return;
        }

        if (previewDebounceRef.current) {
            clearTimeout(previewDebounceRef.current);
        }
        latestPreviewRequestIdRef.current += 1;
        createPlanMutation.reset();
        setPlanRequestError(null);
        setIsSubmittingPlanRequests(true);

        try {
            for (const request of requests) {
                await createPlanMutation.mutateAsync({ halaqaId, data: request.data });
            }

            toast.success(t('plan.createSuccess', copy('تم إنشاء الخطة بنجاح', 'Plan created successfully')));
            queryClient.invalidateQueries({ queryKey: ['halaqa', halaqaId] });
            resetForm();
            if (wizardMode) {
                setWizardStep(1);
            }
            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            setPlanRequestError(error);
            toast.error(error?.message || t('plan.createError', copy('حدث خطأ أثناء إنشاء الخطة. حاول مرة أخرى.', 'Error creating plan. Please try again.')));
        } finally {
            setIsSubmittingPlanRequests(false);
        }
    };

    const handleContinueToPlanBuilder = () => {
        if (!selectedStudentIds?.length) {
            toast.error(copy('اختر طالباً واحداً على الأقل', 'Select at least one student'));
            return;
        }

        setWizardStep(2);
    };

    useEffect(() => {
        if (!hasRequestedPreview) {
            return;
        }

        if (wizardMode && wizardStep === 1) {
            return;
        }

        if (isSubmittingPlanRequests) {
            return;
        }

        const requests = buildPlanRequests(previewFormValues, 0);
        const nextSignature = requests.length > 0 ? getPlanRequestsSignature(requests) : null;

        if (!nextSignature) {
            if (planPreviewItems.length > 0 || planRequestError || latestPreviewSignatureRef.current !== null) {
                setPlanPreviewItems([]);
                setPlanRequestError(null);
                latestPreviewSignatureRef.current = null;
            }
            return;
        }

        if (nextSignature === latestPreviewSignatureRef.current) {
            return;
        }

        if (previewDebounceRef.current) {
            clearTimeout(previewDebounceRef.current);
        }

        previewDebounceRef.current = setTimeout(() => {
            requestComputedPreview(previewFormValues, {
                showSuccessToast: false,
                showErrorToast: false,
                moveWizardToPreview: false
            });
        }, 500);

        return () => {
            if (previewDebounceRef.current) {
                clearTimeout(previewDebounceRef.current);
            }
        };
    }, [buildPlanRequests, getPlanRequestsSignature, hasRequestedPreview, isSubmittingPlanRequests, planPreviewItems.length, planRequestError, previewFormValues, requestComputedPreview, wizardMode, wizardStep]);

    const renderPlanPreviewCards = (previewCardsWizardMode = false) => (
        <div className="space-y-4">
            {planPreviewItems.map((item, index) => (
                <PlanPreviewCard
                    key={`${item.activity}-${index}`}
                    planPreviewData={item.data}
                    surahData={surahData}
                    currentLang={currentLang}
                    isSaving={isSubmittingPlan}
                    onConfirmSave={handleConfirmSave}
                    onBackToEdit={() => {
                        setPlanPreviewItems([]);
                        if (previewCardsWizardMode) {
                            setWizardStep(2);
                        }
                    }}
                    onViewInMushaf={() => {
                        setPlanStartVerseKey(item.data.start_verse_key ?? undefined);
                        setPlanEndVerseKey(item.data.end_verse_key ?? item.data.computed_last_verse_key ?? undefined);
                        setShowPlanMushafViewer(true);
                    }}
                    planPreviewRef={index === 0 ? planPreviewRef : undefined}
                    wizardMode={previewCardsWizardMode}
                    activityLabel={getActivityLabel(item.activity)}
                />
            ))}
        </div>
    );

    if (wizardMode && wizardStep === 1) {
        return (
            <div className="space-y-6">
                <SectionCard
                    title={copy('نشاط الحلقة', 'Halaqa Activity')}
                    hint={copy('اختر النشاط ثم حدد الطلاب من الحلقة لهذا النشاط.', 'Choose the activity, then select students from the halaqa for that activity.')}
                >
                    {activityOptions.length > 1 ? (
                    <SegmentedField
                        name="activity"
                        control={control}
                        label={t('plan.activity', copy('نشاط الحلقة', 'Plan Activity'))}
                        required
                        options={activityOptions}
                        error={getErrorMessage(errors.activity?.message)}
                        compact
                    />
                    ) : null}
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

    if (wizardMode && wizardStep === 3 && planPreviewItems.length > 0) {
        return (
            <div className="space-y-6">
                {activityOptions.length > 1 ? (
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
                ) : null}
                {renderPlanPreviewCards(true)}
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
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <SectionCard title={copy('نوع النشاط', 'Activity Type')} hint={copy('اختر النشاط الذي تريد بناء الخطة له أولاً.', 'Choose which activity to build this plan for first.')}>
                {activityOptions.length > 1 ? (
                <SegmentedField
                    name="activity"
                    control={control}
                    label={t('plan.activity', copy('نشاط الحلقة', 'Plan Activity'))}
                    required
                    options={activityOptions}
                    error={getErrorMessage(errors.activity?.message)}
                />
                ) : null}
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
                    helperText={copy('اختر المسار الأنسب لبداية الطالب.', 'Choose the direction that best fits the student.')}
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
                    ? copy('لم يتم تحديد بداية المقدار اليومي بعد. افتح المصحف لاختيار البداية والسيستم سيحدد النهاية تلقائياً.', 'No start selected yet. Open the Mushaf to choose the start point. The system will determine the end automatically.')
                    : copy('لم يتم تحديد المقاطع بعد. افتح المصحف لاختيار البداية والنهاية.', 'No segments selected yet. Open the Mushaf to choose the range.')}
                startText={copy('نقطة البداية', 'Start Point')}
                endText={copy('نقطة النهاية', 'End Point')}
                showEndSelection={false}
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
                    control={control}
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
                direction={currentDirection}
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

            {planPreviewItems.length > 0 && !wizardMode ? (
                renderPlanPreviewCards(false)
            ) : null}

            {activePlanError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {activePlanError.message || t('plan.createError', copy('حدث خطأ أثناء إنشاء الخطة. حاول مرة أخرى.', 'Error creating plan. Please try again.'))}
                </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                {onCancel && !wizardMode ? (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isSubmittingPlan}
                        className="rounded-full border-slate-300 px-5 py-3"
                    >
                        {t('common.cancel', copy('إلغاء', 'Cancel'))}
                    </Button>
                ) : <span />}
                <Button
                    type="submit"
                    variant="primary"
                    loading={isSubmittingPlan}
                    disabled={isSubmittingPlan}
                    className="rounded-[20px] bg-[#0d7a78] px-6 py-4 text-base font-semibold hover:bg-[#0b6664]"
                >
                    {isSubmittingPlan
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
