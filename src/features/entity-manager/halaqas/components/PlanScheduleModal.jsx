import React from 'react';
import { useTranslation } from 'react-i18next';
import { XIcon } from '@/shared/icons';
import PlanDailySchedule from './PlanDailySchedule';
const PlanScheduleModal = ({ isOpen, onClose, dailySchedule, planTitle }) => {
    const { t } = useTranslation();
    if (!isOpen)
        return null;
    return (<div className="fixed inset-0 z-[60] overflow-y-auto">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black transition-opacity" style={{ opacity: 0.75 }} onClick={onClose} aria-hidden="true"/>

            {/* Modal */}
            <div className="relative flex min-h-full items-center justify-center p-4 pt-20 md:pt-24 z-10">
                <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[calc(100vh-5rem)] md:max-h-[calc(100vh-6rem)] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                {t('plan.dailySchedule', 'Daily Schedule')}
                            </h2>
                            {planTitle && (<p className="text-sm text-gray-600 mt-1">{planTitle}</p>)}
                            {dailySchedule && dailySchedule.length > 0 && (<p className="text-xs text-gray-500 mt-1">
                                    {dailySchedule.length} {t('plan.days', 'days')}
                                </p>)}
                        </div>
                        <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors" aria-label={t('common.close', 'Close')}>
                            <XIcon width={24} height={24}/>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(100vh-12rem)] md:max-h-[calc(100vh-14rem)]">
                        <PlanDailySchedule dailySchedule={dailySchedule} compact={false}/>
                    </div>
                </div>
            </div>
        </div>);
};
export default PlanScheduleModal;
