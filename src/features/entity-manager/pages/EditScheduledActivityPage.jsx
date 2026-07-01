import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, PageHeader } from '@/shared/components';
import { AlertTriangleIcon } from '@/shared/icons';
import CreateScheduledActivityForm from '@/features/entity-manager/scheduled-activities/components/CreateScheduledActivityForm';
import { useScheduledActivity } from '@/features/entity-manager/scheduled-activities/hooks/useScheduledActivities';

const EditScheduledActivityPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id, lang } = useParams();
    const { activity, isLoading, error } = useScheduledActivity(id || '');

    const handleBack = () => {
        navigate(`/${lang || 'ar'}/scheduled-activities/${id}`);
    };

    if (isLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
                    <p className="text-sm text-gray-600">{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    if (error || !activity) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
                <div className="text-center">
                    <AlertTriangleIcon width={64} height={64} className="mx-auto mb-4 text-red-500" />
                    <h2 className="mb-2 text-2xl font-bold text-gray-900">{t('scheduledActivities.notFound', 'Scheduled activity not found.')}</h2>
                    <p className="text-gray-600">{error?.message || t('scheduledActivities.loadDetailError', 'Error loading scheduled activity details. Please try again.')}</p>
                </div>
                <Button type="button" variant="primary" onClick={() => navigate(`/${lang || 'ar'}/scheduled-activities`)}>
                    {t('scheduledActivities.backToList', 'Back to Scheduled Activities')}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={t('scheduledActivities.editTitle', 'Edit Scheduled Activity')}
                subtitle={t('scheduledActivities.editSubtitle', 'Update the scheduled activity details and assignments.')}
                breadcrumb={{
                    label: t('scheduledActivities.backToList', 'Back to Scheduled Activities'),
                    onClick: handleBack
                }}
            />

            <div className="rounded-lg bg-white p-6 shadow-sm">
                <CreateScheduledActivityForm mode="edit" activityId={id} initialActivity={activity} />
            </div>
        </div>
    );
};

export default EditScheduledActivityPage;
