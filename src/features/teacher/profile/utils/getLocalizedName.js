/**
 * Get localized string from bilingual API name (en/ar)
 */
export function getLocalizedName(name, locale) {
    if (!name || typeof name !== 'object')
        return '';
    const lang = locale === 'ar' ? 'ar' : 'en';
    return name[lang] ?? name.en ?? name.ar ?? '';
}
