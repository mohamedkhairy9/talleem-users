import i18n from '@/i18n';

/**
 * Extract label based on current language from bilingual format
 * Format: "Arabic / English" or "Arabic /English" or "Arabic/ English" or "Arabic/English"
 * @param label - The label string in format "Arabic / English"
 * @returns The label in the current language
 */
export const extractLabel = (label: string | undefined | null): string => {
    if (!label) return '';
    
    const currentLang = i18n.language || 'en';
    
    // Check if label contains the separator pattern (Arabic / English or Arabic/English)
    // Pattern: Arabic text followed by optional spaces, slash, optional spaces, English text
    const separatorPattern = /\s*\/\s*/;
    
    if (separatorPattern.test(label)) {
        const parts = label.split(separatorPattern);
        if (parts.length === 2) {
            const arabicPart = parts[0].trim();
            const englishPart = parts[1].trim();
            
            // Check if first part contains Arabic characters
            const hasArabic = /[\u0600-\u06FF]/.test(arabicPart);
            
            if (hasArabic) {
                // First part is Arabic, second is English
                return currentLang === 'ar' ? arabicPart : englishPart;
            } else {
                // First part is English, second might be Arabic (reverse format)
                const hasArabicInSecond = /[\u0600-\u06FF]/.test(englishPart);
                if (hasArabicInSecond) {
                    return currentLang === 'ar' ? englishPart : arabicPart;
                }
            }
        }
    }
    
    // If no separator found or format is different, return as is
    return label;
};



