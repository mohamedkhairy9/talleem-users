import React from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardCheckIcon } from '@/globals/icons';
const HalaqaAdditionalInfo = ({ durationInDays, weeklyHoliday, evaluationSystem, totalMark }) => {
    const { t } = useTranslation();
    if (!durationInDays && !weeklyHoliday && !evaluationSystem && totalMark == null) {
        return null;
    }
    return (<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-orange-100 rounded-lg">
                    <ClipboardCheckIcon width={20} height={20} className="text-orange-600"/>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">{t('halaqa.extraInfo', 'Additional Info')}</h2>
            </div>
            <div className="space-y-4">
                {weeklyHoliday && (<div className="pb-4 border-b border-gray-200 last:border-0 last:pb-0">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                            {t('halaqa.weeklyHoliday', 'Weekly holiday')}
                        </p>
                        <p className="text-lg font-semibold text-gray-900">{weeklyHoliday}</p>
                    </div>)}
                {evaluationSystem && (<div className="pb-4 border-b border-gray-200 last:border-0 last:pb-0">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                            {t('halaqa.evaluationSystem', 'Evaluation system')}
                        </p>
                        <p className="text-lg font-semibold text-gray-900">{evaluationSystem}</p>
                    </div>)}
                {totalMark != null && (<div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                            {t('halaqa.totalMark', 'Total mark')}
                        </p>
                        <p className="text-lg font-semibold text-gray-900">{totalMark}</p>
                    </div>)}
            </div>
        </div>);
};
export default HalaqaAdditionalInfo;
