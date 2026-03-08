import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { Button, FormInput, FormTextarea, FormFile, FormSelect, ReactSelect } from '@/globals/components';
import { XIcon } from '@/globals/icons';
import { getLocalizedText } from '@/utils/helpers/getLocalizedText';
import {
    useEvaluationTemplates,
    useEvaluationTemplate,
    useSubmitEvaluation
} from '../hooks/useEvaluations';
import type { AvailableEntity, TemplateCriteriaItem } from '../types/evaluations.types';
import { getErrorMessage } from '@/utils/helpers/errorHandler';

interface CreateEvaluationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type FormValues = {
    evaluated_id: number | null;
    evaluation_date: string;
    attachment: File | null;
} & Record<string, string | number | null>;

function buildDefaultValues(
    criteria: TemplateCriteriaItem[],
    canAttachFiles: boolean
): FormValues {
    const out: FormValues = {
        evaluated_id: null,
        evaluation_date: '',
        attachment: canAttachFiles ? null : undefined as unknown as null
    };
    criteria.forEach((c) => {
        out[`score_${c.id}`] = '';
        out[`notes_${c.id}`] = '';
    });
    return out;
}

function buildFormData(
    templateId: number,
    evaluatedEntity: AvailableEntity,
    criteria: TemplateCriteriaItem[],
    values: FormValues,
    canAttachFiles: boolean
): FormData {
    const formData = new FormData();
    formData.append('evaluation_parameter_id', String(templateId));
    formData.append('evaluated_type', evaluatedEntity.type);
    formData.append('evaluated_id', String(evaluatedEntity.id));

    const dateVal = values.evaluation_date?.trim();
    if (dateVal) formData.append('evaluation_date', dateVal);

    criteria.forEach((c, index) => {
        const score = values[`score_${c.id}`];
        const notes = values[`notes_${c.id}`];
        formData.append(`criteria_scores[${index}][criteria_id]`, String(c.id));
        formData.append(`criteria_scores[${index}][score]`, String(score ?? ''));
        formData.append(`criteria_scores[${index}][notes]`, String(notes ?? '').trim());
    });

    if (canAttachFiles && values.attachment instanceof File && values.attachment.size > 0) {
        formData.append('attachements', values.attachment);
    }

    return formData;
}

const CreateEvaluationModal: React.FC<CreateEvaluationModalProps> = ({
    isOpen,
    onClose,
    onSuccess
}) => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'ar';

    const [selectedTemplateId, setSelectedTemplateId] = useState<number>(0);

    const { templates, isLoading: isLoadingTemplates } = useEvaluationTemplates(isOpen);
    const { detail, isLoading: isLoadingDetail } = useEvaluationTemplate(
        selectedTemplateId > 0 ? selectedTemplateId : null
    );
    const submitMutation = useSubmitEvaluation();

    const templateOptions = useMemo(() => {
        return templates.map((tmpl) => ({
            value: tmpl.id,
            label: getLocalizedText(tmpl.name, currentLang, t('common.not_available', 'N/A'))
        }));
    }, [templates, currentLang, t]);

    const entityOptions = useMemo(() => {
        if (!detail?.available_entities) return [];
        return detail.available_entities.map((e) => ({
            value: e.id,
            label: getLocalizedText(e.name, currentLang, t('common.not_available', 'N/A')),
            type: e.type
        }));
    }, [detail?.available_entities, currentLang, t]);

    const template = detail?.template ?? null;
    // Stable reference for criteria so useEffect doesn't see a new [] every render when template is null
    const criteria = useMemo(
        () => (template?.criteria ? [...template.criteria] : []),
        [template?.criteria]
    );
    const canAttachFiles = detail?.can_attach_files ?? false;
    const availableEntities = detail?.available_entities ?? [];

    const defaultValues = useMemo(
        () => buildDefaultValues(criteria, canAttachFiles),
        [criteria, canAttachFiles]
    );

    const {
        control,
        handleSubmit,
        formState: { errors },
        reset,
        watch,
    } = useForm<FormValues>({
        defaultValues
    });

    const watchedEvaluatedId = watch('evaluated_id');

    // Only reset when we have a template selected and its detail loaded (avoid reset on every render when criteria was [])
    useEffect(() => {
        if (!template || criteria.length === 0) return;
        reset(buildDefaultValues(criteria, canAttachFiles));
    }, [template?.id, criteria, canAttachFiles, reset]);

    const handleClose = useCallback(() => {
        if (!submitMutation.isPending) {
            setSelectedTemplateId(0);
            reset(buildDefaultValues([], false));
            onClose();
        }
    }, [submitMutation.isPending, reset, onClose]);

    const getEvaluatedEntity = useCallback((): AvailableEntity | null => {
        const id = typeof watchedEvaluatedId === 'number' ? watchedEvaluatedId : null;
        if (id == null) return null;
        return availableEntities.find((e) => e.id === id) ?? null;
    }, [watchedEvaluatedId, availableEntities]);

    const onSubmit = useCallback(
        (values: FormValues) => {
            const entity = getEvaluatedEntity();
            if (!entity || !template) {
                toast.error(t('evaluations.selectEvaluated', 'Please select who to evaluate.'));
                return;
            }
            const formData = buildFormData(
                selectedTemplateId,
                entity,
                criteria,
                values,
                canAttachFiles
            );
            submitMutation.mutate(formData, {
                onSuccess: () => {
                    toast.success(t('evaluations.submitSuccess', 'Evaluation submitted successfully.'));
                    onSuccess();
                    handleClose();
                },
                onError: (err) => toast.error(getErrorMessage(err))
            });
        },
        [
            getEvaluatedEntity,
            template,
            selectedTemplateId,
            criteria,
            canAttachFiles,
            submitMutation,
            t,
            onSuccess,
            handleClose
        ]
    );

    if (!isOpen) return null;

    const showTemplateStep = selectedTemplateId === 0;
    const showForm = selectedTemplateId > 0 && detail && !isLoadingDetail;

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
            <div className="fixed inset-0 bg-black/50" aria-hidden="true" onClick={handleClose} />
            <div className="relative flex min-h-full items-center justify-center p-4 pt-20 md:pt-24">
                <div className="relative w-full max-w-lg rounded-lg bg-white shadow-xl z-10 max-h-[90vh] overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 flex-shrink-0">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {t('evaluations.createEvaluation', 'Create Evaluation')}
                        </h3>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            aria-label={t('common.closeAria')}
                        >
                            <XIcon width={20} height={20} />
                        </button>
                    </div>

                    {showTemplateStep && (
                        <div className="px-6 py-4 space-y-4 flex-shrink-0">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('evaluations.template', 'Evaluation template')}{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <ReactSelect
                                    value={selectedTemplateId || null}
                                    onChange={(v) => setSelectedTemplateId(v != null ? Number(v) : 0)}
                                    options={templateOptions}
                                    placeholder={t('common.select', 'Select an option')}
                                    isDisabled={isLoadingTemplates}
                                    menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                    menuPosition="fixed"
                                />
                            </div>
                            <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                                <Button type="button" variant="outline" onClick={handleClose}>
                                    {t('common.cancel')}
                                </Button>
                            </div>
                        </div>
                    )}

                    {selectedTemplateId > 0 && isLoadingDetail && (
                        <div className="px-6 py-8 text-center text-gray-500 flex-1">
                            {t('common.loading', 'Loading...')}
                        </div>
                    )}

                    {showForm && template && (
                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            className="px-6 py-4 space-y-4 flex-1 overflow-y-auto"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-sm text-gray-600">
                                    {t('evaluations.template', 'Template')}:{' '}
                                    <span className="font-medium text-gray-900">
                                        {getLocalizedText(template.name, currentLang, '-')}
                                    </span>
                                </p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedTemplateId(0)}
                                >
                                    {t('evaluations.changeTemplate', 'Change template')}
                                </Button>
                            </div>
                            {entityOptions.length === 0 ? (
                                <p className="text-sm text-amber-700 bg-amber-50 rounded-lg p-3">
                                    {t('evaluations.noEntitiesToEvaluate', 'No one available to evaluate for this template.')}
                                </p>
                            ) : (
                                <FormSelect<FormValues>
                                    name="evaluated_id"
                                    control={control}
                                    label={t('evaluations.evaluateWho', 'Evaluate')}
                                    required
                                    options={entityOptions}
                                    placeholder={t('common.select', 'Select an option')}
                                    error={errors.evaluated_id?.message as string | undefined}
                                    menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                    menuPosition="fixed"
                                />
                            )}

                            <FormInput<FormValues>
                                name="evaluation_date"
                                control={control}
                                type="date"
                                label={t('evaluations.evaluationDate', 'Evaluation date')}
                            />

                            <div className="border-t border-gray-200 pt-3">
                                <h4 className="text-sm font-medium text-gray-700 mb-3">
                                    {t('evaluations.criteriaScores', 'Criteria scores')}
                                </h4>
                                <div className="space-y-3">
                                    {criteria.map((c) => (
                                        <div
                                            key={c.id}
                                            className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 space-y-2"
                                        >
                                            <p className="text-sm font-medium text-gray-900">
                                                {getLocalizedText(c.criteria_name, currentLang, '-')} (
                                                {t('evaluations.maxDegree', 'max')} {c.degree})
                                            </p>
                                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                <FormInput<FormValues>
                                                    name={`score_${c.id}` as keyof FormValues}
                                                    control={control}
                                                    type="number"
                                                    label={t('evaluations.score', 'Score')}
                                                    required
                                                    error={(errors as Record<string, { message?: string }>)[`score_${c.id}`]?.message}
                                                />
                                                <FormTextarea<FormValues>
                                                    name={`notes_${c.id}` as keyof FormValues}
                                                    control={control}
                                                    label={t('evaluations.notes', 'Notes')}
                                                    placeholder={t('evaluations.notesPlaceholder', 'Optional')}
                                                    rows={1}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {canAttachFiles && (
                                <FormFile<FormValues>
                                    name="attachment"
                                    control={control}
                                    label={t('evaluations.attachments', 'Attachments')}
                                    accept="image/*,.pdf"
                                />
                            )}

                            <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 -mx-6 px-6 py-4 mt-4 flex-shrink-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleClose}
                                    disabled={submitMutation.isPending}
                                >
                                    {t('common.cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    loading={submitMutation.isPending}
                                    disabled={entityOptions.length === 0}
                                >
                                    {t('evaluations.submit', 'Submit')}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreateEvaluationModal;
