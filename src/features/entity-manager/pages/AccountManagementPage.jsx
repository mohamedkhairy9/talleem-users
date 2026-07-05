import React from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/shared/components';
import AccountManagementList from '@/features/entity-manager/account-management/components/AccountManagementList';

const AccountManagementPage = () => {
    const { t } = useTranslation();

    return (
        <div className="flex min-h-full flex-col space-y-6">
            <PageHeader
                title={t('accountManagement.title', 'Account Management')}
                subtitle={t('accountManagement.subtitle', 'Choose whether you want to manage teacher or student accounts for your entity.')}
            />

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-white p-6 shadow-sm">
                <AccountManagementList />
            </div>
        </div>
    );
};

export default AccountManagementPage;

