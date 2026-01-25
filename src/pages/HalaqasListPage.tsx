import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/globals/components';
import HalaqaList from '@/features/halaqas/components/HalaqaList';

/**
 * Halaqas List Page
 * Displays all halaqas for entity managers
 */
const HalaqasListPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { lang } = useParams<{ lang: string }>();

    const handleCreate = () => {
        navigate(`/${lang || 'en'}/create-halaqa`);
    };

    return (
        <div className="p-6">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {t('halaqa.listTitle', 'Halaqas')}
                    </h1>
                    <p className="text-gray-600">
                        {t('halaqa.listDescription', 'Manage and view all halaqas')}
                    </p>
                </div>
                <Button
                    type="button"
                    variant="primary"
                    onClick={handleCreate}
                >
                    {t('halaqa.create', 'Create Halaqa')}
                </Button>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
                <HalaqaList />
            </div>
        </div>
    );
};

export default HalaqasListPage;

