import React from 'react';
import { useFormWithValidation } from '@/utils';
import { useJoinRequestForm, useSubmitJoinRequest } from '../hooks/useRegistration';
import { buildDynamicSchema } from '../utils/buildDynamicSchema';
import { buildDefaultValues } from '../utils/buildDefaultValues';
import DynamicFormRenderer from './DynamicFormRenderer';
import { Button } from '@/globals/components';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ROUTE_PATHS } from '@/config';
/**
 * Registration Form Component
 * Renders dynamic form based on API response
 */
const RegistrationForm = ({ userType, onBack }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { lang } = useParams();
    const currentLang = lang || 'ar';
    const { data: formData, isLoading: isLoadingForm, error: formError } = useJoinRequestForm(userType);
    const submitMutation = useSubmitJoinRequest();
    /** After successful submit, show request number so user can check status later */
    const [submittedRequestId, setSubmittedRequestId] = React.useState(null);
    // Build schema and default values from form structure
    const schema = React.useMemo(() => {
        if (!formData?.data?.fields)
            return undefined;
        return buildDynamicSchema(formData.data.fields);
    }, [formData]);
    const defaultValues = React.useMemo(() => {
        if (!formData?.data?.fields)
            return {};
        return buildDefaultValues(formData.data.fields);
    }, [formData]);
    const { control, handleSubmit, formState: { errors }, setValue } = useFormWithValidation({
        schema,
        defaultValues
    });
    // Visibility (visible_when) and dependencies (depends_on, clear when dependency changes) are
    // handled in DynamicFormRenderer for both teacher and entity manager forms.
    const onSubmit = async (data) => {
        if (!formData)
            return;
        // Convert form data to FormData for file uploads
        const formDataToSend = new FormData();
        // Add join_request_form_id (userType/role id)
        formDataToSend.append('join_request_form_id', userType.toString());
        // Add request_type_id (id from API response)
        formDataToSend.append('request_type_id', formData.id.toString());
        // Process form fields and add them under submitted_data
        const processField = (value, fieldKey) => {
            if (value === null || value === undefined || value === '')
                return;
            // Handle File objects
            if (value instanceof File) {
                formDataToSend.append(`submitted_data[${fieldKey}]`, value);
                return;
            }
            // Handle FileList (multiple files)
            if (value instanceof FileList) {
                Array.from(value).forEach((file) => {
                    formDataToSend.append(`submitted_data[${fieldKey}][]`, file);
                });
                return;
            }
            // Handle arrays (e.g., multiple select)
            if (Array.isArray(value)) {
                value.forEach((item) => {
                    if (item instanceof File) {
                        formDataToSend.append(`submitted_data[${fieldKey}][]`, item);
                    }
                    else if (item !== null && item !== undefined) {
                        formDataToSend.append(`submitted_data[${fieldKey}][]`, item.toString());
                    }
                });
                return;
            }
            // Handle objects (bilingual fields like name.en, name.ar)
            if (typeof value === 'object' && !(value instanceof Date)) {
                Object.keys(value).forEach((subKey) => {
                    const subValue = value[subKey];
                    if (subValue !== null && subValue !== undefined && subValue !== '') {
                        formDataToSend.append(`submitted_data[${fieldKey}][${subKey}]`, subValue.toString());
                    }
                });
                return;
            }
            // Handle dates
            if (value instanceof Date) {
                formDataToSend.append(`submitted_data[${fieldKey}]`, value.toISOString().split('T')[0]);
                return;
            }
            // Handle primitive values (string, number, boolean)
            formDataToSend.append(`submitted_data[${fieldKey}]`, value.toString());
        };
        // Process all form fields
        Object.keys(data).forEach((key) => {
            processField(data[key], key);
        });
        submitMutation.mutate({ userType, data: formDataToSend }, {
            onSuccess: (response) => {
                const body = response?.data ?? response;
                const requestId = body?.id != null ? Number(body.id) : null;
                if (requestId != null && !Number.isNaN(requestId)) {
                    setSubmittedRequestId(requestId);
                }
                else {
                    const currentLang = window.location.pathname.split('/')[1] || 'ar';
                    navigate(`/${currentLang}/login`);
                }
            }
        });
    };
    // Success: show request number and remind user to keep it for status check
    if (submittedRequestId != null) {
        return (<div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                    <p className="text-green-800 font-semibold text-lg mb-2">
                        {t('auth.registration_success', 'Registration submitted successfully')}
                    </p>
                    <p className="text-gray-700 mb-4">
                        {t('auth.request_number_label', 'Your request number is')}
                    </p>
                    <p className="text-2xl font-bold text-primary-700 mb-4" data-testid="submitted-request-id">
                        {submittedRequestId}
                    </p>
                    <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 max-w-md mx-auto">
                        {t('auth.keep_request_number', 'Please keep this request number. You will need it to check your request status.')}
                    </p>
                </div>
                <div className="flex flex-col gap-3">
                    <Button variant="primary" onClick={() => navigate(`/${currentLang}/login`)}>
                        {t('auth.back_to_login', 'Back to login')}
                    </Button>
                    <button type="button" onClick={() => navigate(`/${currentLang}/register?checkStatus=1`)} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                        {t('auth.check_join_request_status', 'Check join request status')}
                    </button>
                </div>
            </div>);
    }
    if (isLoadingForm) {
        return (<div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="mt-4 text-gray-600">{t('common.loading', 'Loading form...')}</p>
            </div>);
    }
    if (formError || !formData?.data?.fields) {
        return (<div className="text-center py-8">
                <p className="text-red-600 mb-4">
                    {t('auth.form_load_error', 'Error loading registration form. Please try again.')}
                </p>
                <Button variant="primary" onClick={onBack}>
                    {t('common.back', 'Back')}
                </Button>
            </div>);
    }
    const onSubmitWithError = (data) => {
        console.log('Form submitted successfully:', data);
        onSubmit(data);
    };
    const onError = (errors) => {
        console.log('Form validation errors:', errors);
    };
    return (<div className="relative min-h-[calc(100vh-200px)] pb-24">
            <form id="registration-form" onSubmit={handleSubmit(onSubmitWithError, onError)} className="space-y-6">
                {/* Display validation errors summary */}
                {Object.keys(errors).length > 0 && (<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <p className="text-red-800 font-medium mb-2">
                            {t('auth.validation_errors', 'Please fix the following errors:')}
                        </p>
                        <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                            {Object.entries(errors).map(([key, error]) => {
                if (error?.message) {
                    return <li key={key}>{key}: {error.message}</li>;
                }
                // Handle nested errors (groups, objects)
                if (typeof error === 'object' && error !== null) {
                    const nestedErrors = [];
                    if (error.ar?.message)
                        nestedErrors.push(`Arabic: ${error.ar.message}`);
                    if (error.en?.message)
                        nestedErrors.push(`English: ${error.en.message}`);
                    if (nestedErrors.length > 0) {
                        return <li key={key}>{key}: {nestedErrors.join(', ')}</li>;
                    }
                    // Handle group errors
                    Object.entries(error).forEach(([subKey, subError]) => {
                        if (subError?.message) {
                            nestedErrors.push(`${subKey}: ${subError.message}`);
                        }
                    });
                    if (nestedErrors.length > 0) {
                        return <li key={key}>{key}: {nestedErrors.join(', ')}</li>;
                    }
                }
                return <li key={key}>{key}: {JSON.stringify(error)}</li>;
            })}
                        </ul>
                    </div>)}
                
                <DynamicFormRenderer fields={formData.data.fields} control={control} errors={errors} setValue={setValue} joinRequestRole={userType}/>

                {submitMutation.error && (<div className="text-red-600 text-sm mt-4">
                        {submitMutation.error.message || t('auth.registration_error', 'Error submitting registration. Please try again.')}
                    </div>)}
            </form>

            {/* Sticky submit buttons */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 z-10 shadow-lg">
                <div className="max-w-7xl mx-auto flex flex-col gap-3">
                    <div className="flex gap-4 justify-end">
                        <Button type="button" variant="secondary" onClick={onBack} disabled={submitMutation.isPending}>
                            {t('common.back', 'Back')}
                        </Button>
                        <Button type="submit" variant="primary" loading={submitMutation.isPending} disabled={submitMutation.isPending} form="registration-form">
                            {submitMutation.isPending ? t('common.loading', 'Loading...') : t('auth.submit_registration', 'Submit Registration')}
                        </Button>
                    </div>
                    <div className="text-center">
                        <button type="button" onClick={() => navigate(`/${currentLang}/${ROUTE_PATHS.LOGIN}`)} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                            {t('auth.back_to_login', 'Back to login')}
                        </button>
                    </div>
                </div>
            </div>
        </div>);
};
export default RegistrationForm;
