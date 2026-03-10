import { BilingualName } from '@/globals/types';

/**
 * Get localized string from bilingual API name (en/ar)
 */
export function getLocalizedName(
    name: BilingualName | { en?: string; ar?: string } | undefined,
    locale: string
): string {
    if (!name || typeof name !== 'object') return '';
    const lang = locale === 'ar' ? 'ar' : 'en';
    return (name[lang as keyof typeof name] as string) ?? (name.en ?? name.ar ?? '') ?? '';
}
