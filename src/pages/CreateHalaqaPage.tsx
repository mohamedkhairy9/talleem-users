import React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/globals/components';
import CreateHalaqaForm from '@/features/halaqas/components/CreateHalaqaForm';

/**
 * Create Halaqa Page
 */
const CreateHalaqaPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { lang } = useParams<{ lang: string }>();
    const navigate = useNavigate();
    const currentLang = i18n.language || lang || 'en';

    const handleBack = () => {
        navigate(`/${lang || currentLang}/halaqas`);
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
                currentLang={currentLang}
            />
            <div className="bg-white rounded-lg shadow-sm p-6">
                <CreateHalaqaForm />
            </div>
        </div>
    );
};

export default CreateHalaqaPage;

