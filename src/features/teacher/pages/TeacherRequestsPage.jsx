import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader, Button } from '@/shared/components';
import { PlusIcon } from '@/shared/icons';
import CreateRequestModal from '@/features/teacher/requests/components/CreateRequestModal';
import RequestDetailModal from '@/features/teacher/requests/components/RequestDetailModal';
import TeacherRequestsList from '@/features/teacher/requests/components/TeacherRequestsList';
/**
 * Teacher Requests Page
 * List teacher requests and create new ones via modal (RHF + Yup, request types from /teacher-requests/request-types)
 */
const TeacherRequestsPage = () => {
    const { t } = useTranslation();
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [detailRequestId, setDetailRequestId] = useState(null);
    return (<div className="flex min-h-full flex-col space-y-6">
            <PageHeader title={t('teacherRequests.title', 'My Requests')} subtitle={t('teacherRequests.subtitle', 'View and submit teacher requests')}/>

            <div className="flex flex-col flex-1 min-h-0 overflow-hidden rounded-lg bg-white shadow-sm border border-gray-200">
                <div className="flex-shrink-0 flex items-center justify-between gap-4 p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {t('teacherRequests.listTitle', 'Requests')}
                    </h2>
                    <Button type="button" variant="primary" onClick={() => setCreateModalOpen(true)} className="flex items-center gap-2">
                        <PlusIcon width={18} height={18}/>
                        {t('teacherRequests.createRequest', 'Create Request')}
                    </Button>
                </div>

                <div className="flex-1 min-h-0 overflow-hidden p-6">
                    <TeacherRequestsList onView={setDetailRequestId}/>
                </div>
            </div>

            <CreateRequestModal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} onSuccess={() => setCreateModalOpen(false)}/>

            <RequestDetailModal isOpen={detailRequestId != null} requestId={detailRequestId} onClose={() => setDetailRequestId(null)}/>
        </div>);
};
export default TeacherRequestsPage;
