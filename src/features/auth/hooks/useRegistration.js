import { useQuery, useMutation } from '@tanstack/react-query';
import { registrationService } from '../services/registration.service';
import { mapMainProgramSelectionToProgramParam } from '../utils/mainProgramProgramParam';
/**
 * Hook to fetch join request form structure
 */
export const useJoinRequestForm = (userType) => {
    return useQuery({
        queryKey: ['joinRequestForm', userType],
        queryFn: () => registrationService.getJoinRequestForm(userType),
        enabled: !!userType
    });
};
/**
 * Hook to submit join request
 */
export const useSubmitJoinRequest = () => {
    return useMutation({
        mutationFn: ({ userType, data }) => registrationService.submitJoinRequest(userType, data)
    });
};
/**
 * Hook to check join request status by request ID
 */
export const useCheckJoinRequestStatus = () => {
    return useMutation({
        mutationFn: (data) => registrationService.checkJoinRequestStatus(data)
    });
};
/**
 * Hook to submit a join request step (e.g. upload step)
 */
export const useSubmitJoinRequestStep = () => {
    return useMutation({
        mutationFn: ({ joinRequestId, formData }) => registrationService.submitJoinRequestStep(joinRequestId, formData)
    });
};
/**
 * Supporting-files hint for registration join forms: loads suggested document names from the API
 * when role (teacher / entity) and main program are known.
 */
export function useRequiredDocumentsHint(joinRequestRole, mainProgramId) {
    const type = joinRequestRole === 1 ? 'teacher' : joinRequestRole === 3 ? 'entity' : null;
    return useQuery({
        queryKey: ['requiredDocuments', type, mainProgramId],
        queryFn: async () => {
            if (!type || mainProgramId === null || mainProgramId === undefined || mainProgramId === '') {
                return null;
            }
            const id = Number(mainProgramId);
            if (!Number.isFinite(id))
                return null;
            // Map selected main_program_id → tahfiz | taaleem (no GET /main-programs/:id — list-only API)
            const program = mapMainProgramSelectionToProgramParam(mainProgramId, null);
            if (!program)
                return null;
            return registrationService.getRequiredDocuments({ type, program });
        },
        enabled: !!type &&
            mainProgramId !== null &&
            mainProgramId !== undefined &&
            mainProgramId !== '' &&
            String(mainProgramId).trim() !== '',
        staleTime: 5 * 60 * 1000
    });
}
