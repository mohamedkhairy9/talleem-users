import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/globals/components';
import { PlusIcon } from '@/globals/icons';
import WarningsList from '@/features/warnings/components/WarningsList';
import CreateWarningForm from '@/features/warnings/components/CreateWarningForm';

/**
 * Warnings Page
 * Displays all warnings and allows creating new warnings
 */
const WarningsPage: React.FC = () => {
    const { t } = useTranslation();
    const { lang } = useParams<{ lang: string }>();
    const [showCreateForm, setShowCreateForm] = useState(false);

    return (
        <div className="flex min-h-full flex-col space-y-6">
            <PageHeader
                title={t('warning.listTitle', 'Warnings')}
                subtitle={t('warning.listDescription', 'Manage and view all warnings')}
                actions={[
                    {
                        label: t('warning.create', 'Create Warning'),
                        onClick: () => setShowCreateForm(true),
                        variant: 'primary',
                        icon: <PlusIcon width={16} height={16} className="me-2" />
                    }
                ]}
            />

            {showCreateForm ? (
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                            {t('warning.createTitle', 'Create New Warning')}
                        </h2>
                        <button
                            onClick={() => setShowCreateForm(false)}
                            className="text-sm text-gray-600 hover:text-gray-900"
                        >
                            {t('common.back', 'Back to List')}
                        </button>
                    </div>
                    <CreateWarningForm onSuccess={() => setShowCreateForm(false)} />
                </div>
            ) : (
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-white shadow-sm p-6">
                    <WarningsList />
                </div>
            )}
        </div>
    );
};

export default WarningsPage;

