import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, Pagination } from '@/globals/components';
import { useTeacherStudents } from '../hooks/useCertificates';
import TeacherCertificatesListMobile from './TeacherCertificatesListMobile';
import StudentCertificatesModal from './StudentCertificatesModal';
import { createTeacherCertificatesListColumns } from '../config/table.config';
import type { TeacherStudentListItem } from '../types/certificates.types';
import { getLocalizedText as getLocalizedTextHelper } from '@/utils/helpers/getLocalizedText';

const PER_PAGE = 15;

/**
 * Teacher Certificates List
 * Responsive: cards on mobile, table on desktop. Opens StudentCertificatesModal for selected student.
 */
const TeacherCertificatesList: React.FC = () => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'ar';

    const [page, setPage] = useState(1);
    const [certificatesStudentId, setCertificatesStudentId] = useState<number | null>(null);

    const params = useMemo(() => ({ page, per_page: PER_PAGE }), [page]);
    const { list, meta, isLoading, error } = useTeacherStudents(params);

    const getLocalizedText = useCallback(
        (obj: Parameters<typeof getLocalizedTextHelper>[0]) =>
            getLocalizedTextHelper(obj, currentLang, t('common.not_available', 'N/A')),
        [currentLang, t]
    );

    const onViewCertificates = useCallback((row: TeacherStudentListItem) => {
        setCertificatesStudentId(row.id);
    }, []);

    const columns = useMemo(
        () => createTeacherCertificatesListColumns({ t, getLocalizedText, onViewCertificates }),
        [t, getLocalizedText, onViewCertificates]
    );

    const total = meta?.total ?? 0;
    const totalPages = meta?.last_page ?? 1;
    const currentPage = meta?.current_page ?? page;

    if (error) {
        return (
            <div className="text-center py-12 text-red-600">
                {t('certificates.loadError', 'Error loading students. Please try again.')}
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                {/* Mobile: cards */}
                <div className="flex flex-1 flex-col overflow-hidden md:hidden min-h-[280px] bg-white rounded-lg">
                    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
                        <TeacherCertificatesListMobile
                            list={list}
                            isLoading={isLoading}
                            hasError={!!error}
                            errorMessage={error ? t('certificates.loadError', 'Error loading students.') : undefined}
                            emptyMessage={t('certificates.noStudents', 'No students yet.')}
                            getLocalizedText={getLocalizedText}
                            onViewCertificates={onViewCertificates}
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
                            emptyMessage={t('certificates.noStudents', 'No students yet.')}
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

            <StudentCertificatesModal
                isOpen={certificatesStudentId != null}
                studentId={certificatesStudentId}
                onClose={() => setCertificatesStudentId(null)}
            />
        </>
    );
};

export default TeacherCertificatesList;
