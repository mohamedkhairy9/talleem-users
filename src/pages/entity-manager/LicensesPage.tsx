import React from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/globals/components';
import EntityLicensesList from '@/features/entity-manager/licenses/components/EntityLicensesList';
import CurrentLicenseCard from '@/features/entity-manager/licenses/components/CurrentLicenseCard';

/**
 * Entity Manager Licenses Page
 * Shows current license (GET /entity/licenses/current) and full list (GET /entity/licenses).
 */
const LicensesPage: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="flex min-h-full flex-col space-y-6">
            <PageHeader
                title={t('licenses.entityTitle', 'Licenses')}
                subtitle={t('licenses.entitySubtitle', 'View your entity licenses')}
            />

            <CurrentLicenseCard />

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-white shadow-sm border border-gray-200">
                <div className="flex-shrink-0 flex items-center justify-between gap-4 p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {t('licenses.listTitle', 'All Licenses')}
                    </h2>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden p-6">
                    <EntityLicensesList />
                </div>
            </div>
        </div>
    );
};

export default LicensesPage;
