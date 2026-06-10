import React from 'react';
import { useTranslation } from 'react-i18next';
import WarningsManagementPageContent from '@/features/entity-manager/warnings/components/WarningsManagementPageContent';
/**
 * Warnings issued page.
 * Shows warnings created by the current user and keeps the create flow available.
 */
const WarningsIssuedPage = () => {
    const { t } = useTranslation();
    return (
        <>
            <WarningsManagementPageContent
                title={t('menu.warningsIssued', 'Warnings Issued')}
                subtitle={t('warning.listDescription', 'Manage and view all warnings')}
                scope="issued"
                showCreateButton
            />
        </>
    );
};
export default WarningsIssuedPage;
