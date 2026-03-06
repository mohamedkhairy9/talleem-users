import React from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/globals/components';
import TeacherLicensesList from '@/features/teacher/licenses/components/TeacherLicensesList';
import CurrentLicenseCard from '@/features/teacher/licenses/components/CurrentLicenseCard';

/**
 * Teacher Licenses Page
 * Shows current license (GET /teacher/licenses/current) and full list (GET /teacher/licenses).
 */
const TeacherLicensesPage: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="flex min-h-full flex-col space-y-6">
            <PageHeader
                title={t('licenses.title', 'My Licenses')}
                subtitle={t('licenses.subtitle', 'View your teaching licenses')}
            />

            <CurrentLicenseCard />

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-white shadow-sm border border-gray-200">
                <div className="flex-shrink-0 flex items-center justify-between gap-4 p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {t('licenses.listTitle', 'All Licenses')}
                    </h2>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden p-6">
                    <TeacherLicensesList />
                </div>
            </div>
        </div>
    );
};

export default TeacherLicensesPage;
