import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Table } from '@/globals/components';
import { useTeacherHalaqas } from '../hooks/useTeacherHalaqas';
import TeacherHalaqaListMobile from './TeacherHalaqaListMobile';
import { createTeacherHalaqaListColumns } from '../config/table.config';
import { useDateFormatStore } from '@/stores';
/**
 * Teacher Halaqa List Component
 * Displays active halaqas for the teacher
 */
const TeacherHalaqaList = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { lang } = useParams();
    const currentLang = i18n.language || lang || 'ar';
    useDateFormatStore((s) => s.dateFormat); // re-render when date format changes
    const { list, isLoading, error } = useTeacherHalaqas();
    const getLocalizedText = (obj) => {
        if (typeof obj === 'string')
            return obj;
        if (!obj)
            return t('common.not_available', 'N/A');
        if (currentLang === 'ar' && obj.ar)
            return obj.ar;
        if (obj.en)
            return obj.en;
        return t('common.not_available', 'N/A');
    };
    const formatActivities = (activities) => {
        if (!activities?.length)
            return '-';
        return activities.map((a) => t(`halaqa.activity.${a}`, a)).join(', ');
    };
    const handleView = (id) => {
        navigate(`/${lang || currentLang}/halaqaty/${id}`);
    };
    const columns = createTeacherHalaqaListColumns({
        t,
        getLocalizedText,
        formatActivities
    });
    if (error) {
        return (<div className="text-center py-12 text-red-600">
                {t('halaqa.loadError', 'Error loading halaqas. Please try again.')}
            </div>);
    }
    return (<div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Mobile: cards */}
            <div className="flex flex-1 flex-col overflow-hidden md:hidden min-h-[280px] bg-white rounded-lg">
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
                    <TeacherHalaqaListMobile list={list} isLoading={isLoading} hasError={!!error} errorMessage={error ? t('halaqa.loadError', 'Error loading halaqas.') : undefined} emptyMessage={t('halaqa.noHalaqas', 'No halaqas found')} getLocalizedText={getLocalizedText} formatActivities={formatActivities} onView={handleView}/>
                </div>
            </div>

            {/* Desktop: table with scroll */}
            <div className="hidden md:flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="flex-1 min-h-0 overflow-hidden">
                    <Table columns={columns} data={list} loading={isLoading} emptyMessage={t('halaqa.noHalaqas', 'No halaqas found')} scrollable actionButtons={{
            showView: true,
            showEdit: false,
            showDelete: false,
            onView: (row) => handleView(row.halaqa.id),
            getRowId: (row) => row.halaqa.id
        }}/>
                </div>
            </div>
        </div>);
};
export default TeacherHalaqaList;
