import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/shared/components';
import CreateScheduledActivityForm from '@/features/entity-manager/scheduled-activities/components/CreateScheduledActivityForm';

const CreateScheduledActivityPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { lang } = useParams();

    const handleBack = () => {
        navigate(`/${lang || 'ar'}/scheduled-activities`);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title={t('scheduledActivities.title', 'Create Scheduled Activity')}
                subtitle={t('scheduledActivities.subtitle', 'Plan an activity for selected students and optionally assign teachers.')}
                breadcrumb={{
                    label: t('common.back', 'Back'),
                    onClick: handleBack
                }}
            />

            <div className="rounded-lg bg-white p-6 shadow-sm">
                <CreateScheduledActivityForm />
            </div>
        </div>
    );
};

export default CreateScheduledActivityPage;

