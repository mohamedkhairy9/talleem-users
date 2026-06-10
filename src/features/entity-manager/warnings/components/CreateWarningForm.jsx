import React, { useEffect, useMemo } from 'react';
import { useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useFormWithValidation } from '@/shared/utils';
import { FormInput, FormSelect, FormTextarea, Button } from '@/shared/components';
import SelectRFH from '@/shared/components/ui/SelectRFH';
import { useCreateWarning, useWarningReasons } from '../hooks';
import { createWarningSchema } from '../schemas';
import { toast } from 'react-toastify';
import { useAuthStore } from '@/app/stores';
import { createStudentsLoader, createTeachersLoader } from '../utils';
import { WARNING_FORM_TYPES } from '../config';
import { normalizeDate } from '@/shared/utils';

const CreateWarningForm = ({ onSuccess, onCancel }) => {
    const { t, i18n } = useTranslation();
    const createWarningMutation = useCreateWarning();

    const entity = useAuthStore((s) => s.user?.entity);

    const branchId = entity?.branch?.id ?? entity?.branch_id ?? null;
    const mainProgramId = entity?.main_program?.id ?? entity?.main_program_id ?? null;
    const programId = entity?.program?.id ?? entity?.program_id ?? mainProgramId ?? null;
    const entityId = entity?.id ?? null;
    const warningReasonProgramId = mainProgramId ?? programId;

    console.log('STEP 2 - FULL ENTITY:', JSON.stringify(entity, null, 2)); console.log('STEP 1 - mainProgramId:', mainProgramId);
    console.log('STEP 1 - programId:', programId);
    console.log('STEP 1 - warningReasonProgramId:', warningReasonProgramId);

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
            date: new Date().toISOString().split('T')[0],
            note: ''
        }
    });

    const warningType = useWatch({ control, name: 'warning_type' });
    const formValues = useWatch({ control });

    console.log('warningType:', warningType);

    useEffect(() => {
        console.log('Form Values:', formValues);
    }, [formValues]);

    useEffect(() => {
        console.log('Student Selected:', formValues?.student_id);
    }, [formValues?.student_id]);

    useEffect(() => {
        console.log('Teacher Selected:', formValues?.teacher_id);
    }, [formValues?.teacher_id]);

    useEffect(() => {
        console.log('Reason Selected:', formValues?.warning_reason_id);
    }, [formValues?.warning_reason_id]);

    const studentsLoader = useMemo(() => {
        console.log('Creating studentsLoader', {
            branchId,
            warningReasonProgramId,
            entityId
        });

        return createStudentsLoader(
            branchId,
            warningReasonProgramId,
            entityId
        );
    }, [branchId, warningReasonProgramId, entityId]);

    const teachersLoader = useMemo(() => {
        console.log('Creating teachersLoader', {
            branchId,
            warningReasonProgramId,
            entityId
        });

        return createTeachersLoader(
            branchId,
            warningReasonProgramId,
            entityId
        );
    }, [branchId, warningReasonProgramId, entityId]);

    const {
        data: warningReasonsData,
        isLoading: isLoadingReasons
    } = useWarningReasons();

    console.log('warningReasonsData:', warningReasonsData);
    console.log('isLoadingReasons:', isLoadingReasons);

    // const warningReasonOptions = useMemo(() => {
    //     console.log('Building warningReasonOptions');

    //     const reasons = Array.isArray(warningReasonsData?.data)
    //         ? warningReasonsData.data
    //         : Array.isArray(warningReasonsData)
    //             ? warningReasonsData
    //             : [];

    //     console.log('Reasons:', reasons);

    //     const currentLang = i18n.language || 'ar';

    //     const options = reasons.map((reason) => ({
    //         value: reason.id,
    //         label:
    //             typeof reason.name === 'string'
    //                 ? reason.name
    //                 : currentLang === 'ar' && reason.name?.ar
    //                     ? reason.name.ar
    //                     : reason.name?.en || ''
    //     }));

    //     console.log('warningReasonOptions:', options);

    //     return options;
    // }, [warningReasonsData, i18n.language]);

    const warningReasonOptions = useMemo(() => {
        const reasons =
            Array.isArray(warningReasonsData?.data?.data)
                ? warningReasonsData.data.data
                : Array.isArray(warningReasonsData?.data)
                    ? warningReasonsData.data
                    : Array.isArray(warningReasonsData)
                        ? warningReasonsData
                        : [];

        console.log("resons", warningReasonsData);
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
    }, [warningReasonsData, i18n.language]);
    console.log(warningReasonOptions);

    const warningTypeOptions = useMemo(() => {
        const options = WARNING_FORM_TYPES.map((type) => ({
            value: type.value,
            label: t(type.labelKey, type.value)
        }));

        console.log('warningTypeOptions:', options);

        return options;
    }, [t]);

    useEffect(() => {
        console.log('Warning Type Changed:', warningType);

        setValue('student_id', null);
        setValue('teacher_id', null);
    }, [warningType, setValue]);

    useEffect(() => {
        if (!warningReasonProgramId) {
            console.log('warningReasonProgramId missing, resetting target fields');

            setValue('student_id', null);
            setValue('teacher_id', null);
        }
    }, [warningReasonProgramId, setValue]);

    useEffect(() => {
        console.log('studentsLoader:', studentsLoader);
    }, [studentsLoader]);

    useEffect(() => {
        console.log('teachersLoader:', teachersLoader);
    }, [teachersLoader]);

    const buildPayload = (data) => {
        console.log('buildPayload Input:', data);

        const payload = {
            warning_reason_id: data.warning_reason_id,
            warning_type: data.warning_type,
            date: normalizeDate(data.date),
            note: data.note?.trim() || undefined
        };

        switch (data.warning_type) {
            case 'student':
                if (data.student_id) {
                    payload.branch_id = branchId;
                    payload.program_id = programId;
                    payload.entity_id = entityId;
                    payload.student_id = data.student_id;
                }
                break;

            case 'teacher':
                if (data.teacher_id) {
                    payload.teacher_id = data.teacher_id;
                }
                break;

            default:
                console.log('Unknown warning_type:', data.warning_type);
                break;
        }

        console.log('buildPayload Output:', payload);

        return payload;
    };

    const onSubmit = async (data) => {
        console.log('Submit Clicked');
        console.log('Submit Data:', data);

        // if (data.warning_type === 'student' && (!branchId || !programId || !entityId)) {
        //     toast.error(t('warning.missingEntityData'));
        //     return;
        // }

        // if (!warningReasonProgramId) {
        //     toast.error(t('warning.missingEntityData'));
        //     return;
        // }

        const payload = buildPayload(data);

        console.log('Final Payload Before API:', payload);

        createWarningMutation.mutate(payload, {
            onSuccess: (response) => {
                console.log('SUCCESS RESPONSE:', response);

                toast.success(t('warning.createSuccess'));
                reset();
                onSuccess?.();
            },
            onError: (error) => {
                console.log('ERROR OBJECT:', error);
                console.log('ERROR RESPONSE:', error?.response);
                console.log('ERROR DATA:', error?.response?.data);

                const errorMessage =
                    error?.response?.data?.message ||
                    error?.message ||
                    t('warning.createError');

                toast.error(errorMessage);
            }
        });
    };

    const isStudentContextMissing = !branchId || !programId || !entityId;
    const isReasonContextMissing = !warningReasonProgramId;
    const isTargetFieldDisabled = isReasonContextMissing;

    console.log('isStudentContextMissing:', isStudentContextMissing);
    console.log('isReasonContextMissing:', isReasonContextMissing);
    console.log('isTargetFieldDisabled:', isTargetFieldDisabled);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* {isReasonContextMissing && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="text-sm text-red-800">
                        {t('warning.missingEntityDataAccount')}
                    </p>
                </div>
            )} */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormSelect
                    name="warning_type"
                    label={t('warning.warningType', 'Warning Type')}
                    control={control}
                    error={errors.warning_type?.message}
                    options={warningTypeOptions}
                />

                <FormSelect
                    name="warning_reason_id"
                    label={t('warning.warningReason', 'Warning Reason')}
                    control={control}
                    error={errors.warning_reason_id?.message}
                    options={warningReasonOptions}
                    isLoading={isLoadingReasons}
                    disabled={ isLoadingReasons}
                />

                {warningType === 'student' && (
                    <SelectRFH
                        name="student_id"
                        label={t('warning.student', 'Student')}
                        control={control}
                        error={errors.student_id?.message}
                        isAsync={true}
                        loadOptions={studentsLoader}
                        defaultOptions={true}
                        cacheOptions={true}
                        // disabled={isTargetFieldDisabled || isStudentContextMissing}
                        placeholder={t('warning.searchStudent', 'Search and select student...')}
                    />
                )}

                {warningType === 'teacher' && (
                    <SelectRFH
                        name="teacher_id"
                        label={t('warning.teacher', 'Teacher')}
                        control={control}
                        error={errors.teacher_id?.message}
                        isAsync={true}
                        loadOptions={teachersLoader}
                        defaultOptions={true}
                        cacheOptions={true}
                        // disabled={isTargetFieldDisabled}
                        placeholder={t('warning.searchTeacher', 'Search and select teacher...')}
                    />
                )}

                <FormInput
                    name="date"
                    label={t('warning.date', 'Date')}
                    type="date"
                    control={control}
                    error={errors.date?.message}
                />
            </div>

            <FormTextarea
                name="note"
                label={t('warning.note', 'Note')}
                control={control}
                error={errors.note?.message}
                rows={4}
            />

            <div className="flex justify-end gap-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                        console.log('Cancel Clicked');
                        reset();
                        onCancel?.();
                    }}
                >
                    {t('common.cancel', 'Cancel')}
                </Button>

                <Button
                    type="submit"
                    variant="primary"
                    disabled={createWarningMutation.isPending}
                    onClick={() => {
                        console.log('Create Warning Button Clicked');
                    }}
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