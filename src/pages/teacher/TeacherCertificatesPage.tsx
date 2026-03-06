import React from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/globals/components';
import TeacherCertificatesList from '@/features/teacher/certificates/components/TeacherCertificatesList';

/**
 * Teacher Certificates Page
 * Lists the teacher's students; each student can open a modal with certificates.
 */
const TeacherCertificatesPage: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="flex min-h-full flex-col space-y-6">
            <PageHeader
                title={t('certificates.title', 'My Certificates')}
                subtitle={t('certificates.subtitle', 'View your students and their certificates')}
            />
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-white shadow-sm border border-gray-200">
                <div className="flex-shrink-0 flex items-center justify-between gap-4 p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {t('certificates.studentsList', 'Students')}
                    </h2>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden p-6">
                    <TeacherCertificatesList />
                </div>
            </div>
        </div>
    );
};

export default TeacherCertificatesPage;
