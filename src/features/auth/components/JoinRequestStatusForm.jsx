import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormWithValidation } from '@/shared/utils';
import { useCheckJoinRequestStatus } from '../hooks/useRegistration';
import * as yup from 'yup';
import { FormInput } from '@/shared/components';
import { Button } from '@/shared/components';
import { toast } from 'react-toastify';
import JoinRequestStatusDisplay from './JoinRequestStatusDisplay';
import { ROUTE_PATHS } from '@/config';
/**
 * Schema for join request status check — request ID (number) only
 */
const statusCheckSchema = yup.object({
    input: yup
        .string()
        .required('Request number is required')
        .test('is-request-id', 'Please enter a valid request number', (value) => {
        if (!value?.trim())
            return false;
        const n = parseInt(value.trim(), 10);
        return !Number.isNaN(n) && n >= 1 && Number.isInteger(n);
    })
});
/**
 * Join Request Status Form Component
 * Allows users to check their join request status by request number (ID)
 */
const JoinRequestStatusForm = ({ onBack }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { lang } = useParams();
    const currentLang = lang || 'ar';
    const statusMutation = useCheckJoinRequestStatus();
    const [statusData, setStatusData] = useState(null);
    const [lastRequestId, setLastRequestId] = useState(null);
    const { control, handleSubmit, formState: { errors }, reset } = useFormWithValidation({
        schema: statusCheckSchema,
        defaultValues: {
            input: ''
        }
    });
    /** Unwrap API response: backend may return { data: { id, request_type, ... } } */
    const unwrapStatusData = (response) => {
        const body = response?.data ?? response;
        return body?.data ?? body;
    };
    const refetchStatus = () => {
        if (lastRequestId == null)
            return;
        statusMutation.mutate({ request_number: lastRequestId }, {
            onSuccess: (response) => {
                setStatusData(unwrapStatusData(response));
            }
        });
    };
    const onSubmit = async (data) => {
        const input = data.input.trim();
        const requestId = parseInt(input, 10);
        if (Number.isNaN(requestId) || requestId < 1)
            return;
        setLastRequestId(requestId);
        statusMutation.mutate({ request_number: requestId }, {
            onSuccess: (response) => {
                setStatusData(unwrapStatusData(response));
                toast.success(t('auth.status_check_success', 'Status retrieved successfully'));
            },
            onError: (error) => {
                const errorMessage = error.message || t('auth.status_check_error', 'Error checking status. Please try again.');
                toast.error(errorMessage);
                setStatusData(null);
            }
        });
    };
    const handleCheckAgain = () => {
        setStatusData(null);
        setLastRequestId(null);
        reset();
    };
    // If status data is available, show it
    if (statusData) {
        return (<div className="space-y-6">
                <JoinRequestStatusDisplay data={statusData} onStepSubmitted={refetchStatus}/>
                
                {/* Action buttons */}
                <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
                    <div className="flex gap-4 justify-end">
                        <Button type="button" variant="secondary" onClick={onBack}>
                            {t('common.back', 'Back')}
                        </Button>
                        <Button type="button" variant="primary" onClick={handleCheckAgain}>
                            {t('auth.check_again', 'Check Another Request')}
                        </Button>
                    </div>
                    <div className="text-center">
                        <button type="button" onClick={() => navigate(`/${currentLang}/${ROUTE_PATHS.LOGIN}`)} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                            {t('auth.back_to_login', 'Back to login')}
                        </button>
                    </div>
                </div>
            </div>);
    }
    return (<div className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                    <p className="text-sm text-gray-600 mb-4">
                        {t('auth.status_check_description_request_id', 'Enter your request number to check the status of your join request.')}
                    </p>
                    
                    <FormInput name="input" control={control} label={t('auth.request_number', 'Request number')} type="text" inputMode="numeric" required error={errors.input?.message} placeholder={t('auth.request_number_placeholder', 'Enter your request number')}/>
                </div>

                {/* Error message */}
                {statusMutation.error && (<div className="text-red-600 text-sm">
                        {statusMutation.error.message || t('auth.status_check_error', 'Error checking status. Please try again.')}
                    </div>)}

                {/* Action buttons */}
                <div className="flex flex-col gap-3 pt-4">
                    <div className="flex gap-4 justify-end">
                        <Button type="button" variant="secondary" onClick={onBack} disabled={statusMutation.isPending}>
                            {t('common.back', 'Back')}
                        </Button>
                        <Button type="submit" variant="primary" loading={statusMutation.isPending} disabled={statusMutation.isPending}>
                            {statusMutation.isPending
            ? t('common.loading', 'Loading...')
            : t('auth.check_status', 'Check Status')}
                        </Button>
                    </div>
                    <div className="text-center">
                        <button type="button" onClick={() => navigate(`/${currentLang}/${ROUTE_PATHS.LOGIN}`)} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                            {t('auth.back_to_login', 'Back to login')}
                        </button>
                    </div>
                </div>
            </form>
        </div>);
};
export default JoinRequestStatusForm;
