import React from 'react';
import { useFormWithValidation } from '@/utils';
import { useJoinRequestForm, useSubmitJoinRequest } from '../hooks/useRegistration';
import { UserRoleType } from '../types/registration.types';
import { buildDynamicSchema } from '../utils/buildDynamicSchema';
import { buildDefaultValues } from '../utils/buildDefaultValues';
import DynamicFormRenderer from './DynamicFormRenderer';
import { Button } from '@/globals/components';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface RegistrationFormProps {
    userType: UserRoleType;
    onBack: () => void;
}

/**
 * Registration Form Component
 * Renders dynamic form based on API response
 */
const RegistrationForm: React.FC<RegistrationFormProps> = ({ userType, onBack }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { data: formData, isLoading: isLoadingForm, error: formError } = useJoinRequestForm(userType);
    const submitMutation = useSubmitJoinRequest();

    // Build schema and default values from form structure
    const schema = React.useMemo(() => {
        if (!formData?.data?.fields) return undefined;
        return buildDynamicSchema(formData.data.fields);
    }, [formData]);

    const defaultValues = React.useMemo(() => {
        if (!formData?.data?.fields) return {};
        return buildDefaultValues(formData.data.fields);
    }, [formData]);

    const {
        control,
        handleSubmit,
        formState: { errors }
    } = useFormWithValidation({
        schema,
        defaultValues
    });

    const onSubmit = async (data: any) => {
        if (!formData) return;

        // Convert form data to FormData for file uploads
        const formDataToSend = new FormData();

        // Add join_request_form_id (userType/role id)
        formDataToSend.append('join_request_form_id', userType.toString());

        // Add request_type_id (id from API response)
        formDataToSend.append('request_type_id', formData.id.toString());

        // Process form fields and add them under submitted_data
        const processField = (value: any, fieldKey: string) => {
            if (value === null || value === undefined || value === '') return;

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
                    } else if (item !== null && item !== undefined) {
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

        submitMutation.mutate(
            { userType, data: formDataToSend },
            {
                onSuccess: () => {
                    // Redirect to login or show success message
                    const currentLang = window.location.pathname.split('/')[1] || 'en';
                    navigate(`/${currentLang}/login`);
                }
            }
        );
    };

    if (isLoadingForm) {
        return (
            <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="mt-4 text-gray-600">{t('common.loading', 'Loading form...')}</p>
            </div>
        );
    }

    if (formError || !formData?.data?.fields) {
        return (
            <div className="text-center py-8">
                <p className="text-red-600 mb-4">
                    {t('auth.form_load_error', 'Error loading registration form. Please try again.')}
                </p>
                <Button variant="primary" onClick={onBack}>
                    {t('common.back', 'Back')}
                </Button>
            </div>
        );
    }

    const onSubmitWithError = (data: any) => {
        console.log('Form submitted successfully:', data);
        onSubmit(data);
    };

    const onError = (errors: any) => {
        console.log('Form validation errors:', errors);
    };

    return (
        <div className="relative min-h-[calc(100vh-200px)] pb-24">
            <form id="registration-form" onSubmit={handleSubmit(onSubmitWithError, onError)} className="space-y-6">
                {/* Display validation errors summary */}
                {Object.keys(errors).length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <p className="text-red-800 font-medium mb-2">
                            {t('auth.validation_errors', 'Please fix the following errors:')}
                        </p>
                        <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                            {Object.entries(errors).map(([key, error]: [string, any]) => {
                                if (error?.message) {
                                    return <li key={key}>{key}: {error.message}</li>;
                                }
                                // Handle nested errors (groups, objects)
                                if (typeof error === 'object' && error !== null) {
                                    const nestedErrors: string[] = [];
                                    if (error.ar?.message) nestedErrors.push(`Arabic: ${error.ar.message}`);
                                    if (error.en?.message) nestedErrors.push(`English: ${error.en.message}`);
                                    if (nestedErrors.length > 0) {
                                        return <li key={key}>{key}: {nestedErrors.join(', ')}</li>;
                                    }
                                    // Handle group errors
                                    Object.entries(error).forEach(([subKey, subError]: [string, any]) => {
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
                    </div>
                )}
                
                <DynamicFormRenderer fields={formData.data.fields} control={control} errors={errors} />

                {submitMutation.error && (
                    <div className="text-red-600 text-sm mt-4">
                        {(submitMutation.error as any).message || t('auth.registration_error', 'Error submitting registration. Please try again.')}
                    </div>
                )}
            </form>

            {/* Sticky submit buttons */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 z-10 shadow-lg">
                <div className="max-w-5xl mx-auto flex gap-4 justify-end">
                    <Button type="button" variant="secondary" onClick={onBack} disabled={submitMutation.isPending}>
                        {t('common.back', 'Back')}
                    </Button>
                    <Button 
                        type="submit" 
                        variant="primary" 
                        loading={submitMutation.isPending} 
                        disabled={submitMutation.isPending}
                        form="registration-form"
                    >
                        {submitMutation.isPending ? t('common.loading', 'Loading...') : t('auth.submit_registration', 'Submit Registration')}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default RegistrationForm;


