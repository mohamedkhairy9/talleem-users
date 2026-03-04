/**
 * Reusable helper to get localized string from bilingual name objects (ar/en).
 * Use for consistent localization across teacher/entity-manager features.
 */

export type BilingualLike = { en?: string; ar?: string } | string | null | undefined;

const DEFAULT_FALLBACK = 'N/A';

/**
 * Returns the localized string for the given language.
 * @param obj - Bilingual name { ar, en }, plain string, or null/undefined
 * @param lang - Current language code (e.g. 'ar', 'en')
 * @param fallback - Optional fallback when no value is available (default 'N/A')
 */
export function getLocalizedText(
    obj: BilingualLike,
    lang: string,
    fallback: string = DEFAULT_FALLBACK
): string {
    if (typeof obj === 'string') return obj;
    if (!obj) return fallback;
    if (lang === 'ar' && obj.ar) return obj.ar;
    if (obj.en) return obj.en;
    return fallback;
}
