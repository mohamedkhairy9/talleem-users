import React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/globals/components';
import CreateHalaqaForm from '@/features/entity-manager/halaqas/components/CreateHalaqaForm';

/**
 * Create Halaqa Page
 */
const CreateHalaqaPage: React.FC = () => {
    const { t } = useTranslation();
    const { lang } = useParams<{ lang: string }>();
    const navigate = useNavigate();

    const handleBack = () => {
        navigate(`/${lang || 'en'}/halaqas`);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title={t('halaqa.createTitle', 'Create Halaqa')}
                subtitle={t('halaqa.createDescription', 'Fill in the form below to create a new halaqa')}
                breadcrumb={{
                    label: t('common.back', 'Back to Halaqas'),
                    onClick: handleBack
                }}
            />
            <div className="bg-white rounded-lg shadow-sm p-6">
                <CreateHalaqaForm />
            </div>
        </div>
    );
};

export default CreateHalaqaPage;

