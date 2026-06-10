import axiosInstance from '@/shared/api/axiosInstance';
/**
 * Registration Service
 * Uses /api/front/join-request-forms endpoints
 */
export const registrationService = {
    /**
     * Get join request form structure for a user type
     */
    getJoinRequestForm: async (userType) => {
        return axiosInstance.get(`/join-request-forms/${userType}`);
    },
    /**
     * Required supporting documents hint for join flow (by role + program slug)
     * GET /required-documents?type=teacher|entity&program=tahfiz|taaleem
     */
    getRequiredDocuments: async (params) => {
        return axiosInstance.get('/required-documents', { params });
    },
    /**
     * Submit join request
     */
    submitJoinRequest: async (_userType, data) => {
        return axiosInstance.post(`/join-requests`, data, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
    /**
     * Check join request status by request ID (number returned after submission)
     */
    checkJoinRequestStatus: async (data) => {
        return axiosInstance.post('/join-request/status', data);
    },
    /**
     * Submit a join request step (e.g. upload documents)
     */
    submitJoinRequestStep: async (joinRequestId, formData) => {
        return axiosInstance.post(`/join-request/${joinRequestId}/submit-step`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
    /**
     * Get cities (paginated)
     */
    getCities: async (params) => {
        return axiosInstance.get('/cities', { params });
    },
    /**
     * Get neighborhoods (with optional city_id filter, paginated)
     */
    getNeighborhoods: async (params) => {
        return axiosInstance.get('/neighborhoods', { params });
    },
    /**
     * Get branches (paginated)
     */
    getBranches: async (params) => {
        return axiosInstance.get('/branches', { params });
    },
    /**
     * Get session modes (paginated)
     */
    getSessionModes: async (params) => {
        return axiosInstance.get('/session-modes', { params });
    },
    /**
     * Get nationalities (paginated)
     */
    getNationalities: async (params) => {
        return axiosInstance.get('/nationalities', { params });
    },
    /**
     * Get majors (paginated)
     */
    getMajors: async (params) => {
        return axiosInstance.get('/majors', { params });
    },
    /**
     * Get academic qualifications (paginated)
     */
    getAcademicQualifications: async (params) => {
        return axiosInstance.get('/academic-qualifications', { params });
    },
    /**
     * Get remotely attendance platforms (paginated)
     */
    getRemotelyAttendancePlatforms: async (params) => {
        return axiosInstance.get('/remotely-attendance-platforms', { params });
    },
    /**
     * Get memorization program entity types (paginated)
     */
    getMemorizationProgramEntityTypes: async (params) => {
        return axiosInstance.get('/memorization-program-entity-types', { params });
    },
    /**
     * Get main programs (paginated)
     */
    getMainPrograms: async (params) => {
        return axiosInstance.get('/main-programs', { params });
    },
    /**
     * Get entities (filtered by branch_id and main_program_id, paginated)
     */
    getEntities: async (params) => {
        return axiosInstance.get('/entities', { params });
    },
    /**
     * Get education program entity types (paginated)
     */
    getEducationProgramEntityTypes: async (params) => {
        return axiosInstance.get('/education-program-entity-types', { params });
    },
    /**
     * Get activities (for activity_ids multiselect, filtered by main_program_id, paginated)
     */
    getActivities: async (params) => {
        return axiosInstance.get('/activities', { params });
    },
    /**
     * Get location types (paginated)
     */
    getLocationTypes: async (params) => {
        return axiosInstance.get('/location-types', { params });
    }
};
