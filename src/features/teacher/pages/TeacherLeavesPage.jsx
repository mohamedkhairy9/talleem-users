import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader, Button } from '@/shared/components';
import { PlusIcon } from '@/shared/icons';
import TeacherLeavesList from '@/features/teacher/leaves/components/TeacherLeavesList';
import CreateLeaveModal from '@/features/teacher/leaves/components/CreateLeaveModal';
const TeacherLeavesPage = () => {
    const { t } = useTranslation();
    const [createModalOpen, setCreateModalOpen] = useState(false);
    return (<div className="flex min-h-full flex-col space-y-6">
            <PageHeader title={t('leaves.title', 'My Leaves')} subtitle={t('leaves.subtitle', 'View and request leaves')}/>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-white shadow-sm border border-gray-200">
                <div className="flex-shrink-0 flex items-center justify-between gap-4 p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">{t('leaves.listTitle', 'Leaves')}</h2>
                    <Button type="button" variant="primary" onClick={() => setCreateModalOpen(true)} className="flex items-center gap-2">
                        <PlusIcon width={18} height={18}/>
                        {t('leaves.createLeave', 'Create Leave Request')}
                    </Button>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden p-6">
                    <TeacherLeavesList />
                </div>
            </div>
            <CreateLeaveModal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} onSuccess={() => setCreateModalOpen(false)}/>
        </div>);
};
export default TeacherLeavesPage;
