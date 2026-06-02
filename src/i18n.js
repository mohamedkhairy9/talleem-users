import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';
import { useLanguageStore } from './stores/language.store';
/** Default app language (used for initial load, redirects, and fallbacks) */
export const DEFAULT_LANG = 'ar';
// Get initial language from store or URL
const getInitialLanguage = () => {
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
    fallbackLng: ['ar', 'en'],
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
function applyLanguageToDocument(lng) {
    if (typeof document === 'undefined')
        return;
    document.documentElement.lang = lng;
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
}
applyLanguageToDocument(getInitialLanguage());
i18n.on('languageChanged', (lng) => {
    useLanguageStore.getState().setLanguage(lng);
    applyLanguageToDocument(lng);
});
export default i18n;
