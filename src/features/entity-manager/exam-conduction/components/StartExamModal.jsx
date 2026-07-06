import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/app/stores';
import { Button, SelectRFH } from '@/shared/components';
import { XIcon } from '@/shared/icons';
import { getLocalizedText } from '@/shared/utils/helpers/getLocalizedText';
import { getErrorMessage } from '@/shared/utils';
import { useForm } from 'react-hook-form';
import {
    useConductExamEvaluationTemplates,
    useConductExamSessionWindowConfig,
    useStartStudentExam
} from '../hooks/useExamConduction';
import { getExamConductionAvailability } from '../utils/examAvailability';
import { getExamStartPermission } from '../utils/examStartPermissions';

const EXAM_TYPE_OPTIONS = [
    { id: 'maqata3', label: 'مقاطع', value: 'maqata3' },
    { id: 'sard', label: 'سرد', value: 'sard' }
];

const StartExamModal = ({ isOpen, onClose, exam, student }) => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { lang } = useParams();
    const currentLang = i18n.language || lang || 'ar';
    const actingRole = useAuthStore((state) => state.actingRole ??
        state.user?.entity?.role ??
        state.user?.entity?.roles ??
        state.user?.roles ??
        null);
    const { templates, isLoading: isLoadingTemplates } = useConductExamEvaluationTemplates({
        enabled: isOpen
    });
    const { beforeMinutes, afterMinutes } = useConductExamSessionWindowConfig({
        enabled: isOpen
    });
    const startStudentExamMutation = useStartStudentExam();
    const {
        control,
        handleSubmit,
        reset,
        watch,
        clearErrors,
        setError,
        formState: { errors }
    } = useForm({
        defaultValues: {
            exam_type: 'maqata3',
            evaluation_parameter_id: null
        }
    });
    const selectedExamType = watch('exam_type');
    const selectedTemplateId = watch('evaluation_parameter_id');
    const examAvailability = useMemo(() => getExamConductionAvailability(exam, {
        beforeMinutes,
        afterMinutes
    }), [afterMinutes, beforeMinutes, exam]);
    const startPermission = useMemo(
        () => getExamStartPermission(exam?.responsible, actingRole),
        [actingRole, exam?.responsible]
    );
    const responsibilityLabel = useMemo(
        () => t(
            `scheduledExams.responsibleOptions.${exam?.responsible === 'general_management' ? 'generalManagement' : exam?.responsible}`,
            exam?.responsible ?? '-'
        ),
        [exam?.responsible, t]
    );
    const startPermissionMessage = useMemo(
        () => t(
            'examConduction.validation.startNotAllowedForResponsible',
            'Only the responsible side assigned to this exam can start it. This exam belongs to {{responsible}}.',
            { responsible: responsibilityLabel }
        ),
        [responsibilityLabel, t]
    );

    const templateOptions = useMemo(() => (
        templates.map((template) => ({
            id: template.id,
            value: template.id,
            label: [
                getLocalizedText(template?.name, currentLang, t('common.not_available', 'N/A')),
                template?.evaluation_system
                    ? getLocalizedText(template?.evaluation_system, currentLang, '')
                    : '',
                template?.total_grade != null
                    ? `${t('examConduction.totalGrade', 'Total Grade')}: ${template.total_grade}`
                    : ''
            ].filter(Boolean).join(' - ')
        }))
    ), [templates, currentLang, t]);

    const handleClose = () => {
        if (startStudentExamMutation.isPending) {
            return;
        }

        clearErrors();
        reset({
            exam_type: 'maqata3',
            evaluation_parameter_id: null
        });
        onClose();
    };

    useEffect(() => {
        const isValidExamType = EXAM_TYPE_OPTIONS.some((option) => option.value === selectedExamType);

        if (selectedExamType && isValidExamType) {
            clearErrors('exam_type');
        }
    }, [clearErrors, selectedExamType]);

    useEffect(() => {
        const hasMatchingTemplate = templates.some((template) => Number(template?.id) === Number(selectedTemplateId));

        if (selectedTemplateId && hasMatchingTemplate) {
            clearErrors('evaluation_parameter_id');
        }
    }, [clearErrors, selectedTemplateId, templates]);

    const onSubmit = (values) => {
        if (!exam?.id || !student?.id) {
            return;
        }

        if (!startPermission.canStart) {
            toast.error(startPermissionMessage);
            return;
        }

        if (!examAvailability.isAvailable) {
            toast.error(t(
                'examConduction.validation.examOutsideWindow',
                'This exam is not available right now. It can only be conducted within the configured time window before or after the scheduled session.'
            ));
            return;
        }

        const isValidExamType = EXAM_TYPE_OPTIONS.some((option) => option.value === values.exam_type);

        if (!values.exam_type) {
            setError('exam_type', {
                type: 'manual',
                message: t('examConduction.validation.examTypeRequired', 'Please select the exam type.')
            });
            return;
        }

        if (!isValidExamType) {
            setError('exam_type', {
                type: 'manual',
                message: t('examConduction.validation.examTypeInvalid', 'Selected exam type is invalid.')
            });
            return;
        }

        if (!Array.isArray(templates) || templates.length === 0) {
            setError('evaluation_parameter_id', {
                type: 'manual',
                message: t('examConduction.validation.noTemplatesAvailable', 'No evaluation templates are available right now.')
            });
            return;
        }

        const selectedTemplate = templates.find((template) => template.id === Number(values.evaluation_parameter_id)) ?? null;

        if (!values.evaluation_parameter_id) {
            setError('evaluation_parameter_id', {
                type: 'manual',
                message: t('examConduction.validation.templateRequired', 'Please select an evaluation template first.')
            });
            return;
        }

        if (!selectedTemplate) {
            setError('evaluation_parameter_id', {
                type: 'manual',
                message: t('examConduction.validation.templateInvalid', 'Selected evaluation template is invalid.')
            });
            return;
        }

        startStudentExamMutation.mutate({
            scheduledExamId: exam.id,
            studentId: student.id,
            payload: {
                exam_type: values.exam_type,
                evaluation_parameter_id: Number(values.evaluation_parameter_id)
            }
        }, {
            onSuccess: (response) => {
                toast.success(t('examConduction.startSuccess', 'Exam started successfully.'));
                navigate(
                    `/${lang || 'ar'}/exam-conduction/${exam.id}/students/${student.id}/conduct`,
                    {
                        state: {
                            startData: response?.data ?? response,
                            startPayload: {
                                exam_type: values.exam_type,
                                evaluation_parameter_id: Number(values.evaluation_parameter_id)
                            },
                            selectedTemplate
                        }
                    }
                );
                handleClose();
            },
            onError: (requestError) => {
                toast.error(getErrorMessage(requestError) || t('examConduction.startError', 'Error starting exam.'));
            }
        });
    };

    if (!isOpen || !student) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
            <div className="fixed inset-0 bg-black/50" aria-hidden="true" onClick={handleClose} />
            <div className="relative flex min-h-full items-center justify-center p-4 pt-20 md:pt-24">
                <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-lg bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                {t('examConduction.startExam', 'Start Exam')}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {student?.name || '-'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={startStudentExamMutation.isPending}
                            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            aria-label={t('common.closeAria')}
                        >
                            <XIcon width={20} height={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-4">
                        <div className="space-y-4">
                            {!startPermission.canStart ? (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                    {startPermissionMessage}
                                </div>
                            ) : null}

                            <SelectRFH
                                name="exam_type"
                                control={control}
                                label={t('examConduction.examType', 'Exam Type')}
                                required
                                options={EXAM_TYPE_OPTIONS}
                                error={errors.exam_type?.message}
                            />

                            <SelectRFH
                                name="evaluation_parameter_id"
                                control={control}
                                label={t('examConduction.evaluationTemplate', 'Evaluation Template')}
                                required
                                options={templateOptions}
                                loading={isLoadingTemplates}
                                error={errors.evaluation_parameter_id?.message}
                            />
                        </div>

                        <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
                            <Button type="button" variant="outline" onClick={handleClose} disabled={startStudentExamMutation.isPending}>
                                {t('common.cancel')}
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                loading={startStudentExamMutation.isPending}
                                disabled={!startPermission.canStart}
                            >
                                {t('examConduction.startExam', 'Start Exam')}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default StartExamModal;
