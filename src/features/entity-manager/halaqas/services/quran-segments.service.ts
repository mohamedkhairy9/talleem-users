import { axiosInstance } from '@/api/axiosInstance';

/**
 * Quran Segment Interface
 */
export interface QuranSegment {
    id: number;
    juz_number: number;
    surah_number: number;
    page_number: number;
    segment_number: number;
    first_verse_key: string;
    last_verse_key: string;
    from_verse: number;
    to_verse: number;
    is_active: number;
    created_by?: number;
    updated_by?: number;
    created_at?: string;
    updated_at?: string;
}

/**
 * Verse Interface
 */
export interface Verse {
    verse_key: string;
    ayah_number: number;
    text: string;
}

/**
 * Segment After Response Interface
 */
export interface SegmentAfterResponse {
    target_segment: {
        id: number;
        page_number: number;
        segment_number: number;
        surah_number: number;
        juz_number?: number;
        from_verse: number;
        to_verse: number;
        first_verse_key: string;
        last_verse_key: string;
    };
    verses_count_in_segment: number;
    verses: Verse[];
    full_text: string;
}

/**
 * Quran Segments Service
 */
export const quranSegmentsService = {
    /**
     * Get segments by page number
     * GET /quran-segments?page_number=19
     */
    getSegmentsByPage: (pageNumber: number): Promise<QuranSegment[]> => {
        return axiosInstance.get('/quran-segments', {
            params: { page_number: pageNumber }
        });
    },

    /**
     * Get segment after a specific segment
     * GET /segment/after?first_segment_id=10&segments_number=31
     */
    getSegmentAfter: (
        firstSegmentId: number,
        segmentsNumber: number
    ): Promise<SegmentAfterResponse> => {
        return axiosInstance.get('/segment/after', {
            params: {
                first_segment_id: firstSegmentId,
                segments_number: segmentsNumber
            }
        });
    }
};

