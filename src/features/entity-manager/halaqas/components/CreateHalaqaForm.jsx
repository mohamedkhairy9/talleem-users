import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useAuthStore } from '@/app/stores';
import { FormInput, Button } from '@/shared/components';
import SelectRFH from '@/shared/components/ui/SelectRFH';
import { AlertTriangleIcon, BookOpenIcon, CalendarIcon, CheckIcon, ChevronRightIcon, CircleIcon, ClipboardCheckIcon, SearchIcon, TeacherIcon, UserIcon, UsersIcon } from '@/shared/icons';
import { normalizeDate, normalizeSessionTime, useFormWithValidation } from '@/shared/utils';
import { useCreateHalaqa, useHalaqa, useUpdateHalaqa } from '../hooks/useHalaqas';
import { useCreateHalaqaFormQueries } from '../hooks/useCreateHalaqaFormQueries';
import { HALAQA_ACTIVITIES, HALAQA_EVALUATION_SYSTEM_TYPES, HALAQA_PERIODS, HALAQA_TEACHING_METHODS, HALAQA_WEEKLY_HOLIDAYS } from '../config';
import { createHalaqaSchema } from '../schemas/halaqa.schema';
import CreatePlanForm from './CreatePlanForm';

const TOTAL_STEPS = 5;
const SECTION_CARD_CLASS = 'rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.45)] md:p-5';
const FIELD_INPUT_CLASS = 'rounded-[16px] border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-[#0d7a78]';
const SELECT_FIELD_CLASSES = '[&_.react-select__control]:min-h-[52px] [&_.react-select__control]:rounded-[16px] [&_.react-select__control]:border-slate-200 [&_.react-select__control]:shadow-sm [&_.react-select__control]:px-1 [&_.react-select__control--is-focused]:border-[#0d7a78] [&_.react-select__placeholder]:text-slate-400';
const FALLBACK_ENTITY_TYPE_OPTIONS = [
    { value: 1, code: 1, labelAr: 'ذكور', labelEn: 'Male' },
    { value: 2, code: 2, labelAr: 'إناث', labelEn: 'Female' },
    { value: 3, code: 3, labelAr: 'مختلط', labelEn: 'Mixed' }
];

const WEEKDAY_INDEX_BY_HOLIDAY_VALUE = {
    'الأحد': 0,
    'الاثنين': 1,
    'الثلاثاء': 2,
    'الأربعاء': 3,
    'الخميس': 4,
    'الجمعة': 5,
    'السبت': 6
};

const parseDateInput = (value) => {
    if (!value || typeof value !== 'string') {
        return null;
    }

    const parts = value.split('-').map(Number);
    if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
        return null;
    }

    const [year, month, day] = parts;
    const date = new Date(year, month - 1, day);

    if (
        Number.isNaN(date.getTime())
        || date.getFullYear() !== year
        || date.getMonth() !== month - 1
        || date.getDate() !== day
    ) {
        return null;
    }

    return date;
};

const getDurationInDays = (startDate, endDate, weeklyHolidays = []) => {
    if (!startDate || !endDate) {
        return null;
    }

    const start = parseDateInput(startDate);
    const end = parseDateInput(endDate);

    if (!start || !end || end < start) {
        return null;
    }

    const selectedHolidayIndexes = new Set(
        (Array.isArray(weeklyHolidays) ? weeklyHolidays : [])
            .map((value) => WEEKDAY_INDEX_BY_HOLIDAY_VALUE[value])
            .filter((value) => value != null)
    );

    let totalDays = 0;
    const current = new Date(start);

    while (current <= end) {
        if (!selectedHolidayIndexes.has(current.getDay())) {
            totalDays += 1;
        }

        current.setDate(current.getDate() + 1);
    }

    return totalDays;
};

const getPreferredEntityTypeId = (...sources) => {
    for (const source of sources) {
        const value = Number(source);
        if (value > 0) {
            return value;
        }
    }

    return 0;
};

const getEntityTypeDisplayName = (value, isArabic) => {
    if (!value) {
        return '';
    }

    if (typeof value === 'string') {
        return value;
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
        return value[isArabic ? 'ar' : 'en'] ?? value.ar ?? value.en ?? value.label ?? value.name ?? '';
    }

    return '';
};

const arePrimitiveArraysEqual = (left = [], right = []) => (
    left.length === right.length && left.every((value, index) => value === right[index])
);

const StepHeader = ({ currentStep, title, subtitle, onBack, isArabic, stepLabel }) => {
    return (
        <div className="relative overflow-hidden bg-[linear-gradient(135deg,#004247_0%,#0a6666_55%,#12797b_100%)] px-5 pb-6 pt-5 text-white md:px-8 md:pb-8 md:pt-7">
            <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'radial-gradient(circle at 12% 18%, rgba(255,255,255,0.25), transparent 28%), radial-gradient(circle at 85% 22%, rgba(255,255,255,0.18), transparent 24%), linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
                backgroundSize: 'auto, auto, 24px 24px, 24px 24px'
            }} />
            <div className="relative flex items-start justify-between gap-4">
                <div className="space-y-2">
                    <p className="text-xs font-medium text-white/75 md:text-sm">{stepLabel}</p>
                    <h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>
                    <p className="max-w-2xl text-sm text-white/80 md:text-base">{subtitle}</p>
                </div>
                <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 transition hover:bg-white/15"
                    aria-label={isArabic ? 'الرجوع إلى الحلقات' : 'Back to halaqas'}
                >
                    <ChevronRightIcon width={20} height={20} className={isArabic ? '' : 'rotate-180'} />
                </button>
            </div>
            <div className="relative mt-6 grid grid-cols-5 gap-2">
                {Array.from({ length: TOTAL_STEPS }, (_, index) => {
                    const stepNumber = index + 1;
                    const isActive = stepNumber <= currentStep;

                    return (
                        <span
                            key={stepNumber}
                            className={`h-2 rounded-full transition ${isActive ? 'bg-white shadow-[0_0_18px_rgba(255,255,255,0.6)]' : 'bg-white/20'}`}
                        />
                    );
                })}
            </div>
        </div>
    );
};

const SectionCard = ({ icon, title, children }) => {
    const IconComponent = icon;

    return (
        <section className={SECTION_CARD_CLASS}>
            <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e7f5f3] text-[#0d7a78]">
                    <IconComponent width={18} height={18} />
                </div>
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

const StudentSelectionCard = ({ student, subtitle, selected, disabled = false, onToggle, trailingText }) => (
    <button
        type="button"
        disabled={disabled}
        onClick={onToggle}
        className={`flex w-full items-center gap-3 rounded-[22px] border p-4 text-start transition ${disabled
            ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-80'
            : selected
                ? 'border-[#33c6c3] bg-[#f3fffe] shadow-[0_16px_30px_-26px_rgba(13,122,120,0.8)]'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
    >
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${selected
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
                <p className={`truncate text-sm font-semibold ${disabled ? 'text-slate-500' : 'text-slate-900'}`}>
                    {student.label}
                </p>
                {subtitle ? <p className={`mt-1 text-xs ${disabled ? 'text-rose-500' : 'text-slate-500'}`}>{subtitle}</p> : null}
            </div>
        </div>
        {trailingText ? <span className="shrink-0 text-xs font-medium text-[#0d7a78]">{trailingText}</span> : null}
    </button>
);

const SingleSelectPillsField = ({ name, control, label, options, error, required = false, disabled = false }) => {
    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => (
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                        {label}
                        {required && <span className="ms-1 text-rose-500">*</span>}
                    </label>
                    <div className={`flex flex-wrap gap-2 rounded-[24px] p-1.5 ${disabled ? 'bg-slate-50' : 'bg-slate-100'}`}>
                        {options.map((option) => {
                            const isSelected = String(field.value) === String(option.value);

                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => {
                                        if (!disabled) {
                                            field.onChange(option.value);
                                        }
                                    }}
                                    className={`flex min-w-[120px] flex-1 items-center justify-center gap-2 rounded-[18px] px-4 py-3 text-sm font-semibold transition ${disabled
                                        ? isSelected
                                            ? 'cursor-not-allowed bg-slate-200 text-slate-700'
                                            : 'cursor-not-allowed bg-transparent text-slate-400'
                                        : isSelected
                                            ? 'bg-[#0d7a78] text-white shadow-[0_14px_28px_-18px_rgba(13,122,120,0.9)]'
                                            : 'bg-transparent text-slate-600 hover:bg-white'
                                        }`}
                                >
                                    {isSelected && <CheckIcon width={16} height={16} />}
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
};

const MultiChipField = ({ name, control, label, options, error, required = false, helperText, onToggleOption, disabled = false }) => {
    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => {
                const selectedValues = Array.isArray(field.value) ? field.value : [];

                const handleToggle = (nextValue) => {
                    if (disabled) {
                        return;
                    }

                    const alreadySelected = selectedValues.includes(nextValue);
                    const nextValues = alreadySelected
                        ? selectedValues.filter((value) => value !== nextValue)
                        : [...selectedValues, nextValue];

                    if (onToggleOption) {
                        onToggleOption(nextValues, field, nextValue, alreadySelected);
                        return;
                    }

                    field.onChange(nextValues);
                };

                return (
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            {label}
                            {required && <span className="ms-1 text-rose-500">*</span>}
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {options.map((option) => {
                                const isSelected = selectedValues.includes(option.value);

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        disabled={disabled}
                                        onClick={() => handleToggle(option.value)}
                                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${disabled
                                            ? isSelected
                                                ? 'cursor-not-allowed border-slate-300 bg-slate-200 text-slate-700'
                                                : 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                                            : isSelected
                                                ? 'border-[#0d7a78] bg-[#10b981] text-white shadow-[0_12px_24px_-18px_rgba(16,185,129,0.9)]'
                                                : 'border-slate-200 bg-white text-slate-600 hover:border-[#0d7a78] hover:text-[#0d7a78]'
                                            }`}
                                    >
                                        {isSelected && <CheckIcon width={14} height={14} />}
                                        <span>{option.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="mt-1 min-h-4 text-xs text-red-600">{error ?? ''}</p>
                        {helperText ? <p className="mt-1 text-xs text-[#0d7a78]">{helperText}</p> : null}
                    </div>
                );
            }}
        />
    );
};

const TimeRangeField = ({ control, error, label, startLabel, endLabel }) => {
    return (
        <Controller
            name="session_time"
            control={control}
            render={({ field }) => {
                const match = (field.value || '').match(/^(\d{2}:\d{2})-(\d{2}:\d{2})$/);
                const startTime = match ? match[1] : '';
                const endTime = match ? match[2] : '';

                return (
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            {label}
                            <span className="ms-1 text-rose-500">*</span>
                        </label>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(event) => {
                                        const nextStart = event.target.value;
                                        const nextEnd = endTime || nextStart;
                                        field.onChange(nextStart ? `${nextStart}-${nextEnd}` : '');
                                    }}
                                    onBlur={field.onBlur}
                                    className={`w-full ${FIELD_INPUT_CLASS}`}
                                    aria-label={startLabel}
                                />
                                <span className="mt-1 block text-xs text-slate-500">{startLabel}</span>
                            </div>
                            <div>
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={(event) => {
                                        const nextEnd = event.target.value;
                                        const nextStart = startTime || nextEnd;
                                        field.onChange(nextEnd ? `${nextStart}-${nextEnd}` : '');
                                    }}
                                    onBlur={field.onBlur}
                                    className={`w-full ${FIELD_INPUT_CLASS}`}
                                    aria-label={endLabel}
                                />
                                <span className="mt-1 block text-xs text-slate-500">{endLabel}</span>
                            </div>
                        </div>
                        <p className="mt-1 min-h-4 text-xs text-red-600">{error ?? ''}</p>
                    </div>
                );
            }}
        />
    );
};

const AvailabilityPanel = ({
    title,
    description,
    buttonLabel,
    checkingLabel,
    isChecking,
    canCheckAvailability,
    onCheckAvailability,
    hasRequestError,
    requestErrorText,
    availabilityResult,
    isAvailable,
    hasConflict,
    hasConflictsData,
    generatedScheduleTitle,
    conflictsTitle,
    conflictsUnknownText,
    teacherLabel,
    checkingAvailabilityText,
    availableText,
    notAvailableText
}) => {
    return (
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 md:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                    <p className="text-sm text-slate-500">{description}</p>
                </div>
                <Button
                    type="button"
                    variant="primary"
                    onClick={onCheckAvailability}
                    disabled={!canCheckAvailability || isChecking}
                    loading={isChecking}
                    className="w-full rounded-full bg-[#0d7a78] px-5 py-3 text-sm hover:bg-[#0b6664] md:w-auto"
                >
                    {isChecking ? checkingLabel : buttonLabel}
                </Button>
            </div>

            {isChecking ? (
                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-slate-600">
                    <CircleIcon width={18} height={18} className="animate-spin" />
                    <span className="text-sm font-medium">{checkingAvailabilityText}</span>
                </div>
            ) : null}

            {hasRequestError ? (
                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-700">
                    <AlertTriangleIcon width={18} height={18} />
                    <span className="text-sm font-medium">{requestErrorText}</span>
                </div>
            ) : null}

            {availabilityResult ? (
                <div className="mt-4 space-y-4">
                    <div className={`rounded-[22px] border p-4 ${isAvailable
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                        : 'border-rose-200 bg-rose-50 text-rose-900'
                        }`}>
                        <div className="flex items-start gap-3">
                            {isAvailable ? (
                                <ClipboardCheckIcon width={22} height={22} className="mt-0.5 text-emerald-600" />
                            ) : (
                                <AlertTriangleIcon width={22} height={22} className="mt-0.5 text-rose-600" />
                            )}
                            <div className="space-y-1">
                                <p className="text-sm font-semibold">{isAvailable ? availableText : notAvailableText}</p>
                                <p className="text-sm">{availabilityResult.message}</p>
                            </div>
                        </div>
                    </div>

                    {(hasConflict || hasConflictsData) && availabilityResult.conflicts ? (
                        <div className="rounded-[22px] border border-rose-200 bg-white p-4">
                            <div className="mb-3 flex items-center gap-2 text-rose-700">
                                <AlertTriangleIcon width={18} height={18} />
                                <p className="text-sm font-semibold">{conflictsTitle}</p>
                            </div>
                            <div className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-800">
                                {availabilityResult.conflicts.teacher ? (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-semibold">{teacherLabel}:</span>
                                        <span>{availabilityResult.conflicts.teacher.ar || availabilityResult.conflicts.teacher.en}</span>
                                    </div>
                                ) : (
                                    <p>{conflictsUnknownText}</p>
                                )}
                            </div>
                        </div>
                    ) : null}

                    {availabilityResult.generated_schedule && availabilityResult.generated_schedule.length > 0 ? (
                        <div className="rounded-[22px] border border-sky-200 bg-sky-50 p-4">
                            <p className="mb-3 text-sm font-semibold text-sky-900">{generatedScheduleTitle}</p>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {availabilityResult.generated_schedule.map((schedule, index) => (
                                    <div key={`${schedule.day}-${index}`} className="rounded-2xl border border-sky-100 bg-white p-3 text-sm text-sky-900">
                                        <p className="font-medium">{schedule.day}</p>
                                        <p className="text-sky-700">{schedule.from} - {schedule.to}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
};

/**
 * Create Halaqa Form Component
 */
const CreateHalaqaForm = ({ onBack }) => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { lang } = useParams();
    const queryClient = useQueryClient();
    const createHalaqaMutation = useCreateHalaqa();
    const updateHalaqaMutation = useUpdateHalaqa();
    const entity = useAuthStore((state) => state.user?.entity);
    const isArabic = i18n.language === 'ar';
    const copy = useCallback((arabicText, englishText) => (isArabic ? arabicText : englishText), [isArabic]);
    const { control, handleSubmit, formState: { errors }, setValue } = useFormWithValidation({
        schema: createHalaqaSchema,
        defaultValues: {
            name: { ar: '', en: '' },
            memorization_program_entity_type_id: 0,
            teacher_id: 0,
            period: 'morning',
            start_date: '',
            end_date: '',
            activities: [],
            weekly_holiday: [],
            evaluation_system_type: HALAQA_EVALUATION_SYSTEM_TYPES[0]?.value ?? 'رقمي',
            total_mark: undefined,
            max_students: undefined,
            session_time: '',
            meeting_link: '',
            platform_id: undefined,
            teaching_method: 'in_person'
        }
    });

    const teachingMethod = useWatch({ control, name: 'teaching_method' });
    const evaluationSystemType = useWatch({ control, name: 'evaluation_system_type' });
    const teacherId = useWatch({ control, name: 'teacher_id' });
    const memorizationProgramEntityTypeId = useWatch({ control, name: 'memorization_program_entity_type_id' });
    const startDate = useWatch({ control, name: 'start_date' });
    const endDate = useWatch({ control, name: 'end_date' });
    const weeklyHoliday = useWatch({ control, name: 'weekly_holiday' });
    const period = useWatch({ control, name: 'period' });
    const sessionTime = useWatch({ control, name: 'session_time' });
    const activities = useWatch({ control, name: 'activities' });
    const availabilityParams = useMemo(() => {
        if (!startDate || !endDate || !period || !sessionTime) {
            return null;
        }

        return {
            start_date: normalizeDate(startDate),
            end_date: normalizeDate(endDate),
            period,
            session_time: normalizeSessionTime(sessionTime)
        };
    }, [endDate, period, sessionTime, startDate]);
    const canLoadAvailablePeople = Boolean(availabilityParams);

    const {
        teachersOptions,
        teachersList,
        studentsList,
        platformsOptions,
        currentEntity,
        autoIncludeActivities,
        totalMark,
        editableEvaluationSystem,
        maxStudentsPerHalaqa,
        editableMaxStudents,
        weeklyHoliday: configuredWeeklyHoliday,
        editableWeeklyHoliday,
        isLoadingTeachers,
        isLoadingPlatforms
    } = useCreateHalaqaFormQueries({
        includeStudents: true,
        useAvailability: true,
        availabilityParams
    });
    const [step, setStep] = useState(1);
    const [createdHalaqaId, setCreatedHalaqaId] = useState(null);
    const [createdHalaqaContext, setCreatedHalaqaContext] = useState(null);
    const [createdActivities, setCreatedActivities] = useState([]);
    const [pendingHalaqaPayload, setPendingHalaqaPayload] = useState(null);
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);
    const [studentSearch, setStudentSearch] = useState('');
    const [planWizardStep, setPlanWizardStep] = useState(3);
    const manualActivitiesRef = useRef([]);

    const derivedEntityTypeId = useMemo(() => getPreferredEntityTypeId(
        currentEntity?.memorization_program_entity_type?.id,
        currentEntity?.memorization_program_entity_type_id,
        entity?.memorization_program_entity_type?.id,
        entity?.memorization_program_entity_type_id
    ), [currentEntity, entity]);

    const entityTypeOptions = useMemo(() => {
        const currentEntityType = currentEntity?.memorization_program_entity_type;

        if (!currentEntityType?.id) {
            return [];
        }

        return [{
            id: currentEntityType.id,
            value: Number(currentEntityType.id),
            name: currentEntityType.name,
            label: getEntityTypeDisplayName(currentEntityType.name, isArabic)
        }];
    }, [currentEntity, isArabic]);

    const periodOptions = useMemo(() => HALAQA_PERIODS.map((item) => ({
        value: item.value,
        label: t(item.labelKey, item.value)
    })), [t]);

    const activityOptions = useMemo(() => HALAQA_ACTIVITIES.map((item) => ({
        value: item.value,
        label: t(item.labelKey, item.value)
    })), [t]);

    const teachingMethodOptions = useMemo(() => HALAQA_TEACHING_METHODS.map((item) => ({
        value: item.value,
        label: t(item.labelKey, item.value)
    })), [t]);

    const weeklyHolidayOptions = useMemo(() => HALAQA_WEEKLY_HOLIDAYS.map((item) => ({
        value: item.value,
        label: t(item.labelKey, item.label)
    })), [t]);

    const evaluationSystemOptions = useMemo(() => HALAQA_EVALUATION_SYSTEM_TYPES.map((item) => ({
        value: item.value,
        label: t(item.labelKey, item.label)
    })), [t]);

    const numericEvaluationValue = evaluationSystemOptions[0]?.value ?? HALAQA_EVALUATION_SYSTEM_TYPES[0]?.value ?? 'رقمي';
    const autoIncludedHifzActivities = useMemo(
        () => (Array.isArray(autoIncludeActivities) ? autoIncludeActivities : []),
        [autoIncludeActivities]
    );

    const durationInDays = useMemo(
        () => getDurationInDays(startDate, endDate, weeklyHoliday),
        [endDate, startDate, weeklyHoliday]
    );
    const durationLabel = durationInDays == null
        ? ''
        : `${durationInDays} ${copy('يوم', 'days')}`;

    const showPlatformField = teachingMethod && teachingMethod !== 'in_person';

    useEffect(() => {
        if (!memorizationProgramEntityTypeId && derivedEntityTypeId) {
            setValue('memorization_program_entity_type_id', derivedEntityTypeId, {
                shouldValidate: true,
                shouldDirty: false
            });
        }
    }, [derivedEntityTypeId, memorizationProgramEntityTypeId, setValue]);

    useEffect(() => {
        if (teachingMethod === 'in_person') {
            setValue('platform_id', undefined);
            setValue('meeting_link', '');
        }
    }, [setValue, teachingMethod]);

    useEffect(() => {
        if (evaluationSystemType !== numericEvaluationValue) {
            setValue('total_mark', undefined);
        }
    }, [evaluationSystemType, numericEvaluationValue, setValue]);

    useEffect(() => {
        if (evaluationSystemType === numericEvaluationValue && totalMark != null) {
            setValue('total_mark', totalMark, {
                shouldValidate: true,
                shouldDirty: false
            });
        }
    }, [evaluationSystemType, numericEvaluationValue, setValue, totalMark]);

    useEffect(() => {
        if (maxStudentsPerHalaqa != null) {
            setValue('max_students', maxStudentsPerHalaqa, {
                shouldValidate: true,
                shouldDirty: false
            });
        }
    }, [maxStudentsPerHalaqa, setValue]);

    useEffect(() => {
        if (Array.isArray(configuredWeeklyHoliday) && configuredWeeklyHoliday.length > 0) {
            const allowedValues = new Set(weeklyHolidayOptions.map((option) => option.value));
            const normalizedWeeklyHoliday = configuredWeeklyHoliday.filter((value) => allowedValues.has(value));

            setValue('weekly_holiday', normalizedWeeklyHoliday, {
                shouldValidate: true,
                shouldDirty: false
            });
        }
    }, [configuredWeeklyHoliday, setValue, weeklyHolidayOptions]);

    const deriveActivitiesFromManual = useCallback((manualActivities) => {
        const normalizedActivities = Array.isArray(manualActivities)
            ? Array.from(new Set(manualActivities))
            : [];
        const hasHifz = normalizedActivities.includes(HALAQA_ACTIVITIES[0].value);

        if (!hasHifz || autoIncludedHifzActivities.length === 0) {
            return normalizedActivities;
        }

        const toAdd = autoIncludedHifzActivities.filter((activity) => !normalizedActivities.includes(activity));
        return toAdd.length > 0 ? [...normalizedActivities, ...toAdd] : normalizedActivities;
    }, [autoIncludedHifzActivities]);

    useEffect(() => {
        if (!Array.isArray(activities)) {
            manualActivitiesRef.current = [];
            return;
        }

        const hasHifz = activities.includes(HALAQA_ACTIVITIES[0].value);
        const inferredManualActivities = hasHifz
            ? activities.filter((activity) => activity === HALAQA_ACTIVITIES[0].value || !autoIncludedHifzActivities.includes(activity))
            : activities;

        manualActivitiesRef.current = inferredManualActivities;
        const syncedActivities = deriveActivitiesFromManual(inferredManualActivities);
        const hasChanged = syncedActivities.length !== activities.length ||
            syncedActivities.some((activity, index) => activity !== activities[index]);

        if (hasChanged) {
            setValue('activities', syncedActivities, {
                shouldValidate: true,
                shouldDirty: true
            });
        }
    }, [activities, autoIncludedHifzActivities, deriveActivitiesFromManual, setValue]);

    const isAvailable = useMemo(
        () => canLoadAvailablePeople && Number(teacherId) > 0,
        [canLoadAvailablePeople, teacherId]
    );

    const getErrorMessage = useCallback((message) => {
        if (!message) {
            return undefined;
        }

        if (message === 'halaqa.validation.memorizationProgramEntityTypeRequired') {
            return copy('اختر نوع الحلقة', 'Select a halaqa type');
        }

        return t(message, message);
    }, [copy, t]);

    const handleActivitiesChange = useCallback((selectedValues, field, toggledValue, alreadySelected) => {
        const normalizedManualActivities = Array.isArray(manualActivitiesRef.current)
            ? [...manualActivitiesRef.current]
            : [];
        const nextManualActivities = alreadySelected
            ? normalizedManualActivities.filter((activity) => activity !== toggledValue)
            : normalizedManualActivities.includes(toggledValue)
                ? normalizedManualActivities
                : [...normalizedManualActivities, toggledValue];

        manualActivitiesRef.current = nextManualActivities;
        field.onChange(deriveActivitiesFromManual(nextManualActivities));
    }, [deriveActivitiesFromManual]);

    const buildStudentAssignmentPayload = (halaqaSource) => ({
        name: halaqaSource.name,
        teacher_id: halaqaSource.teacher?.id || halaqaSource.teacher_id,
        period: halaqaSource.period,
        start_date: normalizeDate(halaqaSource.start_date ?? halaqaSource.date?.from),
        end_date: normalizeDate(halaqaSource.end_date ?? halaqaSource.date?.to),
        activities: Array.isArray(halaqaSource.activities) && halaqaSource.activities.length > 0
            ? halaqaSource.activities
            : createdActivities,
        student_ids: selectedStudentIds
    });

    const onSubmit = (formData) => {
        const resolvedEntityTypeId = getPreferredEntityTypeId(
            formData.memorization_program_entity_type_id,
            derivedEntityTypeId
        );
        const sessionModeId = entity?.session_mode?.id;

        if (!resolvedEntityTypeId) {
            toast.error(t('halaqa.entityTypeMissing', copy('تعذر تحديد نوع الحلقة لهذا الكيان.', 'Unable to determine the halaqa type for this entity.')));
            return;
        }

        const {
            platform_id,
            meeting_link,
            weekly_holiday,
            total_mark,
            memorization_program_entity_type_id: _memorizationProgramEntityTypeId,
            ...restData
        } = formData;

        const payload = {
            ...restData,
            start_date: normalizeDate(formData.start_date),
            end_date: normalizeDate(formData.end_date),
            session_time: normalizeSessionTime(formData.session_time),
            memorization_program_entity_type_id: resolvedEntityTypeId,
            ...(sessionModeId != null ? { session_mode_id: sessionModeId } : {}),
            ...(Array.isArray(weekly_holiday) && weekly_holiday.length > 0 ? { weekly_holiday: weekly_holiday.join(',') } : {}),
            ...(formData.evaluation_system_type === numericEvaluationValue && typeof total_mark === 'number'
                ? { total_mark }
                : {}),
            ...(formData.teaching_method !== 'in_person' && meeting_link ? { platform_link: meeting_link } : {}),
            ...(formData.teaching_method !== 'in_person' && platform_id ? { platform_id } : {})
        };

        setPendingHalaqaPayload(payload);
        setCreatedHalaqaContext({
            name: payload.name,
            teacher_id: payload.teacher_id,
            period: payload.period,
            start_date: payload.start_date,
            end_date: payload.end_date,
            activities: Array.isArray(payload.activities) ? payload.activities : []
        });
        setCreatedActivities(Array.isArray(formData.activities) ? formData.activities : []);
        setStep(2);

        /* createHalaqaMutation.mutate(payload, {
            onSuccess: (response) => {
                toast.success(t('halaqa.createSuccess', copy('تم إنشاء الحلقة بنجاح', 'Halaqa created successfully')));
                queryClient.invalidateQueries({ queryKey: ['halaqas'] });

                const responseData = response?.data?.data ?? response?.data ?? response;
                const createdId = responseData?.id != null ? Number(responseData.id) : null;

                if (createdId != null) {
                    setCreatedHalaqaId(createdId);
                    const createdContext = {
                        name: payload.name,
                        teacher_id: payload.teacher_id,
                        period: payload.period,
                        start_date: payload.start_date,
                        end_date: payload.end_date,
                        activities: Array.isArray(payload.activities) ? payload.activities : []
                    };
                    setCreatedHalaqaContext(createdContext);
                    setCreatedActivities(Array.isArray(formData.activities) ? formData.activities : []);
                    setStep(2);
                    return;
                }

                navigate(`/${lang || 'ar'}/halaqas`);
            },
            onError: (error) => {
                toast.error(error?.message || t('halaqa.createError', copy('حدث خطأ أثناء إنشاء الحلقة. حاول مرة أخرى.', 'Error creating halaqa. Please try again.')));
            }
        }); */
    };

    const { data: createdHalaqaData } = useHalaqa(createdHalaqaId ?? '');
    const createdHalaqa = (() => {
        const raw = createdHalaqaData?.data;
        return raw && typeof raw === 'object' && 'data' in raw ? raw.data : raw;
    })();
    const createdHalaqaStudents = useMemo(
        () => (Array.isArray(createdHalaqa?.students) ? createdHalaqa.students : []),
        [createdHalaqa?.students]
    );

    const getLocalizedName = useCallback((value) => {
        if (typeof value === 'string') {
            return value;
        }

        if (value && typeof value === 'object') {
            return (isArabic ? value.ar : value.en) ?? value.ar ?? value.en ?? '';
        }

        return '';
    }, [isArabic]);

    const normalizedStudentOptions = useMemo(() => (
        (studentsList ?? []).map((student) => {
            const linkedHalaqa = student?.current_halaqa ?? student?.active_halaqa ?? student?.halaqa ?? student?.memorization_halaqa ?? null;
            const linkedHalaqaName = getLocalizedName(linkedHalaqa?.name);
            const unavailable = Boolean(student?.is_available === false || student?.available === false);

            return {
                ...student,
                id: Number(student.id),
                label: getLocalizedName(student.name) || student.email || `${copy('طالب', 'Student')} #${student.id}`,
                unavailable,
                linkedHalaqaName
            };
        })
    ), [copy, getLocalizedName, studentsList]);

    useEffect(() => {
        if (!canLoadAvailablePeople) {
            if (Number(teacherId) !== 0) {
                setValue('teacher_id', 0, { shouldValidate: true, shouldDirty: true });
            }
            setSelectedStudentIds((previous) => (previous.length > 0 ? [] : previous));
            return;
        }

        const availableTeacherIds = new Set((teachersList ?? []).map((teacher) => Number(teacher?.id)).filter(Boolean));
        if (teacherId && !availableTeacherIds.has(Number(teacherId))) {
            setValue('teacher_id', 0, { shouldValidate: true, shouldDirty: true });
        }

        const availableStudentIds = new Set(
            normalizedStudentOptions
                .filter((student) => !student.unavailable)
                .map((student) => Number(student.id))
                .filter(Boolean)
        );
        setSelectedStudentIds((previous) => {
            const nextValues = previous.filter((studentId) => availableStudentIds.has(Number(studentId)));
            return arePrimitiveArraysEqual(previous, nextValues) ? previous : nextValues;
        });
    }, [canLoadAvailablePeople, normalizedStudentOptions, setValue, teacherId, teachersList]);

    useEffect(() => {
        if (createdHalaqaStudents.length > 0) {
            const nextValues = createdHalaqaStudents.map((student) => Number(student.id)).filter(Boolean);
            setSelectedStudentIds((previous) => (
                arePrimitiveArraysEqual(previous, nextValues) ? previous : nextValues
            ));
        }
    }, [createdHalaqaStudents]);

    const filteredStudentOptions = useMemo(() => {
        const searchValue = studentSearch.trim().toLowerCase();
        if (!searchValue) {
            return normalizedStudentOptions;
        }

        return normalizedStudentOptions.filter((student) => {
            const haystacks = [
                student.label,
                student.email,
                student.phone,
                student.linkedHalaqaName
            ]
                .filter(Boolean)
                .map((value) => String(value).toLowerCase());

            return haystacks.some((value) => value.includes(searchValue));
        });
    }, [normalizedStudentOptions, studentSearch]);

    const availableStudents = useMemo(
        () => filteredStudentOptions.filter((student) => !student.unavailable),
        [filteredStudentOptions]
    );

    const unavailableStudents = useMemo(
        () => filteredStudentOptions.filter((student) => student.unavailable),
        [filteredStudentOptions]
    );

    const selectedStudentsCount = selectedStudentIds.length;
    const assignedStudentsForPlanning = useMemo(() => {
        if (createdHalaqaStudents.length > 0) {
            return createdHalaqaStudents;
        }

        return normalizedStudentOptions.filter((student) => selectedStudentIds.includes(student.id));
    }, [createdHalaqaStudents, normalizedStudentOptions, selectedStudentIds]);

    const handleGoToHalaqa = () => {
        if (createdHalaqaId != null) {
            navigate(`/${lang || 'ar'}/halaqas/${createdHalaqaId}`);
            return;
        }

        navigate(`/${lang || 'ar'}/halaqas`);
    };

    const handleStudentToggle = (studentId) => {
        setSelectedStudentIds((previous) => (
            previous.includes(studentId)
                ? previous.filter((value) => value !== studentId)
                : [...previous, studentId]
        ));
    };

    const handleAssignStudents = () => {
        if (createdHalaqaId == null) {
            if (!pendingHalaqaPayload || !createdHalaqaContext) {
                toast.error(copy('تعذر تجهيز بيانات الحلقة. حاول مرة أخرى.', 'Unable to prepare halaqa data. Please try again.'));
                return;
            }

            if (selectedStudentIds.length === 0) {
                toast.error(copy('اختر طالباً واحداً على الأقل', 'Select at least one student'));
                return;
            }

            createHalaqaMutation.mutate(pendingHalaqaPayload, {
                onSuccess: (response) => {
                    toast.success(t('halaqa.createSuccess', copy('تم إنشاء الحلقة بنجاح', 'Halaqa created successfully')));
                    queryClient.invalidateQueries({ queryKey: ['halaqas'] });

                    const responseData = response?.data?.data ?? response?.data ?? response;
                    const createdId = responseData?.id != null ? Number(responseData.id) : null;

                    if (createdId == null) {
                        navigate(`/${lang || 'ar'}/halaqas`);
                        return;
                    }

                    setCreatedHalaqaId(createdId);
                    updateHalaqaMutation.mutate({ id: createdId, data: buildStudentAssignmentPayload(createdHalaqaContext) }, {
                        onSuccess: () => {
                            queryClient.invalidateQueries({ queryKey: ['halaqa', createdId] });
                            toast.success(copy('تمت إضافة الطلاب إلى الحلقة', 'Students were added to the halaqa'));
                            setPlanWizardStep(3);
                            setStep(3);
                        },
                        onError: (assignError) => {
                            toast.error(assignError?.message || copy('تعذر إضافة الطلاب إلى الحلقة. حاول مرة أخرى.', 'Unable to add students to the halaqa. Please try again.'));
                        }
                    });
                },
                onError: (error) => {
                    toast.error(error?.message || t('halaqa.createError', copy('حدث خطأ أثناء إنشاء الحلقة. حاول مرة أخرى.', 'Error creating halaqa. Please try again.')));
                }
            });
            return;
        }

        const halaqaUpdateSource = createdHalaqa ?? createdHalaqaContext;

        if (!halaqaUpdateSource) {
            toast.error(copy('تعذر تجهيز بيانات الحلقة. حاول مرة أخرى.', 'Unable to prepare halaqa data. Please try again.'));
            return;
        }

        if (selectedStudentIds.length === 0) {
            toast.error(copy('اختر طالباً واحداً على الأقل', 'Select at least one student'));
            return;
        }

        updateHalaqaMutation.mutate({ id: createdHalaqaId, data: buildStudentAssignmentPayload(halaqaUpdateSource) }, {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['halaqa', createdHalaqaId] });
                toast.success(copy('تمت إضافة الطلاب إلى الحلقة', 'Students were added to the halaqa'));
                setPlanWizardStep(3);
                setStep(3);
            },
            onError: (error) => {
                toast.error(error?.message || copy('تعذر إضافة الطلاب إلى الحلقة. حاول مرة أخرى.', 'Unable to add students to the halaqa. Please try again.'));
            }
        });
    };

    if (step === 2) {
        return (
            <div className="overflow-hidden rounded-[32px] border border-slate-200/70 bg-white shadow-[0_32px_90px_-48px_rgba(15,23,42,0.45)]">
                <StepHeader
                    currentStep={2}
                    stepLabel={copy('الخطوة 2 من 5', 'Step 2 of 5')}
                    title={copy('اختر الطلاب', 'Choose Students')}
                    subtitle={copy('اختر الطلاب الذين تريد إضافتهم إلى الحلقة قبل الانتقال إلى بناء الخطة.', 'Choose the students you want to add to the halaqa before moving to plan building.')}
                    onBack={createdHalaqaId == null ? () => setStep(1) : (typeof onBack === 'function' ? onBack : handleGoToHalaqa)}
                    isArabic={isArabic}
                />
                <div className="space-y-6 bg-[#f8fafc] px-4 py-6 md:px-8 md:py-8">
                    <div className={`rounded-[24px] p-4 text-sm font-medium ${createdHalaqaId != null
                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border border-slate-200 bg-white text-slate-700'
                        }`}>
                        {createdHalaqaId != null
                            ? t('halaqa.createSuccess', copy('تم إنشاء الحلقة بنجاح', 'Halaqa created successfully'))
                            : copy('اختر الطلاب ثم أكمل لإنشاء الحلقة والانتقال إلى بناء الخطة.', 'Choose students, then continue to create the halaqa and move to plan building.')}
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.5)] md:p-6">
                        <SearchField
                            value={studentSearch}
                            onChange={(event) => setStudentSearch(event.target.value)}
                            placeholder={copy('ابحث عن اسم الطالب...', 'Search student name...')}
                        />

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                            <div className="inline-flex items-center gap-2 rounded-full bg-[#e7f5f3] px-3 py-1.5 font-medium text-[#0d7a78]">
                                <UsersIcon width={16} height={16} />
                                <span>{copy(`المكان المتاح بالحَلْقة ${createdHalaqa?.max_students ?? ''} طالب`, `${createdHalaqa?.max_students ?? ''} student slots`)}</span>
                            </div>
                            <span className="font-semibold text-slate-600">
                                {copy(`تم اختيار ${selectedStudentsCount} طالب`, `${selectedStudentsCount} students selected`)}
                            </span>
                        </div>

                        <div className="mt-5 space-y-3">
                            {availableStudents.map((student) => (
                                <StudentSelectionCard
                                    key={student.id}
                                    student={student}
                                    selected={selectedStudentIds.includes(student.id)}
                                    subtitle={copy('متاح في هذا الوقت', 'Available right now')}
                                    onToggle={() => handleStudentToggle(student.id)}
                                />
                            ))}
                        </div>

                        {unavailableStudents.length > 0 ? (
                            <div className="mt-6 border-t border-slate-200 pt-5">
                                <p className="mb-3 text-sm font-semibold text-slate-500">
                                    {copy('غير متاحين حالياً', 'Currently unavailable')}
                                </p>
                                <div className="space-y-3">
                                    {unavailableStudents.map((student) => (
                                        <StudentSelectionCard
                                            key={student.id}
                                            student={student}
                                            disabled
                                            selected={false}
                                            subtitle={student.linkedHalaqaName
                                                ? copy(`مسجل في ${student.linkedHalaqaName}`, `Assigned to ${student.linkedHalaqaName}`)
                                                : copy('مسجل في حلقة أخرى', 'Assigned to another halaqa')}
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <Button
                        type="button"
                        variant="primary"
                        onClick={handleAssignStudents}
                        loading={updateHalaqaMutation.isPending}
                        disabled={updateHalaqaMutation.isPending || selectedStudentsCount === 0}
                        className="w-full justify-between rounded-[20px] bg-[#0d7a78] px-6 py-4 text-base font-semibold hover:bg-[#0b6664]"
                    >
                        <span>{copy('بناء خطة', 'Build Plan')}</span>
                        <ChevronRightIcon width={18} height={18} className={isArabic ? 'rotate-180' : ''} />
                    </Button>
                </div>
            </div>
        );
    }

    if (step === 3 && createdHalaqaId != null) {
        return (
            <div className="overflow-hidden rounded-[32px] border border-slate-200/70 bg-white shadow-[0_32px_90px_-48px_rgba(15,23,42,0.45)]">
                <StepHeader
                    currentStep={planWizardStep}
                    stepLabel={copy(`الخطوة ${planWizardStep} من 5`, `Step ${planWizardStep} of 5`)}
                    title={copy('بناء الخطة', 'Build the Plan')}
                    subtitle={copy('أكمل اختيار الطلاب ومسار النشاط ثم راجع الخطة قبل اعتمادها النهائي.', 'Finish selecting students and activity direction, then review the plan before final approval.')}
                    onBack={handleGoToHalaqa}
                    isArabic={isArabic}
                />
                <div className="space-y-6 bg-[#f8fafc] px-4 py-6 md:px-8 md:py-8">
                    <CreatePlanForm
                        halaqaId={createdHalaqaId}
                        students={assignedStudentsForPlanning}
                        activities={createdActivities.length > 0 ? createdActivities : undefined}
                        onSuccess={() => {
                            queryClient.invalidateQueries({ queryKey: ['halaqa', createdHalaqaId] });
                            handleGoToHalaqa();
                        }}
                        onCancel={handleGoToHalaqa}
                        wizardMode
                        onWizardStepChange={setPlanWizardStep}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl overflow-hidden rounded-[32px] border border-slate-200/70 bg-white shadow-[0_32px_90px_-48px_rgba(15,23,42,0.45)]">
            <StepHeader
                currentStep={1}
                stepLabel={copy('الخطوة 1 من 5', 'Step 1 of 5')}
                title={copy('إنشاء حلقة جديدة', 'Create a New Halaqa')}
                subtitle={copy('ابدأ بإدخال بيانات الحلقة الأساسية والمنهج والجدول قبل متابعة بقية الخطوات.', 'Start with the core halaqa details, curriculum, and schedule before moving to the next steps.')}
                onBack={typeof onBack === 'function' ? onBack : () => navigate(`/${lang || 'ar'}/halaqas`)}
                isArabic={isArabic}
            />

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-[#f8fafc] px-4 py-6 md:px-8 md:py-8">
                <div className="space-y-5">
                    <SectionCard icon={UsersIcon} title={copy('البيانات الأساسية', 'Basic Details')}>
                        <div className="grid grid-cols-1 gap-4">
                            <FormInput
                                name="name.en"
                                control={control}
                                label={t('halaqa.nameEn', copy('الاسم (بالإنجليزية)', 'Name (English)'))}
                                required
                                error={getErrorMessage(errors.name?.en?.message)}
                                className={FIELD_INPUT_CLASS}
                            />
                            <FormInput
                                name="name.ar"
                                control={control}
                                label={t('halaqa.nameAr', copy('الاسم (بالعربية)', 'Name (Arabic)'))}
                                required
                                error={getErrorMessage(errors.name?.ar?.message)}
                                className={FIELD_INPUT_CLASS}
                            />
                        </div>

                        <SingleSelectPillsField
                            name="memorization_program_entity_type_id"
                            control={control}
                            label={copy('نوع الحلقة', 'Halaqa Type')}
                            required
                            options={entityTypeOptions}
                            error={getErrorMessage(errors.memorization_program_entity_type_id?.message)}
                        />

                        <FormInput
                            name="max_students"
                            control={control}
                            label={t('halaqa.maxStudents', copy('الحد الأقصى للطلاب بالحَلْقة', 'Maximum Students'))}
                            required
                            type="number"
                            error={getErrorMessage(errors.max_students?.message)}
                            disabled={!editableMaxStudents}
                            className={FIELD_INPUT_CLASS}
                        />
                    </SectionCard>

                    <SectionCard icon={BookOpenIcon} title={copy('المنهج والأنشطة', 'Curriculum & Activities')}>
                        <MultiChipField
                            name="activities"
                            control={control}
                            label={copy('أنشطة الحلقة', 'Halaqa Activities')}
                            required
                            options={activityOptions}
                            error={getErrorMessage(errors.activities?.message)}
                            helperText={Array.isArray(activities) && activities.includes('hifz') && autoIncludedHifzActivities.length > 0
                                ? t('halaqa.hifzRequiresTasbit', copy('عند اختيار الحفظ سيتم تضمين التثبيت تلقائياً.', 'Selecting Hifz will automatically include Tasbit.'))
                                : undefined}
                            onToggleOption={handleActivitiesChange}
                        />

                        <SingleSelectPillsField
                            name="evaluation_system_type"
                            control={control}
                            label={t('halaqa.evaluationSystemType', copy('نظام التقييم', 'Evaluation System'))}
                            required
                            options={evaluationSystemOptions}
                            error={getErrorMessage(errors.evaluation_system_type?.message)}
                            disabled={!editableEvaluationSystem}
                        />

                        {evaluationSystemType === numericEvaluationValue ? (
                            <FormInput
                                name="total_mark"
                                control={control}
                                label={t('halaqa.customTotalMark', copy('الدرجة الكلية المخصصة', 'Custom Total Mark'))}
                                required
                                type="number"
                                error={getErrorMessage(errors.total_mark?.message)}
                                className={FIELD_INPUT_CLASS}
                            />
                        ) : null}
                    </SectionCard>

                    <SectionCard icon={CalendarIcon} title={copy('زمان ومكان الحلقة', 'Halaqa Schedule & Place')}>
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <SingleSelectPillsField
                                name="period"
                                control={control}
                                label={t('halaqa.period', copy('الفترة', 'Period'))}
                                required
                                options={periodOptions}
                                error={getErrorMessage(errors.period?.message)}
                            />

                            <SingleSelectPillsField
                                name="teaching_method"
                                control={control}
                                label={t('halaqa.teachingMethod', copy('طريقة عقد الحلقة', 'Teaching Method'))}
                                required
                                options={teachingMethodOptions}
                                error={getErrorMessage(errors.teaching_method?.message)}
                            />
                        </div>

                        {showPlatformField ? (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <SelectRFH
                                    name="platform_id"
                                    control={control}
                                    label={t('halaqa.platform', copy('المنصة', 'Platform'))}
                                    required
                                    options={platformsOptions}
                                    loading={isLoadingPlatforms}
                                    error={getErrorMessage(errors.platform_id?.message)}
                                    placeholder={t('halaqa.selectPlatform', copy('اختر منصة', 'Select a platform'))}
                                    classes={SELECT_FIELD_CLASSES}
                                />
                                <FormInput
                                    name="meeting_link"
                                    control={control}
                                    label={copy('رابط الاجتماع', 'Meeting Link')}
                                    required
                                    type="url"
                                    error={getErrorMessage(errors.meeting_link?.message)}
                                    className={FIELD_INPUT_CLASS}
                                    placeholder="https://..."
                                />
                            </div>
                        ) : null}

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <FormInput
                                name="start_date"
                                control={control}
                                label={t('halaqa.startDate', copy('تاريخ البدء', 'Start Date'))}
                                required
                                type="date"
                                error={getErrorMessage(errors.start_date?.message)}
                                className={FIELD_INPUT_CLASS}
                            />
                            <div>
                                <FormInput
                                    name="end_date"
                                    control={control}
                                    label={t('halaqa.endDate', copy('تاريخ الانتهاء', 'End Date'))}
                                    required
                                    type="date"
                                    error={getErrorMessage(errors.end_date?.message)}
                                    className={FIELD_INPUT_CLASS}
                                />
                            </div>
                            <div className="md:col-span-2">

                                <label className="mb-1 block text-sm font-medium text-slate-700">{copy('مدة الدورة', 'Course Duration')}</label>
                                <div className={`flex min-h-[52px] items-center rounded-[16px] border border-slate-200 bg-slate-50 px-4 text-sm ${durationLabel ? 'text-slate-800' : 'text-slate-400'}`}>
                                    {durationLabel || copy('سيتم احتسابها تلقائياً', 'Calculated automatically')}
                                </div>
                            </div>
                        </div>

                        <TimeRangeField
                            control={control}
                            error={getErrorMessage(errors.session_time?.message)}
                            label={t('halaqa.sessionTime', copy('وقت الجلسة', 'Session Time'))}
                            startLabel={t('halaqa.sessionStartTime', copy('وقت البداية', 'Start Time'))}
                            endLabel={t('halaqa.sessionEndTime', copy('وقت النهاية', 'End Time'))}
                        />

                        <MultiChipField
                            name="weekly_holiday"
                            control={control}
                            label={t('halaqa.weeklyHoliday', copy('العطلة الأسبوعية', 'Weekly Holidays'))}
                            options={weeklyHolidayOptions}
                            error={getErrorMessage(errors.weekly_holiday?.message)}
                            disabled={!editableWeeklyHoliday}
                        />
                    </SectionCard>

                    <SectionCard icon={TeacherIcon} title={copy('اختر معلم الحلقة', 'Choose the Halaqa Teacher')}>
                        <SelectRFH
                            name="teacher_id"
                            control={control}
                            label={t('halaqa.teacher', copy('المعلم', 'Teacher'))}
                            required
                            options={teachersOptions}
                            loading={isLoadingTeachers}
                            disabled={!canLoadAvailablePeople}
                            error={getErrorMessage(errors.teacher_id?.message)}
                            placeholder={canLoadAvailablePeople
                                ? t('halaqa.selectTeacher', copy('اختر معلماً', 'Select a teacher'))
                                : t('halaqa.completeScheduleFirst', copy('أكمل التواريخ والفترة ووقت الجلسة أولاً', 'Complete dates, period, and session time first'))}
                            classes={SELECT_FIELD_CLASSES}
                        />
                    </SectionCard>

                    {/* <AvailabilityPanel
                        title={t('halaqa.checkAvailability', copy('التحقق من الإتاحة', 'Check Availability'))}
                        description={t('halaqa.checkAvailabilityDescription', copy('تحقق من توفر المعلم قبل إنشاء الحلقة.', 'Verify the teacher availability before creating the halaqa.'))}
                        buttonLabel={t('halaqa.checkAvailability', copy('التحقق من الإتاحة', 'Check Availability'))}
                        checkingLabel={t('halaqa.checking', copy('جارٍ التحقق...', 'Checking...'))}
                        isChecking={checkAvailabilityMutation.isPending}
                        canCheckAvailability={canCheckAvailability}
                        onCheckAvailability={handleCheckAvailability}
                        hasRequestError={Boolean(checkAvailabilityMutation.error)}
                        requestErrorText={t('halaqa.availabilityCheckError', copy('تعذر التحقق من الإتاحة. حاول مرة أخرى.', 'Unable to check availability. Please try again.'))}
                        availabilityResult={availabilityResult}
                        isAvailable={isAvailable}
                        hasConflict={hasConflict}
                        hasConflictsData={hasConflictsData}
                        generatedScheduleTitle={t('halaqa.generatedSchedule', copy('الجدول المُنشأ', 'Generated Schedule'))}
                        conflictsTitle={t('halaqa.conflicts', copy('تعارضات مكتشفة', 'Conflicts Detected'))}
                        conflictsUnknownText={t('halaqa.conflictsUnknown', copy('تم اكتشاف تعارض ولكن التفاصيل غير متاحة حالياً.', 'Conflicts were detected but details are not available.'))}
                        teacherLabel={t('halaqa.teacher', copy('المعلم', 'Teacher'))}
                        checkingAvailabilityText={t('halaqa.checkingAvailability', copy('جارٍ التحقق من الإتاحة...', 'Checking availability...'))}
                        availableText={t('halaqa.available', copy('متاح', 'Available'))}
                        notAvailableText={t('halaqa.notAvailable', copy('غير متاح', 'Not Available'))}
                    /> */}

                </div>

                {createHalaqaMutation.error ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {createHalaqaMutation.error.message || t('halaqa.createError', copy('حدث خطأ أثناء إنشاء الحلقة. حاول مرة أخرى.', 'Error creating halaqa. Please try again.'))}
                    </div>
                ) : null}

                <Button
                    type="submit"
                    variant="primary"
                    loading={createHalaqaMutation.isPending || updateHalaqaMutation.isPending}
                    disabled={createHalaqaMutation.isPending || updateHalaqaMutation.isPending || !isAvailable}
                    className="w-full justify-between rounded-[20px] bg-[#0d7a78] px-6 py-4 text-base font-semibold hover:bg-[#0b6664]"
                >
                    <span>{createHalaqaMutation.isPending
                        ? t('common.loading', copy('جارٍ الحفظ...', 'Saving...'))
                        : t('halaqa.create', copy('إنشاء حلقة', 'Create Halaqa'))}</span>
                    <ChevronRightIcon width={18} height={18} className={isArabic ? 'rotate-180' : ''} />
                </Button>
            </form>
        </div>
    );
};

export default CreateHalaqaForm;
