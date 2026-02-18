/**
 * Surah Helper
 * Reusable helper functions for working with surah data from surah_combined.json
 */

export interface SurahData {
    id: number;
    name: string;
    name_simple: string;
    name_arabic: string;
    revelation_order: number;
    revelation_place: 'makkah' | 'madinah';
    verses_count: number;
    bismillah_pre: boolean;
    glyph: string;
}

export type SurahDataMap = Record<string, SurahData>;

// Cache for surah data
let surahDataCache: SurahDataMap | null = null;
let surahDataPromise: Promise<SurahDataMap> | null = null;

/**
 * Load surah data from JSON file
 * Uses caching to avoid multiple fetches
 * @returns {Promise<SurahDataMap>} Promise that resolves to surah data object
 */
export async function loadSurahData(): Promise<SurahDataMap> {
    // Return cached data if available
    if (surahDataCache) {
        return surahDataCache;
    }

    // Return existing promise if already loading
    if (surahDataPromise) {
        return surahDataPromise;
    }

    // Create new promise for loading
    surahDataPromise = (async () => {
        try {
            const response = await fetch('/data/surah_combined.json');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json() as SurahDataMap;
            surahDataCache = data;
            surahDataPromise = null; // Clear promise after loading
            return data;
        } catch (error) {
            surahDataPromise = null; // Clear promise on error
            console.error('Error loading surah data:', error);
            throw error;
        }
    })();

    return surahDataPromise;
}

/**
 * Get surah data by surah number
 * @param surahNumber - The surah number (1-114)
 * @param surahData - Optional surah data map. If not provided, will load from cache or fetch
 * @returns Promise that resolves to surah data or null if not found
 */
export async function getSurahData(
    surahNumber: number | string,
    surahData?: SurahDataMap
): Promise<SurahData | null> {
    const data = surahData || await loadSurahData();
    const key = String(surahNumber);
    return data[key] || null;
}

/**
 * Get surah name in Arabic
 * @param surahNumber - The surah number (1-114)
 * @param surahData - Optional surah data map
 * @returns Promise that resolves to Arabic surah name or empty string
 */
export async function getSurahNameArabic(
    surahNumber: number | string,
    surahData?: SurahDataMap
): Promise<string> {
    const surah = await getSurahData(surahNumber, surahData);
    return surah?.name_arabic || '';
}

/**
 * Get surah name in English (simple format)
 * @param surahNumber - The surah number (1-114)
 * @param surahData - Optional surah data map
 * @returns Promise that resolves to English surah name or empty string
 */
export async function getSurahNameEnglish(
    surahNumber: number | string,
    surahData?: SurahDataMap
): Promise<string> {
    const surah = await getSurahData(surahNumber, surahData);
    return surah?.name_simple || surah?.name || '';
}

/**
 * Get surah name (with diacritics)
 * @param surahNumber - The surah number (1-114)
 * @param surahData - Optional surah data map
 * @returns Promise that resolves to surah name with diacritics or empty string
 */
export async function getSurahName(
    surahNumber: number | string,
    surahData?: SurahDataMap
): Promise<string> {
    const surah = await getSurahData(surahNumber, surahData);
    return surah?.name || '';
}

/**
 * Get surah display name based on locale
 * @param surahNumber - The surah number (1-114)
 * @param locale - The locale ('ar' for Arabic, 'en' for English)
 * @param surahData - Optional surah data map
 * @returns Promise that resolves to localized surah name
 */
export async function getSurahDisplayName(
    surahNumber: number | string,
    locale: 'ar' | 'en' = 'en',
    surahData?: SurahDataMap
): Promise<string> {
    if (locale === 'ar') {
        return getSurahNameArabic(surahNumber, surahData);
    }
    return getSurahNameEnglish(surahNumber, surahData);
}

/**
 * Get surah glyph (special character for display)
 * @param surahNumber - The surah number (1-114)
 * @param surahData - Optional surah data map
 * @returns Promise that resolves to surah glyph or empty string
 */
export async function getSurahGlyph(
    surahNumber: number | string,
    surahData?: SurahDataMap
): Promise<string> {
    const surah = await getSurahData(surahNumber, surahData);
    return surah?.glyph || '';
}

/**
 * Get full surah information formatted for display
 * @param surahNumber - The surah number (1-114)
 * @param locale - The locale ('ar' for Arabic, 'en' for English)
 * @param surahData - Optional surah data map
 * @returns Promise that resolves to formatted surah info object
 */
export async function getSurahInfo(
    surahNumber: number | string,
    locale: 'ar' | 'en' = 'en',
    surahData?: SurahDataMap
): Promise<{
    id: number;
    name: string;
    name_arabic: string;
    name_english: string;
    display_name: string;
    glyph: string;
    verses_count: number;
    revelation_place: string;
} | null> {
    const surah = await getSurahData(surahNumber, surahData);
    if (!surah) return null;

    return {
        id: surah.id,
        name: surah.name,
        name_arabic: surah.name_arabic,
        name_english: surah.name_simple || surah.name,
        display_name: locale === 'ar' ? surah.name_arabic : (surah.name_simple || surah.name),
        glyph: surah.glyph,
        verses_count: surah.verses_count,
        revelation_place: surah.revelation_place
    };
}

/**
 * Clear the surah data cache (useful for testing or reloading)
 */
export function clearSurahDataCache(): void {
    surahDataCache = null;
    surahDataPromise = null;
}


