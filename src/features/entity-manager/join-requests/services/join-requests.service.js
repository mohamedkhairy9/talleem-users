import { axiosInstance } from '@/shared/api/axiosInstance';
import { API_ENDPOINTS } from '@/shared/api/config';
function buildQueryParams(params) {
    const result = {};
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
            result[key] = value;
        }
    });
    return result;
}
/**
 * Build FormData for process-step (status, notes, files)
 */
function buildProcessStepFormData(data) {
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
     * List pending join requests for the current entity manager context.
     */
    getJoinRequests: (params = {}) => {
        const queryParams = buildQueryParams(params);
        return axiosInstance.get(API_ENDPOINTS.JOIN_REQUESTS.LIST_PENDING, {
            params: queryParams
        });
    },
    /**
     * Get full join request details for modal view.
     */
    getJoinRequest: (id) => {
        return axiosInstance.get(API_ENDPOINTS.JOIN_REQUESTS.DETAIL(id));
    },
    /**
     * Process a join request step (approve / reject / need review / need upload)
     */
    processStep: (id, data) => {
        // Status 4 creates a resubmission form. Send JSON to preserve the
        // nested form definition exactly as the API contract expects.
        if (Number(data?.status) === 4 && data?.resubmission_form) {
            return axiosInstance.post(API_ENDPOINTS.JOIN_REQUESTS.PROCESS_STEP(id), {
                status: 4,
                notes: data.notes || null,
                resubmission_form: data.resubmission_form
            });
        }

        const formData = buildProcessStepFormData(data);
        return axiosInstance.post(API_ENDPOINTS.JOIN_REQUESTS.PROCESS_STEP(id), formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
};
