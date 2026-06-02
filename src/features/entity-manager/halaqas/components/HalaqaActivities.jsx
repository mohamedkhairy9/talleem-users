import React from 'react';
import { useTranslation } from 'react-i18next';
import { BookIcon } from '@/globals/icons';
const HalaqaActivities = ({ activities }) => {
    const { t } = useTranslation();
    if (!activities || activities.length === 0)
        return null;
    return (<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                    <BookIcon width={20} height={20} className="text-purple-600"/>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                    {t('halaqa.activities', 'Activities')}
                </h2>
            </div>
            <div className="flex flex-wrap gap-2">
                {activities.map((activity, index) => (<span key={index} className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 border border-purple-200">
                        {String(t(`halaqa.activity.${activity}`, activity))}
                    </span>))}
            </div>
        </div>);
};
export default HalaqaActivities;
