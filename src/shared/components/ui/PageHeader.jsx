import React from 'react';
import { useLocale } from '@/shared/utils';
import { Button } from '@/shared/components';
import { ChevronRightIcon } from '@/shared/icons';

/**
 * PageHeader Component
 * A reusable header component for pages with gradient background, breadcrumb, title, badges, and actions
 */
const PageHeader = ({ title, subtitle, breadcrumb, badges = [], actions = [], currentLang, className = '' }) => {
    const { currentLocale } = useLocale();
    const lang = currentLang || currentLocale || 'ar';

    return (
        <div className={`overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-5 sm:px-6 sm:py-8">
                {breadcrumb ? (
                    <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-white/90">
                        <button onClick={breadcrumb.onClick} className="flex items-center gap-1 transition-colors hover:text-white">
                            <ChevronRightIcon width={16} height={16} className={`transform ${lang === 'ar' ? 'rotate-180' : ''}`} />
                            <span>{breadcrumb.label}</span>
                        </button>
                    </div>
                ) : null}

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                        <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl">
                            {title}
                        </h1>

                        {subtitle ? (
                            <p className="mb-3 max-w-3xl text-sm text-white/90">
                                {subtitle}
                            </p>
                        ) : null}

                        {badges.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-2 text-white/90 sm:gap-3">
                                {badges.map((badge, index) => (
                                    <span key={badge.key || `badge-${index}`} className="flex items-center gap-1.5 text-sm">
                                        {badge.icon}
                                        {badge.label}
                                    </span>
                                ))}
                            </div>
                        ) : null}
                    </div>

                    {actions.length > 0 ? (
                        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:flex-shrink-0">
                            {actions.map((action, index) => {
                                const getButtonClassName = () => {
                                    if (action.className) {
                                        return action.className;
                                    }

                                    if (action.variant === 'primary' || !action.variant) {
                                        return 'w-full !bg-white !text-primary-600 hover:!bg-gray-100 md:w-auto';
                                    }

                                    return 'w-full md:w-auto';
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
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default PageHeader;
