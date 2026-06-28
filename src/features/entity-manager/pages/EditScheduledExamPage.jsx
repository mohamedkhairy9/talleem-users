import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, PageHeader } from '@/shared/components';
import { AlertTriangleIcon } from '@/shared/icons';
import CreateScheduledExamForm from '@/features/entity-manager/scheduled-exams/components/CreateScheduledExamForm';
import { useScheduledExam } from '@/features/entity-manager/scheduled-exams/hooks/useScheduledExams';

const EditScheduledExamPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id, lang } = useParams();
    const { exam, isLoading, error } = useScheduledExam(id || '');

    const handleBack = () => {
        navigate(`/${lang || 'ar'}/scheduled-exams/${id}`);
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

    if (error || !exam) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
                <div className="text-center">
                    <AlertTriangleIcon width={64} height={64} className="mx-auto mb-4 text-red-500" />
                    <h2 className="mb-2 text-2xl font-bold text-gray-900">{t('scheduledExams.notFound', 'Scheduled exam not found.')}</h2>
                    <p className="text-gray-600">{error?.message || t('scheduledExams.loadDetailError', 'Error loading scheduled exam details. Please try again.')}</p>
                </div>
                <Button type="button" variant="primary" onClick={handleBack}>
                    {t('scheduledExams.backToList', 'Back to Scheduled Exams')}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={t('scheduledExams.editTitle', 'Edit Scheduled Exam')}
                subtitle={t('scheduledExams.editSubtitle', 'Update the scheduled exam details and assignments.')}
                breadcrumb={{
                    label: t('scheduledExams.backToList', 'Back to Scheduled Exams'),
                    onClick: handleBack
                }}
            />

            <div className="rounded-lg bg-white p-6 shadow-sm">
                <CreateScheduledExamForm mode="edit" examId={id || ''} initialExam={exam} />
            </div>
        </div>
    );
};

export default EditScheduledExamPage;
