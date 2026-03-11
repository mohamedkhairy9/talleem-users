import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormWithValidation } from '@/utils';
import * as yup from 'yup';
import { FormFile, Button } from '@/globals/components';
import { useSubmitJoinRequestStep } from '../hooks/useRegistration';
import { toast } from 'react-toastify';

export interface FormInputDefinition {
    key: string;
    type: string;
    label: string | BilingualText;
    required?: boolean;
}

/** Helper type for API fields that can be a plain string or bilingual { en, ar } */
export type BilingualText = string | { en?: string; ar?: string };

interface JoinRequestStatusData {
    id: number;
    request_type: BilingualText;
    status: number;
    current_phase: BilingualText;
    current_step: {
        id: number;
        name: BilingualText;
        order: number;
        step_type: string;
        assigned_to_type: string;
        assigned_to_id: number;
        form_inputs?: FormInputDefinition[];
    };
    submitted_logs: Array<{
        step_id: number;
        step_name: BilingualText;
        status: number;
        notes: string | null;
        form_data?: Record<string, unknown>;
        files?: string[] | Array<{ name?: string; url?: string }>;
    }>;
}

interface JoinRequestStatusDisplayProps {
    data: JoinRequestStatusData;
    onStepSubmitted?: () => void;
}

/**
 * Join Request Status Display Component
 * Displays the join request status information.
 * When current_step.step_type is "upload", shows a form to upload documents and submit the step.
 */
const JoinRequestStatusDisplay: React.FC<JoinRequestStatusDisplayProps> = ({ data, onStepSubmitted }) => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'ar';
    const submitStepMutation = useSubmitJoinRequestStep();

    const isUploadStep = data.current_step?.step_type === 'upload' && (data.current_step?.form_inputs?.length ?? 0) > 0;
    const formInputs = data.current_step?.form_inputs ?? [];

    const uploadSchema = useMemo(() => {
        const shape: Record<string, yup.AnySchema> = {};
        formInputs.forEach((input) => {
            shape[input.key] = input.required
                ? yup.mixed().required(t('common.required', 'This field is required'))
                : yup.mixed();
        });
        return yup.object(shape);
    }, [formInputs, t]);

    const uploadDefaultValues = useMemo(() => {
        const values: Record<string, null> = {};
        formInputs.forEach((input) => {
            values[input.key] = null;
        });
        return values;
    }, [formInputs]);

    const {
        control,
        handleSubmit,
        formState: { errors },
        reset
    } = useFormWithValidation({
        schema: uploadSchema,
        defaultValues: uploadDefaultValues
    });

    const getBilingualText = (obj: BilingualText | null | undefined): string => {
        if (obj == null) return '';
        if (typeof obj === 'string') return obj;
        const lang = currentLang?.startsWith('ar') ? 'ar' : 'en';
        const value = obj[lang] ?? obj.en ?? obj.ar ?? '';
        return typeof value === 'string' ? value : '';
    };

    const onSubmitUploadStep = (values: Record<string, File | File[] | null>) => {
        const formDataToSend = new FormData();
        formInputs.forEach((input) => {
            const value = values[input.key];
            if (value == null) return;
            if (value instanceof File) {
                formDataToSend.append(input.key, value);
            } else if (Array.isArray(value)) {
                value.forEach((file) => file && formDataToSend.append(`${input.key}[]`, file));
            }
        });

        submitStepMutation.mutate(
            { joinRequestId: data.id, formData: formDataToSend },
            {
                onSuccess: () => {
                    toast.success(t('auth.step_submitted', 'Documents submitted successfully'));
                    reset(uploadDefaultValues);
                    onStepSubmitted?.();
                },
                onError: (error: any) => {
                    toast.error(error?.message || t('auth.step_submit_error', 'Error submitting documents'));
                }
            }
        );
    };

    const getStatusBadge = (status: number) => {
        switch (status) {
            case 0:
                return <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">{t('status.pending', 'Pending')}</span>;
            case 1:
                return <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">{t('status.approved', 'Approved')}</span>;
            case 2:
                return <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">{t('status.rejected', 'Rejected')}</span>;
            default:
                return <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">{t('status.unknown', 'Unknown')}</span>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            {t('status.request_info', 'Request Information')}
                        </h3>
                        <p className="text-sm text-gray-600">ID: {data.id}</p>
                    </div>
                    {getStatusBadge(data.status)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">
                            {t('status.request_type', 'Request Type')}
                        </p>
                        <p className="text-gray-900">{getBilingualText(data.request_type)}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">
                            {t('status.current_phase', 'Current Phase')}
                        </p>
                        <p className="text-gray-900">{getBilingualText(data.current_phase)}</p>
                    </div>
                </div>
            </div>

            {/* Current Step */}
            {data.current_step && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        {t('status.current_step', 'Current Step')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">
                                {t('status.step_name', 'Step Name')}
                            </p>
                            <p className="text-gray-900">{getBilingualText(data.current_step.name)}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">
                                {t('status.step_type', 'Step Type')}
                            </p>
                            <p className="text-gray-900 capitalize">{data.current_step.step_type}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">
                                {t('status.order', 'Order')}
                            </p>
                            <p className="text-gray-900">{data.current_step.order}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">
                                {t('status.assigned_to', 'Assigned To')}
                            </p>
                            <p className="text-gray-900 capitalize">
                                {data.current_step.assigned_to_type} ({data.current_step.assigned_to_id})
                            </p>
                        </div>
                    </div>

                    {/* Upload step form: when step_type is "upload", render form from form_inputs */}
                    {isUploadStep && (
                        <form onSubmit={handleSubmit(onSubmitUploadStep)} className="mt-6 pt-6 border-t border-gray-200 space-y-4">
                            <h4 className="text-md font-medium text-gray-800 mb-3">
                                {t('auth.upload_documents', 'Upload Documents')}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {formInputs.map((input) => (
                                    input.type === 'file' && (
                                        <FormFile
                                            key={input.key}
                                            name={input.key}
                                            control={control}
                                            label={getBilingualText(input.label)}
                                            required={input.required}
                                            error={errors[input.key]?.message as string}
                                        />
                                    )
                                ))}
                            </div>
                            {submitStepMutation.error && (
                                <p className="text-sm text-red-600">
                                    {(submitStepMutation.error as any)?.message || t('auth.step_submit_error', 'Error submitting documents')}
                                </p>
                            )}
                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    loading={submitStepMutation.isPending}
                                    disabled={submitStepMutation.isPending}
                                >
                                    {submitStepMutation.isPending ? t('common.loading', 'Loading...') : t('auth.submit_documents', 'Submit Documents')}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {/* Request History (submitted_logs) */}
            {data.submitted_logs && data.submitted_logs.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        {t('status.request_history', 'Request History')}
                    </h3>
                    <div className="space-y-4">
                        {data.submitted_logs.map((log, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-800 mb-1">
                                            {getBilingualText(log.step_name)}
                                        </h4>
                                        <p className="text-sm text-gray-600">Step ID: {log.step_id}</p>
                                    </div>
                                    {getStatusBadge(log.status)}
                                </div>
                                {log.notes && (
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                        <p className="text-sm font-medium text-gray-700 mb-1">
                                            {t('status.notes', 'Notes')}
                                        </p>
                                        <p className="text-gray-900 text-sm">{log.notes}</p>
                                    </div>
                                )}
                                {log.files && log.files.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                        <p className="text-sm font-medium text-gray-700 mb-2">
                                            {t('status.files', 'Files')}
                                        </p>
                                        <div className="space-y-1">
                                            {log.files.map((file: string | { name?: string; url?: string }, fileIndex: number) => {
                                                const url = typeof file === 'string' ? file : file?.url;
                                                const name = typeof file === 'object' && file?.name ? file.name : `File ${fileIndex + 1}`;
                                                return (
                                                    <p key={fileIndex} className="text-sm">
                                                        {url ? (
                                                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                                                                {name}
                                                            </a>
                                                        ) : (
                                                            <span className="text-gray-600">{name}</span>
                                                        )}
                                                    </p>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default JoinRequestStatusDisplay;





