import React from 'react';
import { useTranslation } from 'react-i18next';
import { UsersIcon, BookOpenIcon, CalendarIcon, BookIcon } from '@/globals/icons';
const HalaqaQuickStats = ({ studentCount, maxStudents, plansCount, durationInDays, activitiesCount }) => {
    const { t } = useTranslation();
    const capacityPercentage = maxStudents && maxStudents > 0
        ? Math.round((studentCount / maxStudents) * 100)
        : 0;
    return (<div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-50 border-t border-gray-200">
            <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-gray-500 mb-1">
                    <UsersIcon width={18} height={18}/>
                    <span className="text-xs font-medium">{t('halaqa.students', 'Students')}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                    {studentCount}
                    {maxStudents && maxStudents > 0 && (<span className="text-sm font-normal text-gray-500">/{maxStudents}</span>)}
                </p>
                {maxStudents && maxStudents > 0 && (<div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${capacityPercentage >= 100 ? 'bg-red-500' :
                capacityPercentage >= 80 ? 'bg-yellow-500' :
                    'bg-green-500'}`} style={{ width: `${Math.min(capacityPercentage, 100)}%` }}/>
                    </div>)}
            </div>
            <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-gray-500 mb-1">
                    <BookOpenIcon width={18} height={18}/>
                    <span className="text-xs font-medium">{t('plan.plans', 'Plans')}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{plansCount}</p>
            </div>
            <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-gray-500 mb-1">
                    <CalendarIcon width={18} height={18}/>
                    <span className="text-xs font-medium">{t('halaqa.duration', 'Duration')}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                    {durationInDays ? `${durationInDays} ${t('common.days', 'days')}` : '-'}
                </p>
            </div>
            <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-gray-500 mb-1">
                    <BookIcon width={18} height={18}/>
                    <span className="text-xs font-medium">{t('halaqa.activities', 'Activities')}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{activitiesCount}</p>
            </div>
        </div>);
};
export default HalaqaQuickStats;
