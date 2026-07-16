import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormWithValidation } from '@/shared/utils';
import * as yup from 'yup';
import { FormFile, Button } from '@/shared/components';
import { useSubmitJoinRequestStep } from '../hooks/useRegistration';
import { toast } from 'react-toastify';
import DynamicFormRenderer from './DynamicFormRenderer';
import { buildDynamicSchema } from '../utils/buildDynamicSchema';
import { buildDefaultValues } from '../utils/buildDefaultValues';

function appendFormValue(formData, key, value) {
    if (value === null || value === undefined || value === '') return;

    if (value instanceof File) {
        formData.append(key, value);
        return;
    }

    if (typeof FileList !== 'undefined' && value instanceof FileList) {
        Array.from(value).forEach(file => formData.append(`${key}[]`, file));
        return;
    }

    if (Array.isArray(value)) {
        value.forEach(item => {
            if (item instanceof File) formData.append(`${key}[]`, item);
            else if (item !== null && item !== undefined) appendFormValue(formData, `${key}[]`, item);
        });
        return;
    }

    if (typeof value === 'object' && !(value instanceof Date)) {
        Object.entries(value).forEach(([childKey, childValue]) => {
            appendFormValue(formData, `${key}[${childKey}]`, childValue);
        });
        return;
    }

    formData.append(key, String(value));
}

function getLocalizedText(value, language) {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    const lang = language?.startsWith('ar') ? 'ar' : 'en';
    return value[lang] ?? value.en ?? value.ar ?? '';
}

function ResubmissionStepForm({ requestId, form, onStepSubmitted }) {
    const { t, i18n } = useTranslation();
    const submitStepMutation = useSubmitJoinRequestStep();
    const fields = form?.data?.fields ?? form?.fields ?? [];
    const schema = useMemo(() => {
        let result = buildDynamicSchema(fields);
        const requiredFileFields = {};
        fields.filter(field => field.type === 'file' && field.required).forEach(field => {
            requiredFileFields[field.key] = yup.mixed().test(
                'required-file',
                t('common.required', 'This field is required'),
                value => Array.isArray(value) ? value.length > 0 : Boolean(value)
            );
        });
        if (Object.keys(requiredFileFields).length > 0) result = result.shape(requiredFileFields);
        return result;
    }, [fields, t]);
    const defaultValues = useMemo(() => buildDefaultValues(fields), [fields]);
    const { control, handleSubmit, formState: { errors }, setValue, reset } = useFormWithValidation({
        schema,
        defaultValues
    });

    useEffect(() => reset(defaultValues), [defaultValues, reset]);

    const onSubmit = values => {
        const formData = new FormData();
        Object.entries(values).forEach(([key, value]) => appendFormValue(formData, key, value));

        submitStepMutation.mutate({ joinRequestId: requestId, formData }, {
            onSuccess: () => {
                toast.success(t('auth.step_submitted', 'تم إرسال البيانات المطلوبة بنجاح'));
                reset(defaultValues);
                onStepSubmitted?.();
            },
            onError: error => toast.error(error?.message || t('auth.step_submit_error', 'تعذر إرسال البيانات المطلوبة'))
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-lg border border-amber-200 bg-amber-50/40 p-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-800">{getLocalizedText(form?.name, i18n.language) || t('auth.complete_request', 'استكمال الطلب')}</h3>
                {getLocalizedText(form?.description, i18n.language) && <p className="mt-1 text-sm text-gray-600">{getLocalizedText(form.description, i18n.language)}</p>}
            </div>
            <DynamicFormRenderer fields={fields} control={control} errors={errors} setValue={setValue} />
            {submitStepMutation.error && <p className="text-sm text-red-600">{submitStepMutation.error.message || t('auth.step_submit_error', 'تعذر إرسال البيانات المطلوبة')}</p>}
            <div className="flex justify-end">
                <Button type="submit" variant="primary" loading={submitStepMutation.isPending} disabled={submitStepMutation.isPending}>
                    {submitStepMutation.isPending ? t('common.loading', 'جارٍ الإرسال...') : t('auth.submit_documents', 'إرسال البيانات')}
                </Button>
            </div>
        </form>
    );
}
/**
 * Join Request Status Display Component
 * Displays the join request status information.
 * When current_step.step_type is "upload", shows a form to upload documents and submit the step.
 */
const JoinRequestStatusDisplay = ({ data, onStepSubmitted }) => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'ar';
    const submitStepMutation = useSubmitJoinRequestStep();
    const isUploadStep = data.current_step?.step_type === 'upload' && (data.current_step?.form_inputs?.length ?? 0) > 0;
    const formInputs = data.current_step?.form_inputs ?? [];
    const resubmissionForm = data.resubmission_form ??
        data.current_step?.resubmission_form ??
        data.current_step?.form ??
        null;
    const hasResubmissionForm = Array.isArray(resubmissionForm?.data?.fields ?? resubmissionForm?.fields) &&
        (resubmissionForm?.data?.fields ?? resubmissionForm?.fields).length > 0;
    const uploadSchema = useMemo(() => {
        const shape = {};
        formInputs.forEach((input) => {
            shape[input.key] = input.required
                ? yup.mixed().required(t('common.required', 'This field is required'))
                : yup.mixed();
        });
        return yup.object(shape);
    }, [formInputs, t]);
    const uploadDefaultValues = useMemo(() => {
        const values = {};
        formInputs.forEach((input) => {
            values[input.key] = null;
        });
        return values;
    }, [formInputs]);
    const { control, handleSubmit, formState: { errors }, reset } = useFormWithValidation({
        schema: uploadSchema,
        defaultValues: uploadDefaultValues
    });
    const getBilingualText = (obj) => {
        if (obj == null)
            return '';
        if (typeof obj === 'string')
            return obj;
        const lang = currentLang?.startsWith('ar') ? 'ar' : 'en';
        const value = obj[lang] ?? obj.en ?? obj.ar ?? '';
        return typeof value === 'string' ? value : '';
    };
    const onSubmitUploadStep = (values) => {
        const formDataToSend = new FormData();
        formInputs.forEach((input) => {
            const value = values[input.key];
            if (value == null)
                return;
            if (value instanceof File) {
                formDataToSend.append(input.key, value);
            }
            else if (Array.isArray(value)) {
                value.forEach((file) => file && formDataToSend.append(`${input.key}[]`, file));
            }
        });
        submitStepMutation.mutate({ joinRequestId: data.id, formData: formDataToSend }, {
            onSuccess: () => {
                toast.success(t('auth.step_submitted', 'Documents submitted successfully'));
                reset(uploadDefaultValues);
                onStepSubmitted?.();
            },
            onError: (error) => {
                toast.error(error?.message || t('auth.step_submit_error', 'Error submitting documents'));
            }
        });
    };
    const getStatusBadge = (status) => {
        switch (status) {
            case 0:
                return <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">{t('status.pending', 'Pending')}</span>;
            case 1:
                return <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">{t('status.approved', 'Approved')}</span>;
            case 2:
                return <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">{t('status.rejected', 'Rejected')}</span>;
            case 3:
                return <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">{t('status.need_review', 'Need review')}</span>;
            case 4:
                return <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">{t('status.need_upload', 'Need upload')}</span>;
            default:
                return <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">{t('status.unknown', 'Unknown')}</span>;
        }
    };
    return (<div className="space-y-6">
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
            {data.current_step && (<div className="bg-white border border-gray-200 rounded-lg p-6">
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
                                {t('status.order', 'Order')}
                            </p>
                            <p className="text-gray-900">{data.current_step.order}</p>
                        </div>
                    </div>

                    {/* Upload step form: when step_type is "upload", render form from form_inputs */}
                    {isUploadStep && !hasResubmissionForm && (<form onSubmit={handleSubmit(onSubmitUploadStep)} className="mt-6 pt-6 border-t border-gray-200 space-y-4">
                            <h4 className="text-md font-medium text-gray-800 mb-3">
                                {t('auth.upload_documents', 'Upload Documents')}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {formInputs.map((input) => (input.type === 'file' && (<FormFile key={input.key} name={input.key} control={control} label={getBilingualText(input.label)} required={input.required} error={errors[input.key]?.message}/>)))}
                            </div>
                            {submitStepMutation.error && (<p className="text-sm text-red-600">
                                    {submitStepMutation.error?.message || t('auth.step_submit_error', 'Error submitting documents')}
                                </p>)}
                            <div className="flex justify-end">
                                <Button type="submit" variant="primary" loading={submitStepMutation.isPending} disabled={submitStepMutation.isPending}>
                                    {submitStepMutation.isPending ? t('common.loading', 'Loading...') : t('auth.submit_documents', 'Submit Documents')}
                                </Button>
                            </div>
                        </form>)}
                </div>)}

            {hasResubmissionForm && (
                <ResubmissionStepForm
                    requestId={data.id}
                    form={resubmissionForm}
                    onStepSubmitted={onStepSubmitted}
                />
            )}

            {/* Request History (submitted_logs) */}
            {data.submitted_logs && data.submitted_logs.length > 0 && (<div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        {t('status.request_history', 'Request History')}
                    </h3>
                    <div className="space-y-4">
                        {data.submitted_logs.map((log, index) => (<div key={index} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-800 mb-1">
                                            {getBilingualText(log.step_name)}
                                        </h4>
                                        <p className="text-sm text-gray-600">Step ID: {log.step_id}</p>
                                    </div>
                                    {getStatusBadge(log.status)}
                                </div>
                                {log.notes && (<div className="mt-3 pt-3 border-t border-gray-200">
                                        <p className="text-sm font-medium text-gray-700 mb-1">
                                            {t('status.notes', 'Notes')}
                                        </p>
                                        <p className="text-gray-900 text-sm">{log.notes}</p>
                                    </div>)}
                                {log.files && log.files.length > 0 && (<div className="mt-3 pt-3 border-t border-gray-200">
                                        <p className="text-sm font-medium text-gray-700 mb-2">
                                            {t('status.files', 'Files')}
                                        </p>
                                        <div className="space-y-1">
                                            {log.files.map((file, fileIndex) => {
                        const url = typeof file === 'string' ? file : file?.url;
                        const name = typeof file === 'object' && file?.name ? file.name : `File ${fileIndex + 1}`;
                        return (<p key={fileIndex} className="text-sm">
                                                        {url ? (<a href={url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                                                                {name}
                                                            </a>) : (<span className="text-gray-600">{name}</span>)}
                                                    </p>);
                    })}
                                        </div>
                                    </div>)}
                            </div>))}
                    </div>
                </div>)}
        </div>);
};
export default JoinRequestStatusDisplay;
