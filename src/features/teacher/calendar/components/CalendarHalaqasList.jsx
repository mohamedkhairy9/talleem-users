import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTeacherCalendar } from '../hooks/useCalendar';
import { getDisplayDate } from '@/utils';
import { useDateFormatStore } from '@/stores';
import { CircleIcon, CalendarIcon } from '@/globals/icons';
const CalendarHalaqasList = ({ getLocalizedText }) => {
    const { t } = useTranslation();
    useDateFormatStore((s) => s.dateFormat);
    const { halaqas, isLoading, error } = useTeacherCalendar();
    if (isLoading && halaqas.length === 0) {
        return (<div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600"/>
                    <p className="text-sm text-gray-600">{t('common.loading', 'Loading...')}</p>
                </div>
            </div>);
    }
    if (error) {
        return (<div className="rounded-lg bg-white p-8 text-center text-red-600 shadow-sm border border-gray-200">
                {t('calendar.loadError', 'Error loading calendar. Please try again.')}
            </div>);
    }
    if (halaqas.length === 0) {
        return (<div className="rounded-lg bg-white p-8 text-center text-gray-500 shadow-sm border border-gray-200">
                {t('calendar.noHalaqas', 'No halaqas in your calendar.')}
            </div>);
    }
    return (<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {halaqas.map((item) => (<div key={item.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                    <div className="mb-3 flex items-start gap-2">
                        <CircleIcon width={20} height={20} className="mt-0.5 shrink-0 text-primary-600"/>
                        <h3 className="text-base font-semibold text-gray-900">
                            {getLocalizedText(item.title) || t('calendar.halaqa', 'Halaqa')}
                        </h3>
                    </div>
                    <dl className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                            <CalendarIcon width={16} height={16} className="shrink-0 text-gray-400"/>
                            <span>{getDisplayDate(item.start_date)}</span>
                            <span className="text-gray-400">–</span>
                            <span>{getDisplayDate(item.end_date)}</span>
                        </div>
                        {item.session_time ? (<div className="flex justify-between gap-2">
                                <span className="text-gray-500">{t('calendar.sessionTime', 'Session time')}</span>
                                <span className="text-gray-900 font-medium">{item.session_time}</span>
                            </div>) : null}
                    </dl>
                </div>))}
        </div>);
};
export default CalendarHalaqasList;
