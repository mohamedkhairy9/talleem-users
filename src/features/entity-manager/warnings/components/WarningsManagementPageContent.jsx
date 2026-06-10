import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, PageHeader } from '@/shared/components';
import { PlusIcon } from '@/shared/icons';
import WarningsList from './WarningsList';
import CreateWarningForm from './CreateWarningForm';
/**
 * Shared warnings management page content.
 * Reused by the all-warnings, incoming, and issued views.
 */
const WarningsManagementPageContent = ({ title, subtitle, scope = 'all', showCreateButton = false }) => {
    const { t } = useTranslation();
    const [showCreateForm, setShowCreateForm] = useState(false);
    const actions = showCreateButton
        ? [
            {
                label: t('warning.create', 'Create Warning'),
                onClick: () => setShowCreateForm(true),
                variant: 'primary',
                icon: <PlusIcon width={16} height={16} className="me-2" />
            }
        ]
        : [];
    return (
        <div className="flex min-h-full flex-col space-y-6">
            <PageHeader title={title} subtitle={subtitle} actions={actions} />

            {showCreateForm ? (
                <div className="rounded-lg bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="mb-2 text-xl font-bold text-gray-900">
                            {t('warning.createTitle', 'Create New Warning')}
                        </h2>
                        <Button
                            onClick={() => setShowCreateForm(false)}
                            className="text-sm text-gray-600 hover:text-gray-900"
                            variant="outline"
                        >
                            {t('common.back', 'Back to List')}
                        </Button>
                    </div>
                    <CreateWarningForm
                        onSuccess={() => setShowCreateForm(false)}
                        onCancel={() => setShowCreateForm(false)}
                    />
                </div>
            ) : (
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-white p-6 shadow-sm">
                    <WarningsList scope={scope} />
                </div>
            )}
        </div>
    );
};
export default WarningsManagementPageContent;
