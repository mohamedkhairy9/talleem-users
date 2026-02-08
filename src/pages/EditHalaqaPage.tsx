import React from 'react';
import { useTranslation } from 'react-i18next';
import EditHalaqaForm from '@/features/halaqas/components/EditHalaqaForm';

/**
 * Edit Halaqa Page
 */
const EditHalaqaPage: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {t('halaqa.editTitle', 'Edit Halaqa')}
                </h1>
                <p className="text-gray-600">
                    {t('halaqa.editDescription', 'Update the halaqa information below')}
                </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
                <EditHalaqaForm />
            </div>
        </div>
    );
};

export default EditHalaqaPage;



