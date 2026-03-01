import { axiosInstance } from '@/api/axiosInstance';
import { API_ENDPOINTS } from '@/api/config';
import type {
    JoinRequestsListResponse,
    JoinRequestsListParams,
    ProcessStepPayload
} from '../types/join-requests.types';

function buildQueryParams(params: JoinRequestsListParams): Record<string, string | number> {
    const result: Record<string, string | number> = {};
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
            result[key] = value as string | number;
        }
    });
    return result;
}

/**
 * Build FormData for process-step (status, notes, files)
 */
function buildProcessStepFormData(data: ProcessStepPayload): FormData {
    const formData = new FormData();
    formData.append('status', String(data.status));
    if (data.notes != null && data.notes !== '') {
        formData.append('notes', data.notes);
    }
    if (data.files) {
        const files = Array.isArray(data.files) ? data.files : Array.from(data.files);
        files.forEach((file) => {
            if (file instanceof File) {
                formData.append('files[]', file);
            }
        });
    }
    return formData;
}

export const joinRequestsService = {
    /**
     * List pending join requests (entity manager uses same front API)
     */
    getJoinRequests: (params: JoinRequestsListParams = {}): Promise<JoinRequestsListResponse> => {
        const queryParams = buildQueryParams(params);
        return axiosInstance.get(API_ENDPOINTS.JOIN_REQUESTS.LIST_PENDING, {
            params: queryParams
        }) as Promise<JoinRequestsListResponse>;
    },

    /**
     * Process a join request step (approve / reject / need review / need upload)
     */
    processStep: (id: number, data: ProcessStepPayload): Promise<unknown> => {
        const formData = buildProcessStepFormData(data);
        return axiosInstance.post(API_ENDPOINTS.JOIN_REQUESTS.PROCESS_STEP(id), formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
};
