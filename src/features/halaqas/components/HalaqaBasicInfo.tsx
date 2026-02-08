import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    CircleIcon,
    TeacherIcon
} from '@/globals/icons';

interface HalaqaBasicInfoProps {
    name: string;
    teacher?: { en?: string; ar?: string };
    entityType?: { en?: string; ar?: string };
    period?: string;
    teachingMethod?: string;
    platform?: { en?: string; ar?: string };
    getLocalizedText: (obj: { en?: string; ar?: string } | string | null | undefined) => string;
}

const HalaqaBasicInfo: React.FC<HalaqaBasicInfoProps> = ({
    name,
    teacher,
    entityType,
    period,
    teachingMethod,
    platform,
    getLocalizedText
}) => {
    const { t } = useTranslation();

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-primary-100 rounded-lg">
                    <CircleIcon width={20} height={20} className="text-primary-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                    {t('halaqa.basicInfo', 'Basic Information')}
                </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {t('halaqa.name', 'Name')}
                    </p>
                    <p className="text-base font-medium text-gray-900">{name}</p>
                </div>
                {teacher && (
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                            <TeacherIcon width={14} height={14} />
                            {t('halaqa.teacher', 'Teacher')}
                        </p>
                        <p className="text-base font-medium text-gray-900">{getLocalizedText(teacher)}</p>
                    </div>
                )}
                {entityType && (
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            {t('halaqa.memorizationProgramEntityType', 'Entity Type')}
                        </p>
                        <p className="text-base font-medium text-gray-900">
                            {getLocalizedText(entityType)}
                        </p>
                    </div>
                )}
                {period && (
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            {t('halaqa.period', 'Period')}
                        </p>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {String(t(`halaqa.period.${period}`, period))}
                        </span>
                    </div>
                )}
                {teachingMethod && (
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            {t('halaqa.teachingMethod', 'Teaching Method')}
                        </p>
                        <p className="text-base font-medium text-gray-900">
                            {String(t(
                                `halaqa.teachingMethod.${teachingMethod === 'in_person' ? 'inPerson' : teachingMethod}`,
                                teachingMethod
                            ))}
                        </p>
                    </div>
                )}
                {platform && (
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            {t('halaqa.platform', 'Platform')}
                        </p>
                        <p className="text-base font-medium text-gray-900">{getLocalizedText(platform)}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HalaqaBasicInfo;

