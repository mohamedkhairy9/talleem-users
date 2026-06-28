import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/shared/components';
import { PlusIcon } from '@/shared/icons';
import ScheduledExamsList from '@/features/entity-manager/scheduled-exams/components/ScheduledExamsList';

const ScheduledExamsPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { lang } = useParams();

    const handleCreate = () => {
        navigate(`/${lang || 'ar'}/scheduled-exams/create`);
    };

    return (
        <div className="flex min-h-full flex-col space-y-6">
            <PageHeader
                title={t('scheduledExams.listTitle', 'Scheduled Exams')}
                subtitle={t('scheduledExams.listSubtitle', 'Review the scheduled exams created for your entity.')}
                actions={[
                    {
                        label: t('scheduledExams.create', 'Create Scheduled Exam'),
                        onClick: handleCreate,
                        variant: 'primary',
                        icon: <PlusIcon width={16} height={16} className="me-2" />
                    }
                ]}
            />

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-white p-6 shadow-sm">
                <ScheduledExamsList />
            </div>
        </div>
    );
};

export default ScheduledExamsPage;
