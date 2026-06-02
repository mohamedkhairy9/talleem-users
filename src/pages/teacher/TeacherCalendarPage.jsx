import React from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/globals/components';
import CalendarHalaqasList from '@/features/teacher/calendar/components/CalendarHalaqasList';
import { getLocalizedText as getLocalizedTextHelper } from '@/utils/helpers/getLocalizedText';
/**
 * Teacher Calendar Page (default home for teacher)
 * Shows halaqas with start/end dates and session times from GET /teacher/calendar
 */
const TeacherCalendarPage = () => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'ar';
    const getLocalizedText = (obj) => getLocalizedTextHelper(obj, currentLang, t('common.not_available', 'N/A'));
    return (<div className="flex min-h-full flex-col space-y-6">
            <PageHeader title={t('calendar.title', 'My Calendar')} subtitle={t('calendar.subtitle', 'Your halaqas and schedule')}/>
            <div className="flex-1 min-h-0">
                <CalendarHalaqasList getLocalizedText={getLocalizedText}/>
            </div>
        </div>);
};
export default TeacherCalendarPage;
