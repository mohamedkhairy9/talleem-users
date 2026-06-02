import { axiosInstance } from '@/api/axiosInstance';
import { API_ENDPOINTS } from '@/api/config';
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
     * List join requests for entity manager. Pending mode is used for actionability lookup.
     */
    getJoinRequests: (params = {}, options = {}) => {
        const queryParams = buildQueryParams(params);
        const mode = options.mode || 'pending';
        const listPath = mode === 'all'
            ? API_ENDPOINTS.JOIN_REQUESTS.LIST
            : API_ENDPOINTS.JOIN_REQUESTS.LIST_PENDING;
        return axiosInstance.get(listPath, {
            params: queryParams
        });
    },
    getAllJoinRequests: async (params = {}, options = {}) => {
        const queryParams = buildQueryParams(params);
        const mode = options.mode || 'pending';
        const listPath = mode === 'all'
            ? API_ENDPOINTS.JOIN_REQUESTS.LIST
            : API_ENDPOINTS.JOIN_REQUESTS.LIST_PENDING;

        const firstPage = await axiosInstance.get(listPath, {
            params: { ...queryParams, page: 1 }
        });

        const firstPageItems = Array.isArray(firstPage?.data) ? firstPage.data : [];
        const totalItems = Number(firstPage?.meta?.total ?? firstPageItems.length);
        const perPage = Number(firstPage?.meta?.per_page ?? (firstPageItems.length || 20));
        const totalPages =
            totalItems > 0 && perPage > 0 ? Math.ceil(totalItems / perPage) : 1;

        if (totalPages <= 1) {
            return firstPage;
        }

        const remainingPages = await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, index) =>
                axiosInstance.get(listPath, {
                    params: { ...queryParams, page: index + 2 }
                })
            )
        );

        const allItems = [
            ...firstPageItems,
            ...remainingPages.flatMap(response =>
                Array.isArray(response?.data) ? response.data : []
            )
        ];

        return {
            ...firstPage,
            data: allItems,
            meta: {
                ...(firstPage?.meta || {}),
                total: allItems.length,
                current_page: 1,
                last_page: 1,
                per_page: allItems.length || perPage
            }
        };
    },
    /**
     * Process a join request step (approve / reject / need review / need upload)
     */
    processStep: (id, data) => {
        const formData = buildProcessStepFormData(data);
        return axiosInstance.post(API_ENDPOINTS.JOIN_REQUESTS.PROCESS_STEP(id), formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
};
