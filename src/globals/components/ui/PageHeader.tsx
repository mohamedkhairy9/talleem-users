import React from 'react';
import { useLocale } from '@/utils';
import { Button } from '@/globals/components';
import { ChevronRightIcon } from '@/globals/icons';

export interface PageHeaderAction {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
    icon?: React.ReactNode;
    className?: string;
}

export interface PageHeaderBadge {
    label: string;
    icon?: React.ReactNode;
    key?: string; // Optional key for better React list rendering
}

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    breadcrumb?: {
        label: string;
        onClick: () => void;
    };
    badges?: PageHeaderBadge[];
    actions?: PageHeaderAction[];
    currentLang?: string; // Optional override, defaults to auto-detection
    className?: string;
}

/**
 * PageHeader Component
 * A reusable header component for pages with gradient background, breadcrumb, title, badges, and actions
 */
const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    subtitle,
    breadcrumb,
    badges = [],
    actions = [],
    currentLang,
    className = ''
}) => {
    const { currentLocale } = useLocale();
    const lang = currentLang || currentLocale || 'ar';

    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-8">
                {breadcrumb && (
                    <div className="flex items-center gap-2 text-white/90 mb-4 text-sm">
                        <button
                            onClick={breadcrumb.onClick}
                            className="flex items-center gap-1 hover:text-white transition-colors"
                        >
                            <ChevronRightIcon 
                                width={16} 
                                height={16} 
                                className={`transform ${lang === 'ar' ? 'rotate-180' : ''}`}
                            />
                            <span>{breadcrumb.label}</span>
                        </button>
                    </div>
                )}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-white/90 text-sm mb-3">
                                {subtitle}
                            </p>
                        )}
                        {badges.length > 0 && (
                            <div className="flex flex-wrap items-center gap-3 text-white/90">
                                {badges.map((badge, index) => (
                                    <span 
                                        key={badge.key || `badge-${index}`}
                                        className="flex items-center gap-1.5 text-sm"
                                    >
                                        {badge.icon}
                                        {badge.label}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    {actions.length > 0 && (
                        <div className="flex gap-2 flex-shrink-0">
                            {actions.map((action, index) => {
                                // Default styling for primary variant on gradient background
                                const getButtonClassName = () => {
                                    if (action.className) return action.className;
                                    if (action.variant === 'primary' || !action.variant) {
                                        return '!bg-white !text-primary-600 hover:!bg-gray-100';
                                    }
                                    return '';
                                };

                                return (
                                    <Button
                                        key={`action-${index}-${action.label}`}
                                        type="button"
                                        variant={action.variant || 'primary'}
                                        onClick={action.onClick}
                                        className={getButtonClassName()}
                                    >
                                        {action.icon}
                                        {action.label}
                                    </Button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PageHeader;


