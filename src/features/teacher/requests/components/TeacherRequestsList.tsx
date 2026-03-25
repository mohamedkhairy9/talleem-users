import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pagination, Table } from '@/globals/components';
import { useTeacherRequests } from '../hooks/useTeacherRequests';
import { createTeacherRequestsColumns } from '../config/table.config';
import { useDateFormatStore } from '@/stores';

const PER_PAGE = 15;

const TeacherRequestsList: React.FC<{
    onView: (id: number) => void;
}> = ({ onView }) => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'ar';
    useDateFormatStore((s) => s.dateFormat); // re-render when date format changes

    const [page, setPage] = useState(1);

    const params = useMemo(() => ({ page, per_page: PER_PAGE }), [page]);
    const { list, meta, isLoading, error } = useTeacherRequests(params);

    const total = meta?.total ?? 0;
    const totalPages = meta?.last_page ?? 1;
    const currentPage = meta?.current_page ?? page;

    const columns = useMemo(
        () => createTeacherRequestsColumns({ t, currentLang, onView }),
        [t, currentLang, onView]
    );

    if (error) {
        return (
            <div className="text-center py-12 text-red-600">
                {t('teacherRequests.loadError', 'Error loading requests. Please try again.')}
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 min-h-0 overflow-hidden">
                <Table
                    data={list}
                    columns={columns}
                    loading={isLoading}
                    emptyMessage={t('teacherRequests.noRequests', 'No requests yet.')}
                    scrollable
                />
            </div>

            {totalPages > 1 && (
                <div className="flex-shrink-0 border-t border-gray-200 pt-3 pb-4">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        perPage={meta?.per_page ?? PER_PAGE}
                        total={total}
                        onPageChange={setPage}
                    />
                </div>
            )}
        </div>
    );
};

export default TeacherRequestsList;

