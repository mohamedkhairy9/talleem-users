import React from 'react';
import { useTranslation } from 'react-i18next';
import WarningsManagementPageContent from '@/features/entity-manager/warnings/components/WarningsManagementPageContent';
/**
 * Warnings Page
 * Displays all warnings and allows creating new warnings
 */
const WarningsPage = () => {
    const { t } = useTranslation();
    return (
        <WarningsManagementPageContent
            title={t('warning.listTitle', 'Warnings')}
            subtitle={t('warning.listDescription', 'Manage and view all warnings')}
            scope="all"
            showCreateButton
        />
    );
};
export default WarningsPage;
