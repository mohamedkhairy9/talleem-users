import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormWithValidation } from '@/utils';
import { useCheckJoinRequestStatus } from '../hooks/useRegistration';
import * as yup from 'yup';
import { FormInput } from '@/globals/components';
import { Button } from '@/globals/components';
import { toast } from 'react-toastify';
import JoinRequestStatusDisplay from './JoinRequestStatusDisplay';

interface JoinRequestStatusFormProps {
    onBack: () => void;
}

/**
 * Schema for join request status check
 * Validates that input is provided
 */
const statusCheckSchema = yup.object({
    input: yup
        .string()
        .required('Email or phone number is required')
        .min(3, 'Please enter a valid email or phone number')
});

interface StatusCheckFormData {
    input: string;
}

/**
 * Join Request Status Form Component
 * Allows users to check their join request status by email or phone number
 */
const JoinRequestStatusForm: React.FC<JoinRequestStatusFormProps> = ({ onBack }) => {
    const { t } = useTranslation();
    const statusMutation = useCheckJoinRequestStatus();
    const [statusData, setStatusData] = useState<any>(null);

    const {
        control,
        handleSubmit,
        formState: { errors },
        reset
    } = useFormWithValidation<StatusCheckFormData>({
        schema: statusCheckSchema,
        defaultValues: {
            input: ''
        }
    });

    // Helper function to detect if input is email or phone/national_id
    const detectInputType = (input: string): { email?: string; national_id?: string } => {
        // Check if it's an email (contains @)
        if (input.includes('@')) {
            return { email: input };
        }
        // Otherwise treat as phone/national_id
        return { national_id: input };
    };

    const onSubmit = async (data: StatusCheckFormData) => {
        const requestData = detectInputType(data.input.trim());
        
        statusMutation.mutate(requestData, {
            onSuccess: (response) => {
                // Store the status data to display
                setStatusData(response.data || response);
                toast.success(t('auth.status_check_success', 'Status retrieved successfully'));
            },
            onError: (error: any) => {
                // Handle error
                const errorMessage = error.message || t('auth.status_check_error', 'Error checking status. Please try again.');
                toast.error(errorMessage);
                setStatusData(null);
            }
        });
    };

    const handleCheckAgain = () => {
        setStatusData(null);
        reset();
    };

    // If status data is available, show it
    if (statusData) {
        return (
            <div className="space-y-6">
                <JoinRequestStatusDisplay data={statusData} />
                
                {/* Action buttons */}
                <div className="flex gap-4 justify-end pt-4 border-t border-gray-200">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onBack}
                    >
                        {t('common.back', 'Back')}
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        onClick={handleCheckAgain}
                    >
                        {t('auth.check_again', 'Check Another Request')}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                    <p className="text-sm text-gray-600 mb-4">
                        {t('auth.status_check_description', 'Enter your email address or phone number to check the status of your join request.')}
                    </p>
                    
                    <FormInput
                        name="input"
                        control={control}
                        label={t('auth.email_or_phone', 'Email or Phone Number')}
                        type="text"
                        required
                        error={errors.input?.message}
                        placeholder={t('auth.email_or_phone_placeholder', 'Enter email or phone number')}
                    />
                </div>

                {/* Error message */}
                {statusMutation.error && (
                    <div className="text-red-600 text-sm">
                        {(statusMutation.error as any).message || t('auth.status_check_error', 'Error checking status. Please try again.')}
                    </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-4 justify-end pt-4">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onBack}
                        disabled={statusMutation.isPending}
                    >
                        {t('common.back', 'Back')}
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        loading={statusMutation.isPending}
                        disabled={statusMutation.isPending}
                    >
                        {statusMutation.isPending
                            ? t('common.loading', 'Loading...')
                            : t('auth.check_status', 'Check Status')}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default JoinRequestStatusForm;

