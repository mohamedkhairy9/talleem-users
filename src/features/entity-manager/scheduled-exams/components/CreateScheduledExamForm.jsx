import React, { useEffect } from 'react';
import { Controller, useFieldArray, useWatch } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, FormInput, SelectRFH } from '@/shared/components';
import { CalendarIcon, CheckIcon, ChevronRightIcon, PlusIcon, TeacherIcon, TrashIcon, UsersIcon } from '@/shared/icons';
import { getErrorMessage, normalizeDate, useFormWithValidation } from '@/shared/utils';
import { useCreateScheduledExam, useScheduledExamFormOptions } from '../hooks/useScheduledExams';
import {
    createScheduledExamSchema,
    DEFAULT_SCHEDULED_EXAM_VALUES
} from '../schemas/scheduled-exam.schema';

const SECTION_CARD_CLASS = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm';
const FIELD_INPUT_CLASS = 'rounded-2xl border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-primary-600';
const SELECT_FIELD_CLASSES = '[&_.react-select__control]:min-h-[52px] [&_.react-select__control]:rounded-[16px] [&_.react-select__control]:border-slate-200 [&_.react-select__control]:shadow-sm [&_.react-select__control]:px-1 [&_.react-select__control--is-focused]:border-primary-600 [&_.react-select__placeholder]:text-slate-400';
const RESPONSIBLE_OPTIONS = ['entity', 'branch', 'general_management'];
const METHOD_OPTIONS = ['in_person', 'remote'];
const JUZ_OPTIONS = Array.from({ length: 30 }, (_, index) => index + 1);

const SectionCard = ({ icon: Icon, title, children }) => (
    <section className={SECTION_CARD_CLASS}>
        <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e7f5f3] text-primary-600">
                <Icon width={18} height={18} />
            </div>
        </div>
        <div className="space-y-5">{children}</div>
    </section>
);

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

const JuzNumbersField = ({ control, name, label, error }) => (
    <Controller
        name={name}
        control={control}
        render={({ field }) => {
            const selectedValues = Array.isArray(field.value) ? field.value : [];

            const handleToggle = (juzNumber) => {
                const isSelected = selectedValues.includes(juzNumber);
                const nextValue = isSelected
                    ? selectedValues.filter((value) => value !== juzNumber)
                    : [...selectedValues, juzNumber].sort((left, right) => left - right);

                field.onChange(nextValue);
            };

            return (
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                        {label}
                        <span className="ms-1 text-rose-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {JUZ_OPTIONS.map((juzNumber) => {
                            const isSelected = selectedValues.includes(juzNumber);

                            return (
                                <button
                                    key={juzNumber}
                                    type="button"
                                    onClick={() => handleToggle(juzNumber)}
                                    className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm font-medium transition ${
                                        isSelected
                                            ? 'border-primary-600 bg-primary-600 text-white shadow-[0_12px_24px_-18px_rgba(0,66,71,0.9)]'
                                            : 'border-slate-200 bg-white text-slate-600 hover:border-primary-600 hover:text-primary-600'
                                    }`}
                                >
                                    {juzNumber}
                                </button>
                            );
                        })}
                    </div>
                    <p className="mt-1 min-h-4 text-xs text-red-600">{error ?? ''}</p>
                </div>
            );
        }}
    />
);

const CreateScheduledExamForm = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { lang } = useParams();
    const createScheduledExamMutation = useCreateScheduledExam();
    const {
        teachersOptions,
        studentsOptions,
        platformsOptions,
        isLoadingTeachers,
        isLoadingStudents,
        isLoadingPlatforms
    } = useScheduledExamFormOptions();

    const {
        control,
        handleSubmit,
        formState: { errors },
        reset,
        setValue
    } = useFormWithValidation({
        schema: createScheduledExamSchema,
        defaultValues: DEFAULT_SCHEDULED_EXAM_VALUES
    });

    const {
        fields: studentFields,
        append,
        remove
    } = useFieldArray({
        control,
        name: 'students'
    });

    const method = useWatch({ control, name: 'method' });
    const responsible = useWatch({ control, name: 'responsible' });
    const watchedStudents = useWatch({ control, name: 'students' }) || [];

    useEffect(() => {
        if (responsible !== 'entity') {
            setValue('teacher_ids', []);
        }
    }, [responsible, setValue]);

    useEffect(() => {
        if (method !== 'remote') {
            setValue('remote_platform_id', null);
            setValue('remote_link', '');
        }
    }, [method, setValue]);

    const handleBack = () => {
        navigate(`/${lang || 'ar'}/halaqas`);
    };

    const onSubmit = (formData) => {
        const payload = {
            exam_segment_id: Number(formData.exam_segment_id),
            exam_date: normalizeDate(formData.exam_date),
            time_from: formData.time_from,
            time_to: formData.time_to,
            responsible: formData.responsible,
            method: formData.method,
            location: formData.method === 'remote'
                ? (formData.remote_link?.trim() ?? '')
                : '',
            teacher_ids: formData.responsible === 'entity'
                ? (formData.teacher_ids || []).map(Number).filter(Boolean)
                : [],
            students: (formData.students || []).map((student) => ({
                student_id: Number(student.student_id),
                juz_numbers: (student.juz_numbers || []).map(Number).sort((left, right) => left - right)
            }))
        };

        createScheduledExamMutation.mutate(payload, {
            onSuccess: () => {
                toast.success(t('scheduledExams.createSuccess', 'Scheduled exam created successfully.'));
                reset(DEFAULT_SCHEDULED_EXAM_VALUES);
            },
            onError: (error) => {
                toast.error(getErrorMessage(error));
            }
        });
    };

    const responsibleOptions = RESPONSIBLE_OPTIONS.map((value) => ({
        value,
        label: t(`scheduledExams.responsibleOptions.${value === 'general_management' ? 'generalManagement' : value}`)
    }));

    const methodOptions = METHOD_OPTIONS.map((value) => ({
        value,
        label: t(`scheduledExams.methodOptions.${value === 'in_person' ? 'inPerson' : 'remote'}`)
    }));

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <p className="font-semibold">{t('scheduledExams.segmentIdHelper', 'Use the numeric segment ID for now until the exam segments lookup API is connected.')}</p>
                <p className="mt-1 text-amber-800">{t('scheduledExams.notes.segmentApiPending', 'Assumption for now: exam segment selection is entered as a numeric ID until its lookup API is provided.')}</p>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-6">
                    <SectionCard icon={CalendarIcon} title={t('scheduledExams.sections.schedule', 'Schedule Details')}>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <FormInput
                                    name="exam_segment_id"
                                    control={control}
                                    label={t('scheduledExams.segmentId', 'Exam Segment ID')}
                                    required
                                    type="number"
                                    error={errors.exam_segment_id?.message ? t(errors.exam_segment_id.message) : undefined}
                                    className={FIELD_INPUT_CLASS}
                                />
                            </div>
                            <FormInput
                                name="exam_date"
                                control={control}
                                label={t('scheduledExams.examDate', 'Exam Date')}
                                required
                                type="date"
                                error={errors.exam_date?.message ? t(errors.exam_date.message) : undefined}
                                className={FIELD_INPUT_CLASS}
                            />
                            <div />
                            <FormInput
                                name="time_from"
                                control={control}
                                label={t('scheduledExams.timeFrom', 'Start Time')}
                                required
                                type="time"
                                error={errors.time_from?.message ? t(errors.time_from.message) : undefined}
                                className={FIELD_INPUT_CLASS}
                            />
                            <FormInput
                                name="time_to"
                                control={control}
                                label={t('scheduledExams.timeTo', 'End Time')}
                                required
                                type="time"
                                error={errors.time_to?.message ? t(errors.time_to.message) : undefined}
                                className={FIELD_INPUT_CLASS}
                            />
                        </div>
                    </SectionCard>

                    <SectionCard icon={TeacherIcon} title={t('scheduledExams.sections.responsibility', 'Responsibility & Delivery')}>
                        <ChoicePillsField
                            control={control}
                            name="responsible"
                            label={t('scheduledExams.responsible', 'Responsible Side')}
                            options={responsibleOptions}
                            required
                            error={errors.responsible?.message ? t(errors.responsible.message) : undefined}
                        />

                        <ChoicePillsField
                            control={control}
                            name="method"
                            label={t('scheduledExams.method', 'Method')}
                            options={methodOptions}
                            required
                            error={errors.method?.message ? t(errors.method.message) : undefined}
                        />

                        {method === 'remote' ? (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <SelectRFH
                                    name="remote_platform_id"
                                    control={control}
                                    label={t('scheduledExams.platform', 'Platform')}
                                    required
                                    options={platformsOptions}
                                    loading={isLoadingPlatforms}
                                    placeholder="common.select"
                                    error={errors.remote_platform_id?.message ? t(errors.remote_platform_id.message) : undefined}
                                    classes={SELECT_FIELD_CLASSES}
                                />

                                <FormInput
                                    name="remote_link"
                                    control={control}
                                    label={t('scheduledExams.remoteLink', 'Platform Link')}
                                    required
                                    type="url"
                                    placeholder={t('scheduledExams.meetingLinkPlaceholder', 'Enter the remote meeting link')}
                                    error={errors.remote_link?.message ? t(errors.remote_link.message) : undefined}
                                    className={FIELD_INPUT_CLASS}
                                />
                            </div>
                        ) : null}
                    </SectionCard>

                    <SectionCard icon={UsersIcon} title={t('scheduledExams.sections.students', 'Student Coverage')}>
                        <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">{t('scheduledExams.students', 'Students')}</p>
                                <p className="mt-1 text-sm text-slate-500">
                                    {t('scheduledExams.studentsCount', { count: watchedStudents.length, defaultValue: '{{count}} selected students' })}
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => append({ student_id: null, juz_numbers: [] })}
                                className="rounded-xl"
                            >
                                <PlusIcon width={16} height={16} className="me-2" />
                                {t('scheduledExams.addStudent', 'Add Student')}
                            </Button>
                        </div>

                        {typeof errors.students?.message === 'string' ? (
                            <p className="text-sm text-red-600">{t(errors.students.message)}</p>
                        ) : null}

                        <div className="space-y-4">
                            {studentFields.map((field, index) => {
                                const selectedStudentIds = watchedStudents
                                    .map((student, studentIndex) => (studentIndex === index ? null : Number(student?.student_id)))
                                    .filter((studentId) => Number.isInteger(studentId) && studentId > 0);

                                const studentOptions = studentsOptions.filter((option) => (
                                    !selectedStudentIds.includes(Number(option.value))
                                    || Number(option.value) === Number(watchedStudents[index]?.student_id)
                                ));

                                return (
                                    <div key={field.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                                        <div className="mb-4 flex items-center justify-between gap-3">
                                            <h3 className="text-sm font-semibold text-slate-900">
                                                {t('scheduledExams.student', 'Student')} #{index + 1}
                                            </h3>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={() => remove(index)}
                                                disabled={studentFields.length === 1}
                                                className="rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                            >
                                                <TrashIcon width={16} height={16} className="me-2" />
                                                {t('scheduledExams.removeStudent', 'Remove Student')}
                                            </Button>
                                        </div>

                                        <div className="space-y-4">
                                            <SelectRFH
                                                name={`students.${index}.student_id`}
                                                control={control}
                                                label={t('scheduledExams.student', 'Student')}
                                                required
                                                options={studentOptions}
                                                loading={isLoadingStudents}
                                                placeholder="common.select"
                                                error={errors.students?.[index]?.student_id?.message ? t(errors.students[index].student_id.message) : undefined}
                                                classes={SELECT_FIELD_CLASSES}
                                            />

                                            <JuzNumbersField
                                                control={control}
                                                name={`students.${index}.juz_numbers`}
                                                label={t('scheduledExams.juzNumbers', 'Juz Numbers')}
                                                error={errors.students?.[index]?.juz_numbers?.message ? t(errors.students[index].juz_numbers.message) : undefined}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </SectionCard>
                </div>

                <div className="space-y-6">
                    <SectionCard icon={TeacherIcon} title={t('scheduledExams.sections.teachers', 'Teacher Assignment')}>
                        <p className="text-sm text-slate-500">
                            {t('scheduledExams.teachersHelper', 'Teachers are currently enabled only when the responsible side is the entity.')}
                        </p>

                        <SelectRFH
                            name="teacher_ids"
                            control={control}
                            label={t('scheduledExams.teachers', 'Assigned Teachers')}
                            options={teachersOptions}
                            isMulti
                            loading={isLoadingTeachers}
                            disabled={responsible !== 'entity'}
                            placeholder="common.select"
                            classes={SELECT_FIELD_CLASSES}
                        />
                    </SectionCard>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="space-y-4">
                            <Button
                                type="submit"
                                variant="primary"
                                loading={createScheduledExamMutation.isPending}
                                className="w-full justify-between rounded-2xl px-5 py-3 text-base"
                            >
                                <span>{t('scheduledExams.create', 'Create Scheduled Exam')}</span>
                                <ChevronRightIcon width={18} height={18} className={lang === 'ar' ? 'rotate-180' : ''} />
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleBack}
                                disabled={createScheduledExamMutation.isPending}
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

export default CreateScheduledExamForm;
