import React, { useEffect, useMemo } from 'react';
import { Controller, useFieldArray, useWatch } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, FormInput, SelectRFH } from '@/shared/components';
import { CalendarIcon, CheckIcon, ChevronRightIcon, PlusIcon, TeacherIcon, TrashIcon, UsersIcon } from '@/shared/icons';
import { formatTimePart, getErrorMessage, normalizeDate, useFormWithValidation } from '@/shared/utils';
import { useCreateScheduledExam, useScheduledExamFormOptions, useUpdateScheduledExam } from '../hooks/useScheduledExams';
import { scheduledExamsService } from '../services/scheduled-exams.service';
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

function toOptionLikeItem(item) {
    const itemId = Number(item?.id ?? item?.teacher_id ?? item?.student_id ?? item?.value);

    if (!Number.isInteger(itemId) || itemId <= 0) {
        return null;
    }

    return {
        ...item,
        id: itemId,
        value: itemId
    };
}

function getArrayData(response) {
    if (Array.isArray(response?.data)) {
        return response.data;
    }

    if (Array.isArray(response?.data?.data)) {
        return response.data.data;
    }

    if (Array.isArray(response)) {
        return response;
    }

    return [];
}

function mapExamToFormValues(exam) {
    if (!exam) {
        return DEFAULT_SCHEDULED_EXAM_VALUES;
    }

    return {
        exam_segment_id: exam.exam_segment?.id ?? exam.exam_segment_id ?? '',
        exam_date: normalizeDate(exam.exam_date ?? ''),
        time_from: formatTimePart(exam.time_from),
        time_to: formatTimePart(exam.time_to),
        responsible: exam.responsible ?? 'entity',
        method: exam.method ?? 'in_person',
        location: exam.method === 'in_person' ? (exam.location ?? '') : '',
        remote_platform_id: exam.platform?.id ?? exam.remote_platform?.id ?? null,
        remote_link: exam.method === 'remote' ? (exam.location ?? '') : '',
        teacher_ids: Array.isArray(exam.teachers)
            ? exam.teachers.map((teacher) => teacher?.id).filter(Boolean)
            : Array.isArray(exam.teacher_ids)
                ? exam.teacher_ids.filter(Boolean)
                : [],
        students: Array.isArray(exam.students) && exam.students.length > 0
            ? exam.students.map((student) => ({
                student_id: student?.student_id ?? student?.id ?? null,
                juz_numbers: Array.isArray(student?.juz_numbers)
                    ? student.juz_numbers.map(Number).filter((value) => Number.isInteger(value))
                    : []
            }))
            : DEFAULT_SCHEDULED_EXAM_VALUES.students
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

const JuzNumbersField = ({ control, name, label, error, helperText }) => (
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
                    {helperText ? <p className="mt-2 text-xs text-slate-500">{helperText}</p> : null}
                    <p className="mt-1 min-h-4 text-xs text-red-600">{error ?? ''}</p>
                </div>
            );
        }}
    />
);

const CreateScheduledExamForm = ({ mode = 'create', examId = null, initialExam = null }) => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { lang } = useParams();
    const isArabic = (i18n.language || lang || 'ar') === 'ar';
    const copy = (arabicText, englishText) => (isArabic ? arabicText : englishText);
    const isEditMode = mode === 'edit';
    const createScheduledExamMutation = useCreateScheduledExam();
    const updateScheduledExamMutation = useUpdateScheduledExam();
    const fallbackTeachers = useMemo(() => (
        Array.isArray(initialExam?.teachers)
            ? initialExam.teachers.map(toOptionLikeItem).filter(Boolean)
            : []
    ), [initialExam]);
    const fallbackStudents = useMemo(() => (
        Array.isArray(initialExam?.students)
            ? initialExam.students.map(toOptionLikeItem).filter(Boolean)
            : []
    ), [initialExam]);

    const {
        control,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        setError,
        clearErrors
    } = useFormWithValidation({
        schema: createScheduledExamSchema,
        defaultValues: DEFAULT_SCHEDULED_EXAM_VALUES
    });

    const watchedExamDate = useWatch({ control, name: 'exam_date' });
    const watchedTimeFrom = useWatch({ control, name: 'time_from' });
    const watchedTimeTo = useWatch({ control, name: 'time_to' });
    const watchedTeacherIdsValue = useWatch({ control, name: 'teacher_ids' });
    const watchedTeacherIds = useMemo(() => (
        Array.isArray(watchedTeacherIdsValue) ? watchedTeacherIdsValue : []
    ), [watchedTeacherIdsValue]);

    const {
        requiredExamSegmentsList,
        requiredExamSegmentsOptions,
        teachersOptions,
        teachersList,
        studentsOptions,
        studentsList,
        platformsOptions,
        hasAvailabilityWindow,
        isLoadingRequiredExamSegments,
        isLoadingTeachers,
        isLoadingStudents,
        isLoadingPlatforms
    } = useScheduledExamFormOptions({
        examDate: normalizeDate(watchedExamDate),
        timeFrom: watchedTimeFrom,
        timeTo: watchedTimeTo,
        fallbackTeachers,
        fallbackStudents
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
    const examSegmentId = useWatch({ control, name: 'exam_segment_id' });
    const watchedStudentsValue = useWatch({ control, name: 'students' });
    const watchedStudents = useMemo(() => watchedStudentsValue || [], [watchedStudentsValue]);
    const availableTeacherIds = useMemo(() => (
        new Set(teachersList.map((teacher) => Number(teacher?.id ?? teacher?.value)).filter((id) => Number.isInteger(id) && id > 0))
    ), [teachersList]);
    const availableStudentIds = useMemo(() => (
        new Set(studentsList.map((student) => Number(student?.id ?? student?.value)).filter((id) => Number.isInteger(id) && id > 0))
    ), [studentsList]);

    const selectedRequiredExamSegment = requiredExamSegmentsList.find(
        (segment) => Number(segment?.id) === Number(examSegmentId)
    ) ?? null;
    const requiredPartsCount = Number(selectedRequiredExamSegment?.parts_count);
    const hasRequiredPartsCount = Number.isInteger(requiredPartsCount) && requiredPartsCount > 0;
    const juzCountValidationMessage = copy(
        `يجب اختيار ${requiredPartsCount} جزء بالضبط لهذا الطالب حسب المقطع المختار.`,
        `You must select exactly ${requiredPartsCount} parts for this student based on the selected exam segment.`
    );

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

    useEffect(() => {
        if (!initialExam) {
            return;
        }

        reset(mapExamToFormValues(initialExam));
    }, [initialExam, reset]);

    useEffect(() => {
        if (isEditMode || !hasAvailabilityWindow || isLoadingTeachers) {
            return;
        }

        const filteredTeacherIds = watchedTeacherIds
            .map(Number)
            .filter((teacherId) => availableTeacherIds.has(teacherId));

        if (filteredTeacherIds.length !== watchedTeacherIds.length) {
            setValue('teacher_ids', filteredTeacherIds, {
                shouldDirty: true,
                shouldValidate: true
            });
        }
    }, [availableTeacherIds, hasAvailabilityWindow, isEditMode, isLoadingTeachers, setValue, watchedTeacherIds]);

    useEffect(() => {
        if (isEditMode || !hasAvailabilityWindow || isLoadingStudents) {
            return;
        }

        let hasChanges = false;

        const nextStudents = watchedStudents.map((student) => {
            const studentId = Number(student?.student_id);

            if (!studentId || availableStudentIds.has(studentId)) {
                return student;
            }

            hasChanges = true;

            return {
                ...student,
                student_id: null,
                juz_numbers: []
            };
        });

        if (hasChanges) {
            setValue('students', nextStudents, {
                shouldDirty: true,
                shouldValidate: true
            });
        }
    }, [availableStudentIds, hasAvailabilityWindow, isEditMode, isLoadingStudents, setValue, watchedStudents]);

    useEffect(() => {
        studentFields.forEach((field, index) => {
            const selectedJuzNumbers = Array.isArray(watchedStudents[index]?.juz_numbers)
                ? watchedStudents[index].juz_numbers
                : [];
            const errorPath = `students.${index}.juz_numbers`;

            if (!hasRequiredPartsCount) {
                clearErrors(errorPath);
                return;
            }

            if (selectedJuzNumbers.length === 0) {
                clearErrors(errorPath);
                return;
            }

            if (selectedJuzNumbers.length !== requiredPartsCount) {
                setError(errorPath, {
                    type: 'manual',
                    message: juzCountValidationMessage
                });
                return;
            }

            clearErrors(errorPath);
        });
    }, [clearErrors, hasRequiredPartsCount, juzCountValidationMessage, requiredPartsCount, setError, studentFields, watchedStudents]);

    const handleBack = () => {
        if (isEditMode && examId) {
            navigate(`/${lang || 'ar'}/scheduled-exams/${examId}`);
            return;
        }

        navigate(`/${lang || 'ar'}/scheduled-exams`);
    };

    const onSubmit = async (formData) => {
        if (hasRequiredPartsCount) {
            const invalidStudentIndexes = (formData.students || [])
                .map((student, index) => ({
                    index,
                    juzCount: Array.isArray(student?.juz_numbers) ? student.juz_numbers.length : 0
                }))
                .filter((student) => student.juzCount !== requiredPartsCount);

            if (invalidStudentIndexes.length > 0) {
                invalidStudentIndexes.forEach((student) => {
                    setError(`students.${student.index}.juz_numbers`, {
                        type: 'manual',
                        message: juzCountValidationMessage
                    });
                });
                toast.error(juzCountValidationMessage);
                return;
            }
        }

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

        clearErrors('teacher_ids');
        clearErrors('students');

        try {
            const [availableTeachersResponse, availableStudentsResponse] = await Promise.all([
                scheduledExamsService.getAvailableTeachers({
                    exam_date: payload.exam_date,
                    time_from: payload.time_from,
                    time_to: payload.time_to
                }),
                scheduledExamsService.getAvailableStudents({
                    exam_date: payload.exam_date,
                    time_from: payload.time_from,
                    time_to: payload.time_to
                })
            ]);

            const latestAvailableTeacherIds = new Set(
                getArrayData(availableTeachersResponse)
                    .map((teacher) => Number(teacher?.id ?? teacher?.value))
                    .filter((teacherId) => Number.isInteger(teacherId) && teacherId > 0)
            );

            const latestAvailableStudentIds = new Set(
                getArrayData(availableStudentsResponse)
                    .map((student) => Number(student?.id ?? student?.value))
                    .filter((studentId) => Number.isInteger(studentId) && studentId > 0)
            );

            const unavailableTeacherIds = payload.teacher_ids.filter((teacherId) => !latestAvailableTeacherIds.has(teacherId));
            const unavailableStudentIndexes = payload.students
                .map((student, index) => ({
                    index,
                    studentId: Number(student?.student_id)
                }))
                .filter((student) => student.studentId > 0 && !latestAvailableStudentIds.has(student.studentId));

            if (unavailableTeacherIds.length > 0) {
                const teacherAvailabilityMessage = copy(
                    'يوجد معلم أو أكثر لم يعد متاحًا في هذا الموعد. تم تحديث القائمة، برجاء اختيار المعلمين مرة أخرى.',
                    'One or more selected teachers are no longer available for this time slot. The list has been refreshed, please choose again.'
                );

                setValue(
                    'teacher_ids',
                    payload.teacher_ids.filter((teacherId) => latestAvailableTeacherIds.has(teacherId)),
                    { shouldDirty: true, shouldValidate: true }
                );
                setError('teacher_ids', {
                    type: 'manual',
                    message: teacherAvailabilityMessage
                });
                toast.error(teacherAvailabilityMessage);
                return;
            }

            if (unavailableStudentIndexes.length > 0) {
                const studentAvailabilityMessage = copy(
                    'يوجد طالب أو أكثر لم يعد متاحًا في هذا الموعد. تم تحديث القائمة، برجاء اختيار الطلاب مرة أخرى.',
                    'One or more selected students are no longer available for this time slot. The list has been refreshed, please choose again.'
                );

                const unavailableStudentIdSet = new Set(unavailableStudentIndexes.map((student) => student.studentId));
                setValue(
                    'students',
                    payload.students.map((student) => (
                        unavailableStudentIdSet.has(Number(student.student_id))
                            ? { ...student, student_id: null, juz_numbers: [] }
                            : student
                    )),
                    { shouldDirty: true, shouldValidate: true }
                );
                unavailableStudentIndexes.forEach((student) => {
                    setError(`students.${student.index}.student_id`, {
                        type: 'manual',
                        message: studentAvailabilityMessage
                    });
                });
                toast.error(studentAvailabilityMessage);
                return;
            }
        }
        catch (availabilityError) {
            toast.error(getErrorMessage(availabilityError));
            return;
        }

        if (isEditMode && examId) {
            updateScheduledExamMutation.mutate({ examId, data: payload }, {
                onSuccess: () => {
                    toast.success(t('scheduledExams.updateSuccess', 'Scheduled exam updated successfully.'));
                    navigate(`/${lang || 'ar'}/scheduled-exams/${examId}`);
                },
                onError: (error) => {
                    toast.error(getErrorMessage(error));
                }
            });
            return;
        }

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

    const isSubmitting = createScheduledExamMutation.isPending || updateScheduledExamMutation.isPending;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-6">
                    <SectionCard icon={CalendarIcon} title={t('scheduledExams.sections.schedule', 'Schedule Details')}>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <SelectRFH
                                    name="exam_segment_id"
                                    control={control}
                                    label={t('scheduledExams.segmentId', 'Exam Segment ID')}
                                    required
                                    options={requiredExamSegmentsOptions}
                                    loading={isLoadingRequiredExamSegments}
                                    placeholder="common.select"
                                    error={errors.exam_segment_id?.message ? t(errors.exam_segment_id.message) : undefined}
                                    classes={SELECT_FIELD_CLASSES}
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
                        <p className="text-sm text-slate-500">
                            {hasAvailabilityWindow
                                ? copy('يتم عرض الطلاب المتاحين فقط حسب التاريخ والوقت المحددين.', 'Only available students for the selected date and time are shown.')
                                : copy('اختر تاريخ ووقت الامتحان أولاً لعرض الطلاب المتاحين.', 'Choose the exam date and time first to load available students.')}
                        </p>

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
                                                disabled={!hasAvailabilityWindow}
                                                placeholder="common.select"
                                                error={errors.students?.[index]?.student_id?.message ? t(errors.students[index].student_id.message) : undefined}
                                                classes={SELECT_FIELD_CLASSES}
                                            />

                                            <JuzNumbersField
                                                control={control}
                                                name={`students.${index}.juz_numbers`}
                                                label={t('scheduledExams.juzNumbers', 'Juz Numbers')}
                                                helperText={hasRequiredPartsCount
                                                    ? copy(
                                                        `اختر ${requiredPartsCount} جزء بالضبط لهذا الطالب.`,
                                                        `Select exactly ${requiredPartsCount} parts for this student.`
                                                    )
                                                    : undefined}
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
                            {responsible !== 'entity'
                                ? t('scheduledExams.teachersHelper', 'Teachers are currently enabled only when the responsible side is the entity.')
                                : hasAvailabilityWindow
                                    ? copy('يتم عرض المعلمين المتاحين فقط حسب التاريخ والوقت المحددين.', 'Only available teachers for the selected date and time are shown.')
                                    : copy('اختر تاريخ ووقت الامتحان أولاً لعرض المعلمين المتاحين.', 'Choose the exam date and time first to load available teachers.')}
                        </p>

                        <SelectRFH
                            name="teacher_ids"
                            control={control}
                            label={t('scheduledExams.teachers', 'Assigned Teachers')}
                            options={teachersOptions}
                            isMulti
                            loading={isLoadingTeachers}
                            disabled={responsible !== 'entity' || !hasAvailabilityWindow}
                            placeholder="common.select"
                            classes={SELECT_FIELD_CLASSES}
                        />
                    </SectionCard>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="space-y-4">
                            <Button
                                type="submit"
                                variant="primary"
                                loading={isSubmitting}
                                className="w-full justify-between rounded-2xl px-5 py-3 text-base"
                            >
                                <span>{isEditMode
                                    ? t('scheduledExams.update', 'Update Scheduled Exam')
                                    : t('scheduledExams.create', 'Create Scheduled Exam')}</span>
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

export default CreateScheduledExamForm;
