import React, { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components';
import { PlusIcon } from '@/shared/icons';
import { ROUTE_PATHS } from '@/config';
import { useLanguagePath } from '@/shared/utils/hooks/useLanguagePath';
import WarningsList from './WarningsList';
import CreateWarningForm from './CreateWarningForm';

/**
 * Shared warnings management page content.
 * Reused by the all-warnings, incoming, and issued views.
 */
const WarningsManagementPageContent = ({
    title,
    subtitle,
    scope = 'all',
    showCreateButton = false
}) => {
    const { t } = useTranslation();
    const { getPath } = useLanguagePath();
    const [showCreateForm, setShowCreateForm] = useState(false);

    const scopeTabs = useMemo(() => ([
        {
            key: 'incoming',
            label: t('menu.incomingWarnings', 'Incoming Warnings'),
            path: ROUTE_PATHS.INCOMING_WARNINGS
        },
        {
            key: 'issued',
            label: t('menu.warningsIssued', 'Warnings Issued'),
            path: ROUTE_PATHS.WARNINGS_ISSUED
        }
    ]), [t]);

    const currentTitle = showCreateForm
        ? t('warning.createTitle', 'Create New Warning')
        : title;
    const currentSubtitle = showCreateForm
        ? t('warning.listDescription', 'Manage and view all warnings')
        : subtitle;

    return (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
            <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0d6a70] via-[#0b5a5f] to-[#084347] p-[1px] shadow-[0_24px_60px_rgba(7,50,53,0.16)]">
                <div className="rounded-[27px] bg-white/95 p-4 sm:p-5">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                    {currentTitle}
                                </h1>
                                {currentSubtitle ? (
                                    <p className="mt-1 text-sm text-slate-500">
                                        {currentSubtitle}
                                    </p>
                                ) : null}
                            </div>

                            {showCreateButton && !showCreateForm ? (
                                <Button
                                    type="button"
                                    variant="primary"
                                    onClick={() => setShowCreateForm(true)}
                                    className="h-12 rounded-2xl px-5 !bg-[#0d6a70] text-sm font-semibold shadow-[0_12px_24px_rgba(13,106,112,0.18)] hover:!bg-[#0a565b]"
                                >
                                    <PlusIcon width={16} height={16} className="me-2" />
                                    {t('warning.create', 'Create Warning')}
                                </Button>
                            ) : null}

                            {showCreateForm ? (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setShowCreateForm(false)}
                                    className="h-11 rounded-2xl border border-[#d6e7e7] bg-[#f8fbfb] px-4 text-sm font-semibold text-[#0d6a70] hover:bg-[#eef6f6]"
                                >
                                    {t('common.back', 'Back')}
                                </Button>
                            ) : null}
                        </div>

                        {!showCreateForm ? (
                            <div className="rounded-[22px] bg-[#f3f7f7] p-2">
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {scopeTabs.map((tab) => {
                                        const isActive = tab.key === scope;

                                        return (
                                            <NavLink
                                                key={tab.key}
                                                to={getPath(tab.path)}
                                                className={`inline-flex min-h-[48px] items-center justify-center rounded-2xl px-4 text-sm font-semibold transition-all ${
                                                    isActive
                                                        ? 'bg-[#0d6a70] text-white shadow-[0_10px_20px_rgba(13,106,112,0.18)]'
                                                        : 'bg-transparent text-slate-500 hover:bg-white hover:text-[#0d6a70]'
                                                }`}
                                            >
                                                {tab.label}
                                            </NavLink>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </section>

            <section className="rounded-[28px] border border-[#e1eceb] bg-[#f7f5f0] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:p-4">
                <div className="rounded-[24px] bg-white p-4 shadow-[0_10px_25px_rgba(15,23,42,0.05)] sm:p-6">
                    {showCreateForm ? (
                        <CreateWarningForm
                            onSuccess={() => setShowCreateForm(false)}
                            onCancel={() => setShowCreateForm(false)}
                        />
                    ) : (
                        <WarningsList scope={scope} />
                    )}
                </div>
            </section>
        </div>
    );
};

export default WarningsManagementPageContent;
