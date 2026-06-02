import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader, Button } from '@/globals/components';
import { PlusIcon } from '@/globals/icons';
import GivenEvaluationsList from '@/features/teacher/evaluations/components/GivenEvaluationsList';
import CreateEvaluationModal from '@/features/teacher/evaluations/components/CreateEvaluationModal';
/**
 * Teacher Given Evaluations Page
 * Lists evaluations the teacher has submitted; create new via modal.
 */
const TeacherEvaluationsGivenPage = () => {
    const { t } = useTranslation();
    const [createModalOpen, setCreateModalOpen] = useState(false);
    return (<div className="flex min-h-full flex-col space-y-6">
            <PageHeader title={t('evaluations.givenTitle', 'Given Evaluations')} subtitle={t('evaluations.givenSubtitle', 'Evaluations you have submitted')}/>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-white shadow-sm border border-gray-200">
                <div className="flex-shrink-0 flex items-center justify-between gap-4 p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {t('evaluations.listTitle', 'Evaluations')}
                    </h2>
                    <Button type="button" variant="primary" onClick={() => setCreateModalOpen(true)} className="flex items-center gap-2">
                        <PlusIcon width={18} height={18}/>
                        {t('evaluations.createEvaluation', 'Create Evaluation')}
                    </Button>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden p-6">
                    <GivenEvaluationsList />
                </div>
            </div>
            <CreateEvaluationModal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} onSuccess={() => setCreateModalOpen(false)}/>
        </div>);
};
export default TeacherEvaluationsGivenPage;
