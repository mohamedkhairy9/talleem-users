import React, { useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, FormInput, SelectRFH } from '@/shared/components';
import { CalendarIcon, CheckIcon, ChevronRightIcon, TeacherIcon, UsersIcon } from '@/shared/icons';
import { getErrorMessage, normalizeDate, useFormWithValidation } from '@/shared/utils';
import { useCreateScheduledActivity, useScheduledActivityFormOptions, useUpdateScheduledActivity } from '../hooks/useScheduledActivities';
import {
    createScheduledActivitySchema,
    DEFAULT_SCHEDULED_ACTIVITY_VALUES,
    RESPONSIBLE_VALUES
} from '../schemas/scheduled-activity.schema';

const SECTION_CARD_CLASS = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm';
const FIELD_INPUT_CLASS = 'rounded-2xl border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-primary-600';
const SELECT_FIELD_CLASSES = '[&_.react-select__control]:min-h-[52px] [&_.react-select__control]:rounded-[16px] [&_.react-select__control]:border-slate-200 [&_.react-select__control]:shadow-sm [&_.react-select__control]:px-1 [&_.react-select__control--is-focused]:border-primary-600 [&_.react-select__placeholder]:text-slate-400';

function extractIdFromResponse(response) {
    const responseData = response?.data?.data ?? response?.data ?? response;
    return responseData?.id != null ? Number(responseData.id) : null;
}

function mapActivityToFormValues(activity) {
    if (!activity) {
        return DEFAULT_SCHEDULED_ACTIVITY_VALUES;
    }

    const teachers = Array.isArray(activity.teachers)
        ? activity.teachers.map((teacher) => teacher?.id).filter(Boolean)
        : Array.isArray(activity.teacher_ids)
            ? activity.teacher_ids.filter(Boolean)
            : [];

    const students = Array.isArray(activity.students)
        ? activity.students.map((student) => student?.id ?? student?.student_id).filter(Boolean)
        : Array.isArray(activity.student_ids)
            ? activity.student_ids.filter(Boolean)
            : [];

    return {
        name: activity.name ?? activity.title ?? '',
        date_from: normalizeDate(activity.date_from ?? activity.start_date ?? ''),
        date_to: normalizeDate(activity.date_to ?? activity.end_date ?? ''),
        time_from: String(activity.time_from ?? ''),
        time_to: String(activity.time_to ?? ''),
        responsible: activity.responsible ?? 'entity',
        teacher_ids: teachers,
        student_ids: students
    };
}

const SectionCard = ({ icon, title, children }) => {
    const IconComponent = icon;

    return (
        <section className={SECTION_CARD_CLASS}>
            <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e7f5f3] text-primary-600">
                    <IconComponent width={18} height={18} />
                </div>
            </div>
            <div className="space-y-5">{children}</div>
        </section>
    );
};

const ChoicePillsField = ({ control, name, label, options, error, required = false }) => (
    <Controller
        name={name}
        control={control}
        render={({ field }) => (
            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                    {label}
                    {required ? <span className="ms-1 text-rose-500">*</span> : null}
                </label>
                <div className="flex flex-wrap gap-2 rounded-[24px] bg-slate-100 p-1.5">
                    {options.map((option) => {
                        const isSelected = field.value === option.value;

                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => field.onChange(option.value)}
                                className={`inline-flex min-w-[148px] items-center justify-center gap-2 rounded-[18px] px-4 py-3 text-sm font-semibold transition ${
                                    isSelected
                                        ? 'bg-primary-600 text-white shadow-[0_14px_28px_-18px_rgba(0,66,71,0.9)]'
                                        : 'bg-transparent text-slate-600 hover:bg-white'
                                }`}
                            >
                                {isSelected ? <CheckIcon width={16} height={16} /> : null}
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

const CreateScheduledActivityForm = ({ mode = 'create', activityId = null, initialActivity = null }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { lang } = useParams();
    const isEditMode = mode === 'edit';
    const createScheduledActivityMutation = useCreateScheduledActivity();
    const updateScheduledActivityMutation = useUpdateScheduledActivity();
    const {
        teachersOptions,
        studentsOptions,
        isLoadingTeachers,
        isLoadingStudents
    } = useScheduledActivityFormOptions();

    const {
        control,
        handleSubmit,
        formState: { errors },
        reset
    } = useFormWithValidation({
        schema: createScheduledActivitySchema,
        defaultValues: DEFAULT_SCHEDULED_ACTIVITY_VALUES
    });

    useEffect(() => {
        if (!initialActivity) {
            return;
        }

        reset(mapActivityToFormValues(initialActivity));
    }, [initialActivity, reset]);

    const handleBack = () => {
        if (isEditMode && activityId) {
            navigate(`/${lang || 'ar'}/scheduled-activities/${activityId}`);
            return;
        }

        navigate(`/${lang || 'ar'}/scheduled-activities`);
    };

    const onSubmit = (formData) => {
        const payload = {
            name: formData.name?.trim() ?? '',
            date_from: normalizeDate(formData.date_from),
            date_to: normalizeDate(formData.date_to),
            time_from: formData.time_from,
            time_to: formData.time_to,
            responsible: formData.responsible,
            teacher_ids: (formData.teacher_ids || []).map(Number).filter(Boolean),
            student_ids: (formData.student_ids || []).map(Number).filter(Boolean)
        };

        if (isEditMode && activityId) {
            updateScheduledActivityMutation.mutate({ activityId, data: payload }, {
                onSuccess: () => {
                    toast.success(t('scheduledActivities.updateSuccess', 'Scheduled activity updated successfully.'));
                    navigate(`/${lang || 'ar'}/scheduled-activities/${activityId}`);
                },
                onError: (error) => {
                    toast.error(getErrorMessage(error));
                }
            });
            return;
        }

        createScheduledActivityMutation.mutate(payload, {
            onSuccess: (response) => {
                toast.success(t('scheduledActivities.createSuccess', 'Scheduled activity created successfully.'));
                const nextActivityId = extractIdFromResponse(response);

                if (nextActivityId) {
                    navigate(`/${lang || 'ar'}/scheduled-activities/${nextActivityId}`);
                    return;
                }

                reset(DEFAULT_SCHEDULED_ACTIVITY_VALUES);
                navigate(`/${lang || 'ar'}/scheduled-activities`);
            },
            onError: (error) => {
                toast.error(getErrorMessage(error));
            }
        });
    };

    const responsibleOptions = RESPONSIBLE_VALUES.map((value) => ({
        value,
        label: t(`scheduledActivities.responsibleOptions.${value === 'general_management' ? 'generalManagement' : value}`)
    }));

    const isSubmitting = createScheduledActivityMutation.isPending || updateScheduledActivityMutation.isPending;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-6">
                    <SectionCard icon={CalendarIcon} title={t('scheduledActivities.sections.schedule', 'Activity Schedule')}>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <FormInput
                                    name="name"
                                    control={control}
                                    label={t('scheduledActivities.name', 'Activity Name')}
                                    required
                                    error={errors.name?.message ? t(errors.name.message) : undefined}
                                    className={FIELD_INPUT_CLASS}
                                />
                            </div>

                            <FormInput
                                name="date_from"
                                control={control}
                                label={t('scheduledActivities.dateFrom', 'Start Date')}
                                required
                                type="date"
                                error={errors.date_from?.message ? t(errors.date_from.message) : undefined}
                                className={FIELD_INPUT_CLASS}
                            />
                            <FormInput
                                name="date_to"
                                control={control}
                                label={t('scheduledActivities.dateTo', 'End Date')}
                                required
                                type="date"
                                error={errors.date_to?.message ? t(errors.date_to.message) : undefined}
                                className={FIELD_INPUT_CLASS}
                            />
                            <FormInput
                                name="time_from"
                                control={control}
                                label={t('scheduledActivities.timeFrom', 'Start Time')}
                                required
                                type="time"
                                error={errors.time_from?.message ? t(errors.time_from.message) : undefined}
                                className={FIELD_INPUT_CLASS}
                            />
                            <FormInput
                                name="time_to"
                                control={control}
                                label={t('scheduledActivities.timeTo', 'End Time')}
                                required
                                type="time"
                                error={errors.time_to?.message ? t(errors.time_to.message) : undefined}
                                className={FIELD_INPUT_CLASS}
                            />
                        </div>
                    </SectionCard>

                    <SectionCard icon={TeacherIcon} title={t('scheduledActivities.sections.responsibility', 'Responsibility')}>
                        <ChoicePillsField
                            control={control}
                            name="responsible"
                            label={t('scheduledActivities.responsible', 'Responsible Side')}
                            options={responsibleOptions}
                            required
                            error={errors.responsible?.message ? t(errors.responsible.message) : undefined}
                        />
                    </SectionCard>

                    <SectionCard icon={TeacherIcon} title={t('scheduledActivities.sections.teachers', 'Teacher Assignment')}>
                        <SelectRFH
                            name="teacher_ids"
                            control={control}
                            label={t('scheduledActivities.teachers', 'Assigned Teachers')}
                            options={teachersOptions}
                            isMulti
                            loading={isLoadingTeachers}
                            placeholder="common.select"
                            classes={SELECT_FIELD_CLASSES}
                        />
                    </SectionCard>

                    <SectionCard icon={UsersIcon} title={t('scheduledActivities.sections.students', 'Student Coverage')}>
                        <SelectRFH
                            name="student_ids"
                            control={control}
                            label={t('scheduledActivities.students', 'Students')}
                            required
                            options={studentsOptions}
                            isMulti
                            loading={isLoadingStudents}
                            placeholder="common.select"
                            error={errors.student_ids?.message ? t(errors.student_ids.message) : undefined}
                            classes={SELECT_FIELD_CLASSES}
                        />
                    </SectionCard>
                </div>

                <div className="space-y-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="space-y-4">
                            <Button
                                type="submit"
                                variant="primary"
                                loading={isSubmitting}
                                className="w-full justify-between rounded-2xl px-5 py-3 text-base"
                            >
                                <span>{isEditMode
                                    ? t('scheduledActivities.update', 'Update Scheduled Activity')
                                    : t('scheduledActivities.create', 'Create Scheduled Activity')}</span>
                                <ChevronRightIcon width={18} height={18} className={lang === 'ar' ? 'rotate-180' : ''} />
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleBack}
                                disabled={isSubmitting}
                                className="w-full rounded-2xl px-5 py-3 text-base"
                            >
                                {t('common.back', 'Back')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default CreateScheduledActivityForm;

