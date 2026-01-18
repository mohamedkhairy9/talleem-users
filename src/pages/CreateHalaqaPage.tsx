import React from 'react';
import { useTranslation } from 'react-i18next';
import CreateHalaqaForm from '@/features/halaqas/components/CreateHalaqaForm';

/**
 * Create Halaqa Page
 */
const CreateHalaqaPage: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {t('halaqa.createTitle', 'Create Halaqa')}
                </h1>
                <p className="text-gray-600">
                    {t('halaqa.createDescription', 'Fill in the form below to create a new halaqa')}
                </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
                <CreateHalaqaForm />
            </div>
        </div>
    );
};

export default CreateHalaqaPage;

