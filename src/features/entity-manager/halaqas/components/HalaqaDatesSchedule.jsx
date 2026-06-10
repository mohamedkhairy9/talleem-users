import React from 'react';
import { useTranslation } from 'react-i18next';
import { FormattedDate } from '@/shared/components/ui';
import { CalendarIcon } from '@/shared/icons';
const HalaqaDatesSchedule = ({ startDate, endDate, sessionTime }) => {

    const { t } = useTranslation();
    return (<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
                <CalendarIcon width={20} height={20} className="text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
                {t('halaqa.datesAndSchedule')}
            </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {startDate && (<div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {t('halaqa.startDate', 'Start Date')}
                </p>
                <p className="text-base font-medium text-gray-900">
                    <FormattedDate value={startDate} />
                </p>
            </div>)}
            {endDate && (<div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {t('halaqa.endDate', 'End Date')}
                </p>
                <p className="text-base font-medium text-gray-900">
                    <FormattedDate value={endDate} />
                </p>
            </div>)}
            {sessionTime && (<div className="space-y-1 md:col-span-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {t('halaqa.sessionTime', 'Session Time')}
                </p>
                <p className="text-base font-medium text-gray-900">{sessionTime}</p>
            </div>)}
        </div>
    </div>);
};
export default HalaqaDatesSchedule;
