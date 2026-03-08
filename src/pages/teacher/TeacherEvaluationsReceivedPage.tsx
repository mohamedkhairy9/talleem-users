import React from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/globals/components';
import ReceivedEvaluationsList from '@/features/teacher/evaluations/components/ReceivedEvaluationsList';

/**
 * Teacher Received Evaluations Page
 * Evaluations that others have given to the teacher (GET /teacher/evaluations/received)
 */
const TeacherEvaluationsReceivedPage: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="flex min-h-full flex-col space-y-6">
            <PageHeader
                title={t('evaluations.receivedTitle', 'Received Evaluations')}
                subtitle={t('evaluations.receivedSubtitle', 'Evaluations others have given you')}
            />
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-white shadow-sm border border-gray-200">
                <div className="flex-shrink-0 flex items-center justify-between gap-4 p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {t('evaluations.listTitle', 'Evaluations')}
                    </h2>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden p-6">
                    <ReceivedEvaluationsList />
                </div>
            </div>
        </div>
    );
};

export default TeacherEvaluationsReceivedPage;
