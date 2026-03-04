import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, Pagination } from '@/globals/components';
import { useTeacherWarnings } from '../hooks/useTeacherWarnings';
import TeacherWarningsListMobile from './TeacherWarningsListMobile';
import { createTeacherWarningsListColumns } from '../config/table.config';
import { getLocalizedText as getLocalizedTextHelper } from '@/utils/helpers/getLocalizedText';
import { useDateFormatStore } from '@/stores';

const PER_PAGE = 15;

/**
 * Teacher Warnings List
 * Responsive: cards on mobile, table on desktop (like halaqas list)
 */
const TeacherWarningsList: React.FC = () => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'ar';
    useDateFormatStore((s) => s.dateFormat);

    const [page, setPage] = useState(1);
    const params = useMemo(() => ({ page, per_page: PER_PAGE }), [page]);

    const { list, meta, isLoading, error } = useTeacherWarnings(params);

    const getLocalizedText = (obj: Parameters<typeof getLocalizedTextHelper>[0]) =>
        getLocalizedTextHelper(obj, currentLang, t('common.not_available', 'N/A'));

    const columns = useMemo(
        () => createTeacherWarningsListColumns({ t, getLocalizedText }),
        [t, currentLang]
    );

    const total = meta?.total ?? 0;
    const totalPages = meta?.last_page ?? 1;
    const currentPage = meta?.current_page ?? page;

    if (error) {
        return (
            <div className="text-center py-12 text-red-600">
                {t('warning.loadError', 'Error loading warnings. Please try again.')}
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Mobile: cards */}
            <div className="flex flex-1 flex-col overflow-hidden md:hidden min-h-[280px] bg-white rounded-lg">
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
                    <TeacherWarningsListMobile
                        list={list}
                        isLoading={isLoading}
                        hasError={!!error}
                        errorMessage={error ? t('warning.loadError', 'Error loading warnings.') : undefined}
                        emptyMessage={t('warning.noWarnings', 'No warnings found')}
                        getLocalizedText={getLocalizedText}
                    />
                </div>
                {totalPages > 1 && (
                    <div className="flex-shrink-0 border-t border-gray-200 pt-3 px-4 pb-4">
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

            {/* Desktop: table with scroll */}
            <div className="hidden md:flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="flex-1 min-h-0 overflow-hidden">
                    <Table
                        columns={columns}
                        data={list}
                        loading={isLoading}
                        emptyMessage={t('warning.noWarnings', 'No warnings found')}
                        scrollable
                    />
                </div>
                {totalPages > 1 && (
                    <div className="flex-shrink-0 border-t border-gray-200 pt-3 px-4">
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
        </div>
    );
};

export default TeacherWarningsList;
