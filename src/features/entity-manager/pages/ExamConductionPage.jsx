import React from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/shared/components';
import ExamConductionWorkspace from '@/features/entity-manager/exam-conduction/components/ExamConductionWorkspace';

const ExamConductionPage = () => {
    const { t } = useTranslation();

    return (
        <div className="flex min-h-full flex-col space-y-6">
            <PageHeader
                title={t('examConduction.title', 'Exam Conduction')}
                subtitle={t('examConduction.subtitle', 'Manage and conduct today exams for your entity.')}
            />

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-white p-6 shadow-sm">
                <ExamConductionWorkspace />
            </div>
        </div>
    );
};

export default ExamConductionPage;
