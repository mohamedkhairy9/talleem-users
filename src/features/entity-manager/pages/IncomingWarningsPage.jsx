import React from 'react';
import { useTranslation } from 'react-i18next';
import WarningsManagementPageContent from '@/features/entity-manager/warnings/components/WarningsManagementPageContent';
/**
 * Incoming warnings page.
 * Shows warnings created by other users within the current warnings scope.
 */
const IncomingWarningsPage = () => {
    const { t } = useTranslation();
    return (
        <WarningsManagementPageContent
            title={t('menu.incomingWarnings', 'Incoming Warnings')}
            subtitle={t('warning.listDescription', 'Manage and view all warnings')}
            scope="incoming"
        />
    );
};
export default IncomingWarningsPage;
