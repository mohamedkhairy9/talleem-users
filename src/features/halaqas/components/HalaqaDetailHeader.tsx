import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/globals/components';
import {
    ChevronRightIcon,
    EditIcon,
    CalendarIcon,
    CircleIcon
} from '@/globals/icons';

interface HalaqaDetailHeaderProps {
    name: string;
    entityType?: { en?: string; ar?: string };
    period?: string;
    currentLang: string;
    onBack: () => void;
    onEdit: () => void;
    getLocalizedText: (obj: { en?: string; ar?: string } | string | null | undefined) => string;
}

const HalaqaDetailHeader: React.FC<HalaqaDetailHeaderProps> = ({
    name,
    entityType,
    period,
    currentLang,
    onBack,
    onEdit,
    getLocalizedText
}) => {
    const { t } = useTranslation();

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-8">
                <div className="flex items-center gap-2 text-white/90 mb-4 text-sm">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-1 hover:text-white transition-colors"
                    >
                        <ChevronRightIcon 
                            width={16} 
                            height={16} 
                            className={`transform ${currentLang === 'ar' ? 'rotate-180' : ''}`}
                        />
                        <span>{t('halaqa.backToHalaqas', 'Back to Halaqas')}</span>
                    </button>
                </div>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            {name}
                        </h1>
                        <div className="flex flex-wrap items-center gap-3 text-white/90">
                            {entityType && (
                                <span className="flex items-center gap-1.5 text-sm">
                                    <CircleIcon width={16} height={16} />
                                    {getLocalizedText(entityType)}
                                </span>
                            )}
                            {period && (
                                <span className="flex items-center gap-1.5 text-sm">
                                    <CalendarIcon width={16} height={16} />
                                    {String(t(`halaqa.period.${period}`, period))}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            type="button" 
                            variant="primary" 
                            onClick={onEdit}
                            className="!bg-white !text-primary-600 hover:!bg-gray-100"
                        >
                            <EditIcon width={16} height={16} className="me-2" />
                            {t('common.edit', 'Edit')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HalaqaDetailHeader;

