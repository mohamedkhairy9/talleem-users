import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/shared/components';
import CreateScheduledExamForm from '@/features/entity-manager/scheduled-exams/components/CreateScheduledExamForm';

const CreateScheduledExamPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { lang } = useParams();

    const handleBack = () => {
        navigate(`/${lang || 'ar'}/halaqas`);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title={t('scheduledExams.title', 'Create Scheduled Exam')}
                subtitle={t('scheduledExams.subtitle', 'Plan a supervised exam session for selected students and optionally assign teachers.')}
                breadcrumb={{
                    label: t('common.back', 'Back'),
                    onClick: handleBack
                }}
            />

            <div className="rounded-lg bg-white p-6 shadow-sm">
                <CreateScheduledExamForm />
            </div>
        </div>
    );
};

export default CreateScheduledExamPage;
