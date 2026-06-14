import React, { useEffect, useMemo, useState } from 'react';
import { useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAuthStore } from '@/app/stores';
import { Button, FormInput, FormSelect, FormTextarea } from '@/shared/components';
import SelectRFH from '@/shared/components/ui/SelectRFH';
import { normalizeDate, useFormWithValidation } from '@/shared/utils';
import { AlertTriangleIcon, EditIcon, TeacherIcon, UserIcon } from '@/shared/icons';
import { WARNING_FORM_TYPES } from '../config';
import { useCreateWarning, useWarningReasons } from '../hooks';
import { createWarningSchema } from '../schemas';
import { createStudentsLoader, createTeachersLoader } from '../utils';

const FORM_PANEL_CLASS =
    'rounded-2xl border border-[#dde8e8] bg-[#fbfcfc] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]';

const TargetTypeButton = ({ active, icon, label, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold transition-all ${
            active
                ? 'bg-[#0d6a70] text-white shadow-[0_12px_24px_rgba(13,106,112,0.2)]'
                : 'bg-white text-slate-500 hover:bg-[#f4f8f8] hover:text-[#0d6a70]'
        }`}
    >
        {icon}
        {label}
    </button>
);

const CreateWarningForm = ({ onSuccess, onCancel }) => {
    const { t, i18n } = useTranslation();
    const createWarningMutation = useCreateWarning();
    const entity = useAuthStore((state) => state.user?.entity);

    const branchId = entity?.branch?.id ?? entity?.branch_id ?? null;
    const mainProgramId = entity?.main_program?.id ?? entity?.main_program_id ?? null;
    const programId = entity?.program?.id ?? entity?.program_id ?? mainProgramId ?? null;
    const entityId = entity?.id ?? null;
    const warningReasonProgramId = mainProgramId ?? programId;
    const today = new Date().toISOString().split('T')[0];
    const [selectedTargetType, setSelectedTargetType] = useState('student');

    const {
        control,
        handleSubmit,
        formState: { errors },
        setValue,
        reset
    } = useFormWithValidation({
        schema: createWarningSchema,
        defaultValues: {
            warning_type: 'student',
            student_id: null,
            teacher_id: null,
            warning_reason_id: null,
            date: today,
            note: ''
        }
    });

    const watchedWarningType = useWatch({ control, name: 'warning_type' });
    const warningType = watchedWarningType || selectedTargetType;

    useEffect(() => {
        if (watchedWarningType && watchedWarningType !== selectedTargetType) {
            setSelectedTargetType(watchedWarningType);
        }
    }, [selectedTargetType, watchedWarningType]);

    useEffect(() => {
        setValue('student_id', null);
        setValue('teacher_id', null);
    }, [warningType, setValue]);

    useEffect(() => {
        if (!warningReasonProgramId) {
            setValue('student_id', null);
            setValue('teacher_id', null);
        }
    }, [setValue, warningReasonProgramId]);

    const studentsLoader = useMemo(
        () => createStudentsLoader(branchId, warningReasonProgramId, entityId),
        [branchId, entityId, warningReasonProgramId]
    );

    const teachersLoader = useMemo(
        () => createTeachersLoader(branchId, warningReasonProgramId, entityId),
        [branchId, entityId, warningReasonProgramId]
    );

    const { data: warningReasonsData, isLoading: isLoadingReasons } = useWarningReasons();

    const warningReasonOptions = useMemo(() => {
        const reasons = Array.isArray(warningReasonsData?.data?.data)
            ? warningReasonsData.data.data
            : Array.isArray(warningReasonsData?.data)
                ? warningReasonsData.data
                : Array.isArray(warningReasonsData)
                    ? warningReasonsData
                    : [];

        const currentLang = i18n.language || 'ar';

        return reasons.map((reason) => ({
            value: reason.id,
            label:
                typeof reason.name === 'string'
                    ? reason.name
                    : currentLang === 'ar' && reason.name?.ar
                        ? reason.name.ar
                        : reason.name?.en || reason.title || reason.reason || ''
        }));
    }, [i18n.language, warningReasonsData]);

    const warningTypeOptions = useMemo(
        () =>
            WARNING_FORM_TYPES.map((type) => ({
                value: type.value,
                label: t(type.labelKey, type.value)
            })),
        [t]
    );

    const selectedWarningType = warningTypeOptions.find(
        (type) => type.value === warningType
    );

    const buildPayload = (data) => {
        const payload = {
            warning_reason_id: data.warning_reason_id,
            warning_type: data.warning_type,
            date: normalizeDate(data.date),
            note: data.note?.trim() || undefined
        };

        if (data.warning_type === 'student' && data.student_id) {
            payload.branch_id = branchId;
            payload.program_id = programId;
            payload.entity_id = entityId;
            payload.student_id = data.student_id;
        }

        if (data.warning_type === 'teacher' && data.teacher_id) {
            payload.teacher_id = data.teacher_id;
        }

        return payload;
    };

    const onSubmit = (data) => {
        const payload = buildPayload(data);

        createWarningMutation.mutate(payload, {
            onSuccess: () => {
                toast.success(t('warning.createSuccess'));
                reset({
                    warning_type: data.warning_type,
                    student_id: null,
                    teacher_id: null,
                    warning_reason_id: null,
                    date: today,
                    note: ''
                });
                onSuccess?.();
            },
            onError: (requestError) => {
                const errorMessage =
                    requestError?.response?.data?.message ||
                    requestError?.message ||
                    t('warning.createError');

                toast.error(errorMessage);
            }
        });
    };

    const targetFieldPlaceholder = warningType === 'student'
        ? t('warning.searchStudent', 'Search and select student...')
        : t('warning.searchTeacher', 'Search and select teacher...');

    const targetFieldConfig = warningType === 'teacher'
        ? {
            key: 'warning-target-teacher',
            name: 'teacher_id',
            label: t('warning.teacher', 'Teacher'),
            error: errors.teacher_id?.message,
            loadOptions: teachersLoader
        }
        : {
            key: 'warning-target-student',
            name: 'student_id',
            label: t('warning.student', 'Student'),
            error: errors.student_id?.message,
            loadOptions: studentsLoader
        };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="rounded-[22px] bg-[#f5f8f8] p-2">
                <div className="grid gap-2 sm:grid-cols-2">
                    <TargetTypeButton
                        active={warningType === 'student'}
                        icon={<UserIcon width={16} height={16} />}
                        label={t('warning.type.student', 'Student')}
                        onClick={() => {
                            setSelectedTargetType('student');
                            setValue('warning_type', 'student');
                        }}
                    />
                    <TargetTypeButton
                        active={warningType === 'teacher'}
                        icon={<TeacherIcon width={16} height={16} />}
                        label={t('warning.type.teacher', 'Teacher')}
                        onClick={() => {
                            setSelectedTargetType('teacher');
                            setValue('warning_type', 'teacher');
                        }}
                    />
                </div>
            </div>

            <section className={FORM_PANEL_CLASS}>
                <div className="mb-4 flex items-center gap-3 rounded-2xl bg-[#eef6f5] px-4 py-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#0d6a70] shadow-sm">
                        <AlertTriangleIcon width={18} height={18} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-[#0d6a70]">
                            {t('warning.listTitle', 'Warnings')}
                        </p>
                        <p className="text-xs text-slate-400">
                            {selectedWarningType?.label || t('warning.create', 'Create Warning')}
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <FormSelect
                        name="warning_reason_id"
                        label={t('warning.warningReason', 'Warning Reason')}
                        control={control}
                        required
                        error={errors.warning_reason_id?.message}
                        options={warningReasonOptions}
                        isLoading={isLoadingReasons}
                        disabled={isLoadingReasons}
                        placeholder={t('common.select', 'Select an option')}
                        className="[&_.react-select__control]:!min-h-[54px] [&_.react-select__control]:!rounded-2xl [&_.react-select__control]:!border-[#d7e5e5] [&_.react-select__control]:!px-1 [&_.react-select__control]:!shadow-sm [&_.react-select__control--is-focused]:!border-[#0d6a70]"
                    />

                    <SelectRFH
                        key={targetFieldConfig.key}
                        name={targetFieldConfig.name}
                        label={targetFieldConfig.label}
                        control={control}
                        required
                        error={targetFieldConfig.error}
                        isAsync
                        loadOptions={targetFieldConfig.loadOptions}
                        defaultOptions
                        cacheOptions={false}
                        classes="[&_.react-select__control]:!min-h-[54px] [&_.react-select__control]:!rounded-2xl [&_.react-select__control]:!border-[#d7e5e5] [&_.react-select__control]:!shadow-sm"
                        placeholder={targetFieldPlaceholder}
                    />

                    <FormInput
                        name="date"
                        label={t('warning.date', 'Date')}
                        type="date"
                        control={control}
                        required
                        error={errors.date?.message}
                        containerClassName="md:col-span-2"
                        className="rounded-2xl border-[#d7e5e5] px-4 py-4 text-sm shadow-sm focus:border-[#0d6a70]"
                    />
                </div>
            </section>

            <section className={FORM_PANEL_CLASS}>
                <div className="mb-4 flex items-center gap-3 rounded-2xl bg-[#eef6f5] px-4 py-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#0d6a70] shadow-sm">
                        <EditIcon width={18} height={18} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-[#0d6a70]">
                            {t('warning.note', 'Note')}
                        </p>
                        <p className="text-xs text-slate-400">
                            {t('warning.noteHelper', 'Add any helpful details about this warning.')}
                        </p>
                    </div>
                </div>

                <FormTextarea
                    name="note"
                    label={null}
                    control={control}
                    error={errors.note?.message}
                    rows={5}
                    placeholder={t('warning.notePlaceholder', 'Write the warning note here...')}
                    className="min-h-[156px] rounded-[24px] border border-[#d7e5e5] bg-[#fcfefe] px-4 py-4 text-sm leading-6 text-slate-700 shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] outline-none transition-colors placeholder:text-slate-400 focus:border-[#0d6a70] focus:ring-2 focus:ring-[#0d6a70]/10"
                />
            </section>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                        reset({
                            warning_type: warningType,
                            student_id: null,
                            teacher_id: null,
                            warning_reason_id: null,
                            date: today,
                            note: ''
                        });
                        onCancel?.();
                    }}
                    className="h-12 rounded-2xl border-[#d7e5e5] bg-white px-5 text-sm font-semibold text-slate-500 hover:bg-[#f8fbfb]"
                >
                    {t('common.cancel', 'Cancel')}
                </Button>

                <Button
                    type="submit"
                    variant="primary"
                    disabled={createWarningMutation.isPending}
                    className="h-12 rounded-2xl px-6 text-sm font-semibold !bg-[#0d6a70] shadow-[0_14px_28px_rgba(13,106,112,0.2)] hover:!bg-[#0a565b] sm:min-w-[220px]"
                >
                    {createWarningMutation.isPending
                        ? t('common.loading', 'Loading...')
                        : t('warning.create', 'Create Warning')}
                </Button>
            </div>
        </form>
    );
};

export default CreateWarningForm;
