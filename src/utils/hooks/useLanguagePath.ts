import { useParams, useNavigate, useLocation } from 'react-router-dom';
import i18n from '@/i18n';

/**
 * Hook to manage language-based routing
 * Provides utilities for path-based language routing
 */
export const useLanguagePath = () => {
    const params = useParams<{ lang: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const currentLang = params.lang || i18n.language || 'en';

    /**
     * Get a path with language prefix
     */
    const getPath = (path: string, lang?: string): string => {
        const language = lang || currentLang;
        // Handle empty path (dashboard)
        if (!path || path === '/' || path === '') {
            return `/${language}`;
        }
        // Remove leading slash if present
        const cleanPath = path.startsWith('/') ? path.slice(1) : path;
        return `/${language}/${cleanPath}`;
    };

    /**
     * Navigate to a path with language
     */
    const navigateWithLang = (path: string, lang?: string, options?: { replace?: boolean }) => {
        const language = lang || currentLang;
        const fullPath = getPath(path, language);
        navigate(fullPath, options);
    };

    /**
     * Get the current path without language prefix
     */
    const getCurrentPathWithoutLang = (): string => {
        const path = location.pathname;
        // Remove language prefix if present
        const langMatch = path.match(/^\/(en|ar)(\/|$)/);
        if (langMatch) {
            const pathWithoutLang = path.replace(/^\/(en|ar)/, '') || '';
            return pathWithoutLang === '' ? '' : pathWithoutLang;
        }
        return path === '/' ? '' : path;
    };

    return {
        currentLang,
        getPath,
        navigateWithLang,
        getCurrentPathWithoutLang
    };
};

