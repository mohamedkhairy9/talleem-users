import i18n from '@/i18n';
export const RETRY_COUNT = 2;
export const RETRY_DELAY_MS = 500;
/**
 * Get display label from API item: name can be { en, ar } or string
 */
export function getLocalizedLabel(name, fallback) {
    if (name == null)
        return fallback ?? '';
    if (typeof name === 'string')
        return name;
    if (typeof name !== 'object' || Array.isArray(name))
        return fallback ?? '';
    const obj = name;
    const lang = i18n.language === 'ar' ? 'ar' : 'en';
    const value = (obj[lang] ?? obj.en ?? obj.ar);
    return (value && String(value).trim()) || (fallback ?? '') || '';
}
/**
 * Get display string from API item field (bilingual object or string).
 * Same logic as Tallem: labelField[lang] ?? labelField.en ?? labelField.ar ?? labelField ?? name.* ?? label.
 */
function getLabelFromField(item, labelField, lang) {
    const fieldValue = item[labelField] ?? item.name ?? item.label;
    if (fieldValue == null)
        return '';
    if (typeof fieldValue === 'string')
        return fieldValue;
    if (typeof fieldValue === 'object' && !Array.isArray(fieldValue)) {
        const localized = fieldValue;
        const text = localized[lang] ?? localized.en ?? localized.ar ?? localized.name ?? localized.label;
        return (text && String(text).trim()) || '';
    }
    return '';
}
/**
 * Generate options for SelectRFH from API list (same logic as Tallem generateOptionsWithCustomLabel).
 * Maps each item to { label, value: id, name } with localized label from labelField (default 'name').
 */
export function generateOptions(arr, labelField = 'name') {
    if (!arr?.length)
        return [];
    const lang = i18n.language === 'ar' ? 'ar' : 'en';
    return arr.map((item) => {
        const labelText = getLabelFromField(item, labelField, lang) ||
            getLocalizedLabel(item.name, item.email) ||
            item.label ||
            '';
        const optionValue = item.id !== undefined ? item.id : item.value;
        return {
            ...item,
            label: labelText,
            value: optionValue,
            name: labelText
        };
    });
}
/**
 * Run a function and retry only on failure (up to RETRY_COUNT times)
 */
export async function withRetryOnFailure(fn) {
    let lastError;
    for (let attempt = 0; attempt <= RETRY_COUNT; attempt++) {
        try {
            return await fn();
        }
        catch (err) {
            lastError = err;
            if (attempt < RETRY_COUNT) {
                await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
            }
        }
    }
    throw lastError;
}
