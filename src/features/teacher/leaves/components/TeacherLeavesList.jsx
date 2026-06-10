import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { Table } from '@/shared/components';
import { useTeacherLeaves, useCancelTeacherLeave } from '../hooks/useTeacherLeaves';
import TeacherLeavesListMobile from './TeacherLeavesListMobile';
import { createTeacherLeavesListColumns } from '../config/table.config';
import { getErrorMessage } from '@/shared/utils/helpers/errorHandler';
import { useDateFormatStore } from '@/app/stores';
const TeacherLeavesList = () => {
    const { t } = useTranslation();
    useDateFormatStore((s) => s.dateFormat); // re-render when date format changes
    const { list, isLoading, error } = useTeacherLeaves();
    const cancelMutation = useCancelTeacherLeave();
    const [cancellingId, setCancellingId] = useState(null);
    const handleCancel = useCallback((item) => {
        setCancellingId(item.id);
        cancelMutation.mutate(item.id, {
            onSuccess: () => toast.success(t('leaves.cancelSuccess', 'Leave request cancelled.')),
            onError: (err) => toast.error(getErrorMessage(err)),
            onSettled: () => setCancellingId(null)
        });
    }, [cancelMutation, t]);
    const columns = useMemo(() => createTeacherLeavesListColumns({ t, onCancel: handleCancel, isCancellingId: cancellingId }), [t, handleCancel, cancellingId]);
    if (error) {
        return (<div className="text-center py-12 text-red-600">
                {t('leaves.loadError', 'Error loading leaves. Please try again.')}
            </div>);
    }
    return (<div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex flex-1 flex-col overflow-hidden md:hidden min-h-[280px] bg-white rounded-lg">
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
                    <TeacherLeavesListMobile list={list} isLoading={isLoading} hasError={!!error} errorMessage={error ? t('leaves.loadError') : undefined} emptyMessage={t('leaves.noLeaves', 'No leaves yet.')} onCancel={handleCancel} cancellingId={cancellingId}/>
                </div>
            </div>
            <div className="hidden md:flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="flex-1 min-h-0 overflow-hidden">
                    <Table columns={columns} data={list} loading={isLoading} emptyMessage={t('leaves.noLeaves', 'No leaves yet.')} scrollable/>
                </div>
            </div>
        </div>);
};
export default TeacherLeavesList;
