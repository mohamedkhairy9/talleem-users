import React from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/globals/components';
import TeacherHalaqaList from '@/features/teacher/halaqas/components/TeacherHalaqaList';
/**
 * My Halaqas Page
 * Displays active halaqas for teachers
 */
const MyHalaqasPage = () => {
    const { t } = useTranslation();
    return (<div className="flex min-h-full flex-col space-y-6">
            <PageHeader title={t('halaqa.myHalaqas', 'My Halaqas')} subtitle={t('halaqa.myHalaqasDescription', 'View and manage your active halaqas')}/>
            {/* List area: takes remaining height so table/cards can scroll inside */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-white shadow-sm p-6">
                <TeacherHalaqaList />
            </div>
        </div>);
};
export default MyHalaqasPage;
