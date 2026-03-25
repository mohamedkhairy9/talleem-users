import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWatch } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Button, FormInput, FormSelect, FormAsyncPaginate, ReactSelect } from '@/globals/components';
import { XIcon } from '@/globals/icons';
import { useFormWithValidation } from '@/utils';
import { getLocalizedText } from '@/utils/helpers/getLocalizedText';
import {
    useCreateTeacherRequest,
    useRequestTypes,
    useJoinRequestForm,
    getSelectOptionsSource,
    createBranchesLoader,
    createEntitiesLoader
} from '../hooks/useTeacherRequests';
import type {
    CreateTeacherRequestPayload,
    JoinRequestFormField
} from '../types/teacher-requests.types';
import {
    buildCreateRequestFormSchema,
    buildCreateRequestDefaultValues
} from '../schemas/createRequest.schema';
import { getErrorMessage } from '@/utils/helpers/errorHandler';

interface CreateRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

/** Single dynamic field from form definition (text, date, number, select with branches/entities) */
function DynamicFormField({
    field,
    control,
    setValue,
    error
}: {
    field: JoinRequestFormField;
    control: any;
    setValue: (name: string, value: unknown) => void;
    error?: string;
}) {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'ar';
    const selectSource = getSelectOptionsSource(field);
    const dependsOnFieldName =
        selectSource?.source === 'entities' ? selectSource.dependsOnField : 'request_type_id';
    const dependsOnValue = useWatch({ control, name: dependsOnFieldName });
    const branchIdForEntities =
        selectSource?.source === 'entities' ? (dependsOnValue != null && dependsOnValue !== '' ? Number(dependsOnValue) : null) : null;

    const branchesLoadOptions = useMemo(() => createBranchesLoader(currentLang), [currentLang]);
    const entitiesLoadOptions = useMemo(
        () => createEntitiesLoader(branchIdForEntities, currentLang),
        [branchIdForEntities, currentLang]
    );

    useEffect(() => {
        if (selectSource?.source === 'entities') {
            setValue(field.key, null);
        }
    }, [branchIdForEntities, field.key, setValue, selectSource?.source]);

    if (field.type === 'select' && selectSource) {
        const isDisabled = selectSource.source === 'entities' && (branchIdForEntities == null || branchIdForEntities === 0);
        const loadOptions = selectSource.source === 'branches' ? branchesLoadOptions : selectSource.source === 'entities' ? entitiesLoadOptions : undefined;
        if (!loadOptions) return null;
        return (
            <FormAsyncPaginate
                name={field.key}
                control={control}
                label={field.label}
                required={field.required}
                placeholder={t('common.select', 'Select an option')}
                error={error}
                isDisabled={isDisabled}
                loadOptions={loadOptions}
                defaultAdditional={{ page: 1 }}
            />
        );
    }

    const type = field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text';
    return (
        <FormInput
            name={field.key}
            control={control}
            type={type}
            label={field.label}
            required={field.required}
            error={error}
        />
    );
}

/** Full form (request type + dynamic fields); owns form state and only mounts when formDef is loaded */
function CreateRequestFormBody({
    formDef,
    requestTypeId,
    requestTypeOptions,
    isLoadingTypes,
    onRequestTypeChange,
    onClose,
    onSuccess
}: {
    formDef: { id: number; data: { fields: JoinRequestFormField[] } };
    requestTypeId: number;
    requestTypeOptions: { value: number; label: string }[];
    isLoadingTypes: boolean;
    onRequestTypeChange: (id: number) => void;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const { t } = useTranslation();
    const createMutation = useCreateTeacherRequest();

    const schema = useMemo(
        () => buildCreateRequestFormSchema(formDef.data.fields),
        [formDef.data.fields]
    );
    const defaultValues = useMemo(
        () => buildCreateRequestDefaultValues(requestTypeId, formDef.data.fields),
        [requestTypeId, formDef.data.fields]
    );

    const { control, handleSubmit, formState: { errors }, setValue } = useFormWithValidation({
        schema,
        defaultValues
    });

    const watchedRequestTypeId = useWatch({ control, name: 'request_type_id' });
    useEffect(() => {
        const id = typeof watchedRequestTypeId === 'number' ? watchedRequestTypeId : 0;
        if (id > 0 && id !== requestTypeId) {
            onRequestTypeChange(id);
        }
    }, [watchedRequestTypeId, requestTypeId, onRequestTypeChange]);

    const getValidationError = useCallback(
        (message?: string) =>
            message ? t(`teacherRequests.validation.${message}`, message) : undefined,
        [t]
    );

    const fields = useMemo(
        () => [...(formDef.data.fields || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        [formDef.data.fields]
    );

    const onSubmit = useCallback(
        (data: Record<string, unknown>) => {
            const request_type_id = Number(data.request_type_id);
            const submittedData: Record<string, unknown> = {};
            Object.keys(data).forEach((k) => {
                if (k === 'request_type_id') return;
                const v = data[k];
                if (v !== undefined && v !== null && v !== '') submittedData[k] = v;
            });
            const payload: CreateTeacherRequestPayload = {
                request_type_id,
                join_request_form_id: request_type_id,
                submitted_data: submittedData
            };
            createMutation.mutate(payload, {
                onSuccess: () => {
                    toast.success(t('teacherRequests.createSuccess', 'Request submitted successfully.'));
                    onSuccess();
                    onClose();
                },
                onError: (err) => toast.error(getErrorMessage(err))
            });
        },
        [createMutation, t, onSuccess, onClose]
    );

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4 space-y-4">
            <FormSelect
                name="request_type_id"
                control={control}
                label={t('teacherRequests.requestType', 'Request Type')}
                required
                options={requestTypeOptions}
                placeholder={t('common.select', 'Select an option')}
                error={getValidationError(errors.request_type_id?.message)}
                isDisabled={isLoadingTypes}
            />

            {fields.map((field) => (
                <DynamicFormField
                    key={field.key}
                    field={field}
                    control={control}
                    setValue={setValue}
                    error={getValidationError(errors[field.key]?.message)}
                />
            ))}

            <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 -mx-6 px-6 py-4 mt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={createMutation.isPending}
                >
                    {t('common.cancel')}
                </Button>
                <Button type="submit" variant="primary" loading={createMutation.isPending}>
                    {t('teacherRequests.submit', 'Submit')}
                </Button>
            </div>
        </form>
    );
}

const CreateRequestModal: React.FC<CreateRequestModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'ar';

    const [selectedRequestTypeId, setSelectedRequestTypeId] = useState<number>(0);

    const { data: requestTypesData, isLoading: isLoadingTypes } = useRequestTypes();
    const { data: formDef, isLoading: isLoadingForm } = useJoinRequestForm(
        selectedRequestTypeId > 0 ? selectedRequestTypeId : null
    );

    const requestTypes = requestTypesData?.data ?? [];
    const requestTypeOptions = useMemo(() => {
        return requestTypes.map((type) => ({
            value: type.id,
            label: getLocalizedText(type.name, currentLang, t('common.not_available', 'N/A'))
        }));
    }, [requestTypes, currentLang, t]);

    const resetForm = useCallback(() => {
        setSelectedRequestTypeId(0);
    }, []);

    const handleClose = useCallback(() => {
        resetForm();
        onClose();
    }, [resetForm, onClose]);

    const onRequestTypeChange = useCallback((id: number) => {
        setSelectedRequestTypeId(id);
    }, []);

    if (!isOpen) return null;

    const showOnlyRequestType = selectedRequestTypeId === 0;
    const showFullForm = selectedRequestTypeId > 0 && formDef && !isLoadingForm;

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
            <div className="fixed inset-0 bg-black/50" aria-hidden="true" onClick={handleClose} />
            <div className="relative flex min-h-full items-center justify-center p-4 pt-20 md:pt-24">
                <div className="relative w-full max-w-md rounded-lg bg-white shadow-xl z-10">
                    <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {t('teacherRequests.createRequest', 'Create Request')}
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

                    {showOnlyRequestType && (
                        <div className="px-6 py-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('teacherRequests.requestType', 'Request Type')}{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <ReactSelect
                                    value={selectedRequestTypeId ? selectedRequestTypeId : null}
                                    onChange={(v) => setSelectedRequestTypeId(v != null ? Number(v) : 0)}
                                    options={requestTypeOptions}
                                    placeholder={t('common.select', 'Select an option')}
                                    isDisabled={isLoadingTypes}
                                />
                            </div>
                            <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 -mx-6 px-6 py-4 mt-4">
                                <Button type="button" variant="outline" onClick={handleClose}>
                                    {t('common.cancel')}
                                </Button>
                            </div>
                        </div>
                    )}

                    {selectedRequestTypeId > 0 && isLoadingForm && (
                        <div className="px-6 py-8 text-center text-gray-500">
                            {t('common.loading', 'Loading...')}
                        </div>
                    )}

                    {showFullForm && formDef && (
                        <CreateRequestFormBody
                            key={formDef.id}
                            formDef={formDef}
                            requestTypeId={selectedRequestTypeId}
                            requestTypeOptions={requestTypeOptions}
                            isLoadingTypes={isLoadingTypes}
                            onRequestTypeChange={onRequestTypeChange}
                            onClose={handleClose}
                            onSuccess={onSuccess}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreateRequestModal;
