import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useLanguageStore } from '@/stores';

/**
 * Hook for internationalization
 * Combines i18n translation with path-based language routing
 */
export const useLocale = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams<{ lang: string }>();
    const { language: storeLanguage, setLanguage: setStoreLanguage } = useLanguageStore();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        setStoreLanguage(lng);
        
        // Update URL path with new language
        const currentPath = location.pathname;
        // Extract path without language prefix
        const pathWithoutLang = currentPath.replace(/^\/(en|ar)/, '') || '';
        // Build new path with new language
        const newPath = pathWithoutLang === '/' || pathWithoutLang === '' 
            ? `/${lng}`
            : `/${lng}${pathWithoutLang}`;
        
        navigate(newPath, { replace: true });
    };

    return {
        t,
        currentLocale: params.lang || i18n.language,
        changeLanguage,
        language: storeLanguage
    };
};
