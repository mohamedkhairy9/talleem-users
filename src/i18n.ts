import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';
import { useLanguageStore } from './stores/language.store';

/** Default app language (used for initial load, redirects, and fallbacks) */
export const DEFAULT_LANG = 'ar';

// Get initial language from store or URL
const getInitialLanguage = (): string => {
    // Try to get from URL (if available)
    const urlParams = new URLSearchParams(window.location.search);
    const langFromUrl = urlParams.get('lang');
    
    if (langFromUrl && ['en', 'ar'].includes(langFromUrl)) {
        return langFromUrl;
    }
    
    // Get from store
    const storeLang = useLanguageStore.getState().language;
    if (storeLang) {
        return storeLang;
    }
    
    return DEFAULT_LANG;
};

i18n.use(HttpApi)
    .use(initReactI18next)
    .init({
        supportedLngs: ['ar', 'en'],
        fallbackLng: 'en',
        lng: getInitialLanguage(),
        debug: false,
        interpolation: {
            escapeValue: false
        },
        backend: {
            loadPath: '/locales/{{lng}}/translation.json'
        },
        react: {
            useSuspense: false
        },
        load: 'languageOnly',
        cleanCode: true
    });

// Sync language changes to store
i18n.on('languageChanged', (lng: string) => {
    useLanguageStore.getState().setLanguage(lng);
});

export default i18n;
