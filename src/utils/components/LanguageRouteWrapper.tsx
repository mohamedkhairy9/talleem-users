import React, { useEffect } from 'react';
import { useParams, Navigate, Outlet } from 'react-router-dom';
import i18n from '@/i18n';

/**
 * LanguageRouteWrapper Component
 * Wraps routes to sync language from URL path with i18n
 */
const LanguageRouteWrapper: React.FC = () => {
    const { lang } = useParams<{ lang: string }>();

    useEffect(() => {
        if (lang && ['en', 'ar'].includes(lang) && i18n.language !== lang) {
            i18n.changeLanguage(lang);
        }
    }, [lang]);

    // Validate language parameter
    if (lang && !['en', 'ar'].includes(lang)) {
        // Redirect to default language (en) if invalid language
        const currentPath = window.location.pathname.replace(`/${lang}`, '');
        return <Navigate to={`/en${currentPath}`} replace />;
    }

    return <Outlet />;
};

export default LanguageRouteWrapper;
