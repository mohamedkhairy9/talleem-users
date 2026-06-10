import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CreateHalaqaForm from '@/features/entity-manager/halaqas/components/CreateHalaqaForm';

/**
 * Create Halaqa Page
 */
const CreateHalaqaPage = () => {
    const { lang } = useParams();
    const navigate = useNavigate();

    const handleBack = () => {
        navigate(`/${lang || 'ar'}/halaqas`);
    };

    return (
        <div className="min-h-full bg-[radial-gradient(circle_at_top,#d8ece8_0%,#eff4f7_28%,#f5f7fa_100%)] px-4 py-6 md:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
                <CreateHalaqaForm onBack={handleBack} />
            </div>
        </div>
    );
};

export default CreateHalaqaPage;
