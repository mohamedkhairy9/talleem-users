import { axiosInstance } from '@/api/axiosInstance';
/**
 * Quran Segments Service
 */
export const quranSegmentsService = {
    /**
     * Get segments by page number
     * GET /quran-segments?page_number=19
     */
    getSegmentsByPage: (pageNumber) => {
        return axiosInstance.get('/quran-segments', {
            params: { page_number: pageNumber }
        });
    },
    /**
     * Get segment after a specific segment
     * GET /segment/after?first_segment_id=10&segments_number=31&direction=incremental
     */
    getSegmentAfter: (firstSegmentId, segmentsNumber, direction) => {
        const params = {
            first_segment_id: firstSegmentId,
            segments_number: segmentsNumber
        };
        if (direction) {
            params.direction = direction;
        }
        return axiosInstance.get('/segment/after', { params });
    }
};
