import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Dashboard Page
 */
const DashboardPage: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('dashboard.title', 'Dashboard')}</h1>
            <p className="text-gray-600">{t('dashboard.welcome', 'Welcome to the dashboard')}</p>
        </div>
    );
};

export default DashboardPage;
