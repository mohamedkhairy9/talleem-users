import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/app/stores';
import { ROUTE_PATHS } from '@/config';
/**
 * Dashboard Page
 * Redirects entity_manager to halaqas, shows dashboard for other roles
 */
const DashboardPage = () => {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const { lang } = useParams();
    const currentLang = lang || 'ar';
    // Redirect entity_manager to halaqas (their index page)
    if (user?.roles?.includes('entity_manager')) {
        return <Navigate to={`/${currentLang}/${ROUTE_PATHS.HALAQAS}`} replace/>;
    }
    // For other roles, show dashboard
    return (<div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('dashboard.title', 'Dashboard')}</h1>
            <p className="text-gray-600">{t('dashboard.welcome', 'Welcome to the dashboard')}</p>
        </div>);
};
export default DashboardPage;
