import React from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/shared/components';
import TeacherWarningsList from '@/features/teacher/warnings/components/TeacherWarningsList';
/**
 * Teacher Warnings Page
 * Read-only list of warnings for the current teacher (GET /teacher/warnings)
 */
const TeacherWarningsPage = () => {
    const { t } = useTranslation();
    return (<div className="flex min-h-full flex-col space-y-6">
            <PageHeader title={t('teacherWarnings.title', 'My Warnings')} subtitle={t('teacherWarnings.subtitle', 'View your recorded warnings')}/>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-white shadow-sm p-6">
                <TeacherWarningsList />
            </div>
        </div>);
};
export default TeacherWarningsPage;
