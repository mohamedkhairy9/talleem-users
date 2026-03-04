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
 * Get display info for a verse key (surah name + ayah number) for use in "From X to Y" labels.
 * @param verseKey - Format "surah:ayah" (e.g. "2:102")
 * @param surahData - Loaded surah data map (from loadSurahData)
 * @param lang - 'ar' for Arabic surah name, otherwise English
 * @returns { surahName, ayahNumber } or null if invalid/no data (then display raw verse_key)
 */
export function getVerseKeyDisplay(
    verseKey: string,
    surahData: SurahDataMap | null,
    lang: string
): { surahName: string; ayahNumber: number } | null {
    if (!verseKey?.trim() || !surahData) return null;
    const parts = verseKey.trim().split(':');
    const surahNum = parseInt(parts[0], 10);
    const ayahNum = parseInt(parts[1], 10);
    if (isNaN(surahNum) || isNaN(ayahNum) || surahNum < 1 || surahNum > 114) return null;
    const surah = surahData[String(surahNum)];
    if (!surah) return null;
    const surahName = lang === 'ar' ? (surah.name_arabic || surah.name_simple) : (surah.name_simple || surah.name_arabic);
    return { surahName, ayahNumber: ayahNum };
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
    locale: 'ar' | 'en' = 'ar',
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
    locale: 'ar' | 'en' = 'ar',
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

/**
 * First verse key for each juz (1–30). Used to send start_verse_key when unit is "parts".
 * Source: canonical Quran juz divisions (e.g. Juz 1 = 1:1, Juz 2 = 2:142, Juz 3 = 2:253).
 */
const JUZ_FIRST_VERSE_KEY: Record<number, string> = {
    1: '1:1',
    2: '2:142',
    3: '2:253',
    4: '3:93',
    5: '4:24',
    6: '4:148',
    7: '5:82',
    8: '6:111',
    9: '7:88',
    10: '8:41',
    11: '9:93',
    12: '11:6',
    13: '12:53',
    14: '15:1',
    15: '17:1',
    16: '18:75',
    17: '21:1',
    18: '23:1',
    19: '25:21',
    20: '27:56',
    21: '29:46',
    22: '33:31',
    23: '36:28',
    24: '39:32',
    25: '41:47',
    26: '46:1',
    27: '51:31',
    28: '58:1',
    29: '67:1',
    30: '78:1'
};

/**
 * Get the first verse key of a juz (1–30) from local data.
 * Used when unit is "parts" to send start_verse_key to the plan API.
 */
export function getJuzFirstVerseKey(juzNumber: number): string | null {
    if (juzNumber >= 1 && juzNumber <= 30) {
        return JUZ_FIRST_VERSE_KEY[juzNumber] ?? null;
    }
    return null;
}

/**
 * Get the first verse key of a surah (surah_id:1).
 * Used when unit is "surahs" to send start_verse_key to the plan API.
 */
export function getSurahFirstVerseKey(surahId: number): string {
    return `${surahId}:1`;
}

/**
 * Verse count per surah (1–114), standard Uthmani Quran.
 * Used for verse-to-page fallback when DB lookup fails.
 */
const VERSE_COUNT_PER_SURAH: number[] = [
    7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6
];

/** Juz page ranges (start_page, end_page) for 604-page Mushaf. Fallback when JSON not loaded. */
/** Verse count per surah (1–114), exported for last-verse check. */
export const VERSE_COUNT_PER_SURAH_READONLY: readonly number[] = VERSE_COUNT_PER_SURAH;

/** Whether (surah, ayah) is the last verse of that surah (long verses often need an extra page in 604 layout). */
export function isLastVerseOfSurah(surah: number, ayah: number): boolean {
    if (surah < 1 || surah > 114) return false;
    const max = VERSE_COUNT_PER_SURAH[surah - 1];
    return max != null && ayah === max;
}

/**
 * Convert global 1-based verse index (1..6236) to verse key "surah:ayah".
 * Used when API returns only verse IDs (e.g. today_schedule.from_verse_id).
 */
export function getVerseKeyFromGlobalId(verseId: number): string {
    if (verseId < 1) return '1:1';
    let remaining = verseId;
    for (let s = 1; s <= 114; s++) {
        const count = VERSE_COUNT_PER_SURAH[s - 1] ?? 0;
        if (remaining <= count) return `${s}:${remaining}`;
        remaining -= count;
    }
    return '114:6'; // last verse
}

/** Compare two verse keys (e.g. "2:286" vs "3:1"). Returns -1 if a < b, 0 if equal, 1 if a > b. */
export function compareVerseKeys(a: string, b: string): number {
    const [as, aa] = a.trim().split(':').map(Number);
    const [bs, ba] = b.trim().split(':').map(Number);
    if (as !== bs) return as < bs ? -1 : 1;
    if (aa !== ba) return aa < ba ? -1 : 1;
    return 0;
}

/**
 * Returns all verse keys between startKey and endKey (inclusive).
 * If clipEnd is provided, only keys <= clipEnd are returned.
 * If clipStart is provided, only keys >= clipStart are returned.
 */
export function verseKeysBetween(
    startKey: string,
    endKey: string,
    clipStart?: string,
    clipEnd?: string
): string[] {
    const [startSurah, startAyah] = startKey.trim().split(':').map(Number);
    const [endSurah, endAyah] = endKey.trim().split(':').map(Number);
    const keys: string[] = [];
    for (let s = startSurah; s <= endSurah; s++) {
        const maxAyah = VERSE_COUNT_PER_SURAH[s - 1] ?? 0;
        const firstAyah = s === startSurah ? startAyah : 1;
        const lastAyah = s === endSurah ? endAyah : maxAyah;
        for (let a = firstAyah; a <= lastAyah; a++) {
            const key = `${s}:${a}`;
            if (clipStart && compareVerseKeys(key, clipStart) < 0) continue;
            if (clipEnd && compareVerseKeys(key, clipEnd) > 0) continue;
            keys.push(key);
        }
    }
    return keys;
}

/** One mushaf page entry: start and end verse keys (604-page Madani layout). */
export interface MushafPageEntry {
    page: number;
    start_verse_key: string;
    end_verse_key: string;
}

let mushafPagesCache: MushafPageEntry[] | null = null;
let mushafPagesPromise: Promise<MushafPageEntry[]> | null = null;

/**
 * Load mushaf page boundaries from /data/mushaf_pages.json.
 * Format: { "pages": [ { "page": 1, "start_verse_key": "1:1", "end_verse_key": "1:7" }, ... ] } (604 entries).
 * Cached after first load.
 */
export function loadMushafPages(): Promise<MushafPageEntry[]> {
    if (mushafPagesCache && mushafPagesCache.length === 604) return Promise.resolve(mushafPagesCache);
    if (mushafPagesPromise) return mushafPagesPromise;
    mushafPagesPromise = fetch('/data/mushaf_pages.json')
        .then((r) => {
            if (!r.ok) throw new Error(`mushaf_pages: ${r.status}`);
            return r.json();
        })
        .then((data: { pages?: MushafPageEntry[] }) => {
            const pages = Array.isArray(data?.pages) ? data.pages : [];
            mushafPagesCache = pages.length === 604 ? pages : [];
            mushafPagesPromise = null;
            return mushafPagesCache!;
        })
        .catch((err) => {
            mushafPagesPromise = null;
            console.warn('Failed to load mushaf_pages.json:', err);
            return [];
        });
    return mushafPagesPromise;
}

/**
 * Get mushaf page number (1–604) for a verse key using the loaded pages array.
 * Uses binary search on start_verse_key (pages are ordered), then checks the verse is within that page's end.
 */
export function getPageForVerseKey(verseKey: string, pages: MushafPageEntry[]): number {
    const key = verseKey.trim();
    if (!pages.length) return 1;
    if (compareVerseKeys(key, pages[0].start_verse_key) < 0) return 1;
    if (compareVerseKeys(key, pages[pages.length - 1].end_verse_key) > 0) return 604;

    // Binary search: largest index i where pages[i].start_verse_key <= key
    let lo = 0;
    let hi = pages.length - 1;
    while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (compareVerseKeys(pages[mid].start_verse_key, key) <= 0) lo = mid;
        else hi = mid - 1;
    }
    const entry = pages[lo];
    if (compareVerseKeys(key, entry.end_verse_key) <= 0) return entry.page;
    return lo + 1 < pages.length ? pages[lo + 1].page : 604;
}

/** Juz page range (from juz_pages.json). */
export interface JuzPageEntry {
    juz: number;
    start_page: number;
    end_page: number;
}

let juzPagesCache: JuzPageEntry[] | null = null;
let juzPagesPromise: Promise<JuzPageEntry[]> | null = null;

/**
 * Load juz page ranges from /data/juz_pages.json.
 * Cached after first load.
 */
export function loadJuzPages(): Promise<JuzPageEntry[]> {
    if (juzPagesCache && juzPagesCache.length === 30) return Promise.resolve(juzPagesCache);
    if (juzPagesPromise) return juzPagesPromise;
    juzPagesPromise = fetch('/data/juz_pages.json')
        .then((r) => {
            if (!r.ok) throw new Error(`juz_pages: ${r.status}`);
            return r.json();
        })
        .then((data: JuzPageEntry[] | { [key: string]: unknown }[]) => {
            const arr = Array.isArray(data) ? data : [];
            juzPagesCache = arr.length === 30 ? (arr as JuzPageEntry[]) : [];
            juzPagesPromise = null;
            return juzPagesCache!;
        })
        .catch((err) => {
            juzPagesPromise = null;
            console.warn('Failed to load juz_pages.json:', err);
            return [];
        });
    return juzPagesPromise;
}

/**
 * Get juz number (1–30) for a mushaf page number.
 * Requires juz pages to be loaded (e.g. from loadJuzPages()).
 */
export function getJuzForPage(pageNum: number, juzPages: JuzPageEntry[]): number {
    if (!juzPages.length || pageNum < 1 || pageNum > 604) return 1;
    const entry = juzPages.find((j) => pageNum >= j.start_page && pageNum <= j.end_page);
    return entry ? entry.juz : 1;
}

/**
 * Get juz number (1–30) for a verse key (e.g. "2:255").
 * Requires mushaf pages and juz pages to be loaded.
 */
export function getJuzForVerseKey(verseKey: string, mushafPages: MushafPageEntry[], juzPages: JuzPageEntry[]): number {
    if (!verseKey?.trim() || !mushafPages.length || !juzPages.length) return 1;
    const pageNum = getPageForVerseKey(verseKey.trim(), mushafPages);
    return getJuzForPage(pageNum, juzPages);
}

/**
 * Get surah number (1–114) for the first verse on a mushaf page.
 * Requires mushaf pages to be loaded (e.g. from loadMushafPages()).
 */
export function getSurahNumberForPage(pageNum: number, mushafPages: MushafPageEntry[]): number {
    if (!mushafPages.length || pageNum < 1 || pageNum > 604) return 1;
    const index = pageNum - 1;
    if (index >= mushafPages.length) return 114;
    const startKey = mushafPages[index]?.start_verse_key;
    if (!startKey) return 1;
    const surah = parseInt(startKey.split(':')[0], 10);
    return Number.isNaN(surah) ? 1 : Math.max(1, Math.min(114, surah));
}

/**
 * Get localized surah name for a surah number.
 * @param surahNumber 1–114
 * @param surahData from loadSurahData()
 * @param lang 'en' | 'ar'
 */
export function getSurahNameForPage(surahNumber: number, surahData: SurahDataMap | null, lang: string): string {
    if (!surahData || surahNumber < 1 || surahNumber > 114) return String(surahNumber);
    const surah = surahData[String(surahNumber)];
    if (!surah) return String(surahNumber);
    return lang === 'ar' ? (surah.name_arabic || surah.name_simple || surah.name || '') : (surah.name_simple || surah.name || surah.name_arabic || '');
}



