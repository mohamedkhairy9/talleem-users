import React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/globals/components';
import EditHalaqaForm from '@/features/halaqas/components/EditHalaqaForm';

/**
 * Edit Halaqa Page
 */
const EditHalaqaPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { id, lang } = useParams<{ id: string; lang: string }>();
    const navigate = useNavigate();
    const currentLang = i18n.language || lang || 'en';

    const handleBack = () => {
        navigate(`/${lang || currentLang}/halaqas/${id}`);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title={t('halaqa.editTitle', 'Edit Halaqa')}
                subtitle={t('halaqa.editDescription', 'Update the halaqa information below')}
                breadcrumb={{
                    label: t('common.back', 'Back'),
                    onClick: handleBack
                }}
                currentLang={currentLang}
            />
            <div className="bg-white rounded-lg shadow-sm p-6">
                <EditHalaqaForm />
            </div>
        </div>
    );
};

export default EditHalaqaPage;



