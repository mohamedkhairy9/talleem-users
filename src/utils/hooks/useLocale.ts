import { useTranslation } from 'react-i18next';
import { useLanguageStore } from '@/stores';
import { useUrlParams } from './useUrlParams';

/**
 * Hook for internationalization
 * Combines i18n translation with URL language param sync
 */
export const useLocale = () => {
    const { t, i18n } = useTranslation();
    const { setLanguage: setLanguageInUrl } = useUrlParams();
    const { language: storeLanguage, setLanguage: setStoreLanguage } = useLanguageStore();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        setStoreLanguage(lng);
        setLanguageInUrl(lng);
    };

    return {
        t,
        currentLocale: i18n.language,
        changeLanguage,
        language: storeLanguage
    };
};
