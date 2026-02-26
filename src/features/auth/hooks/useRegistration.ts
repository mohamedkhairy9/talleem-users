import { useQuery, useMutation } from '@tanstack/react-query';
import { registrationService } from '../services/registration.service';
import { UserRoleType } from '../types/registration.types';

/**
 * Hook to fetch join request form structure
 */
export const useJoinRequestForm = (userType: UserRoleType | null) => {
    return useQuery({
        queryKey: ['joinRequestForm', userType],
        queryFn: () => registrationService.getJoinRequestForm(userType!),
        enabled: !!userType
    });
};

/**
 * Hook to submit join request
 */
export const useSubmitJoinRequest = () => {
    return useMutation({
        mutationFn: ({ userType, data }: { userType: UserRoleType; data: FormData }) =>
            registrationService.submitJoinRequest(userType, data)
    });
};

/**
 * Hook to check join request status
 */
export const useCheckJoinRequestStatus = () => {
    return useMutation({
        mutationFn: (data: { email?: string; national_id?: string }) =>
            registrationService.checkJoinRequestStatus(data)
    });
};

/**
 * Hook to submit a join request step (e.g. upload step)
 */
export const useSubmitJoinRequestStep = () => {
    return useMutation({
        mutationFn: ({ joinRequestId, formData }: { joinRequestId: number; formData: FormData }) =>
            registrationService.submitJoinRequestStep(joinRequestId, formData)
    });
};


