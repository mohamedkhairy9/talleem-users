import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/shared/components';
import { PlusIcon } from '@/shared/icons';
import ScheduledActivitiesList from '@/features/entity-manager/scheduled-activities/components/ScheduledActivitiesList';

const ScheduledActivitiesPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { lang } = useParams();

    const handleCreate = () => {
        navigate(`/${lang || 'ar'}/scheduled-activities/create`);
    };

    return (
        <div className="flex min-h-full flex-col space-y-6">
            <PageHeader
                title={t('scheduledActivities.listTitle', 'Scheduled Activities')}
                subtitle={t('scheduledActivities.listSubtitle', 'Review the scheduled activities created for your entity.')}
                actions={[
                    {
                        label: t('scheduledActivities.create', 'Create Scheduled Activity'),
                        onClick: handleCreate,
                        variant: 'primary',
                        icon: <PlusIcon width={16} height={16} className="me-2" />
                    }
                ]}
            />

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-white p-6 shadow-sm">
                <ScheduledActivitiesList />
            </div>
        </div>
    );
};

export default ScheduledActivitiesPage;

