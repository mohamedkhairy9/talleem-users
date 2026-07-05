import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Pagination, Table } from '@/shared/components';
import { SearchIcon, SettingsIcon, UserIcon, UsersIcon, XIcon } from '@/shared/icons';
import { useAccountManagement } from '../hooks/useAccountManagement';
import { useAccountManagementListState } from '../hooks/useAccountManagementListState';

function getLocalizedText(value, currentLang, fallback = '-') {
    if (typeof value === 'string') {
        return value || fallback;
    }

    if (!value || typeof value !== 'object') {
        return fallback;
    }

    if (currentLang === 'ar' && value.ar) {
        return value.ar;
    }

    return value.en || value.name || fallback;
}

function getAccountName(row, currentLang, t) {
    return getLocalizedText(
        row?.name ??
        row?.full_name ??
        row?.user?.name ??
        row?.profile?.name,
        currentLang,
        t('common.not_available', 'N/A')
    );
}

function getAccountPhone(row, t) {
    return row?.phone ?? row?.mobile ?? row?.phone_number ?? row?.user?.phone ?? t('common.not_available', 'N/A');
}

function getAccountEmail(row, t) {
    return row?.email ?? row?.user?.email ?? t('common.not_available', 'N/A');
}

function getAccountNationalId(row, t) {
    return row?.national_id ?? row?.identity_number ?? row?.identity ?? row?.nationalId ?? t('common.not_available', 'N/A');
}

function getAccountAffiliation(row, currentLang, t) {
    return getLocalizedText(
        row?.entity?.name ??
        row?.branch?.name ??
        row?.halaqa?.name ??
        row?.school?.name,
        currentLang,
        t('common.not_available', 'N/A')
    );
}

function getStatusLabel(row, t) {
    const statusValue = row?.status;

    if (typeof statusValue === 'string' && statusValue.trim() !== '') {
        return statusValue;
    }

    if (typeof row?.is_active === 'boolean') {
        return row.is_active ? t('common.active', 'Active') : t('common.inactive', 'Inactive');
    }

    if (typeof row?.active === 'boolean') {
        return row.active ? t('common.active', 'Active') : t('common.inactive', 'Inactive');
    }

    return t('common.not_available', 'N/A');
}

const ACCOUNT_TYPE_OPTIONS = [
    { value: 'teacher', translationKey: 'accountManagement.types.teacher', fallback: 'Teachers', icon: UserIcon },
    { value: 'student', translationKey: 'accountManagement.types.student', fallback: 'Students', icon: UsersIcon }
];

const AccountManagementList = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { lang } = useParams();
    const currentLang = i18n.language || 'ar';
    const listState = useAccountManagementListState();
    const { accountType, params, page, perPage, search, setAccountType, setPage, setSearch, resetFilters } = listState;
    const { list, meta, isLoading, error, refresh } = useAccountManagement(accountType, params);
    const [localSearch, setLocalSearch] = useState(search);
    const hasActiveFilters = !!search.trim();

    useEffect(() => {
        setLocalSearch(search);
    }, [search]);

    useEffect(() => {
        const timer = setTimeout(() => setSearch(localSearch), 400);
        return () => clearTimeout(timer);
    }, [localSearch, setSearch]);

    const columns = useMemo(() => ([
        {
            header: t('accountManagement.table.name', 'Name'),
            accessor: (row) => getAccountName(row, currentLang, t),
            minWidth: 220,
            cellClassName: 'px-6 py-4 text-sm text-gray-900 text-start min-w-[220px] whitespace-normal break-words'
        },
        {
            header: t('accountManagement.table.phone', 'Phone'),
            accessor: (row) => getAccountPhone(row, t),
            minWidth: 150
        },
        {
            header: t('accountManagement.table.email', 'Email'),
            accessor: (row) => getAccountEmail(row, t),
            minWidth: 220,
            cellClassName: 'px-6 py-4 text-sm text-gray-900 text-start min-w-[220px] whitespace-normal break-all'
        },
        {
            header: t('accountManagement.table.nationalId', 'National ID'),
            accessor: (row) => getAccountNationalId(row, t),
            minWidth: 160
        },
        {
            header: t('accountManagement.table.affiliation', 'Entity / Branch'),
            accessor: (row) => getAccountAffiliation(row, currentLang, t),
            minWidth: 200,
            cellClassName: 'px-6 py-4 text-sm text-gray-900 text-start min-w-[200px] whitespace-normal break-words'
        },
        {
            header: t('accountManagement.table.status', 'Status'),
            accessor: (row) => getStatusLabel(row, t),
            minWidth: 130
        }
    ]), [currentLang, t]);

    const total = meta?.total ?? list.length ?? 0;
    const totalPages = meta?.last_page ?? 1;
    const currentPage = meta?.current_page ?? page;
    const currentTypeOption = ACCOUNT_TYPE_OPTIONS.find((option) => option.value === accountType) ?? ACCOUNT_TYPE_OPTIONS[0];
    const CurrentTypeIcon = currentTypeOption.icon;

    const handleView = (row) => {
        const accountId = row?.id ?? row?.student_id ?? row?.teacher_id ?? row?.user?.id;

        if (!accountId) {
            return;
        }

        navigate(`/${lang || 'ar'}/account-management/${accountType}/${accountId}`);
    };

    if (error) {
        return (
            <div className="py-12 text-center text-red-600">
                {error?.message || t('accountManagement.loadError', 'Error loading accounts. Please try again.')}
            </div>
        );
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="mb-4 flex-shrink-0 rounded-xl border border-gray-200 bg-gray-50/80 p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                    <SettingsIcon width={18} height={18} className="text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">{t('common.filters', 'Filters')}</span>
                </div>

                <div className="mb-4 rounded-[22px] bg-white p-2">
                    <div className="grid gap-2 sm:grid-cols-2">
                        {ACCOUNT_TYPE_OPTIONS.map((option) => {
                            const Icon = option.icon;
                            const isActive = option.value === accountType;

                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setAccountType(option.value)}
                                    className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold transition-all ${
                                        isActive
                                            ? 'bg-[#0d6a70] text-white shadow-[0_10px_20px_rgba(13,106,112,0.18)]'
                                            : 'bg-transparent text-slate-500 hover:bg-[#f3f7f7] hover:text-[#0d6a70]'
                                    }`}
                                >
                                    <Icon width={16} height={16} />
                                    <span>{t(option.translationKey, option.fallback)}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">{t('common.search', 'Search')}</label>
                        <div className="relative min-h-[48px]">
                            <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-gray-400">
                                <SearchIcon width={18} height={18} />
                            </span>
                            <input
                                type="text"
                                placeholder={t('accountManagement.searchPlaceholder', 'Search accounts...')}
                                value={localSearch}
                                onChange={(event) => setLocalSearch(event.target.value)}
                                className="h-[48px] w-full rounded-lg border border-gray-300 bg-white ps-10 pe-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                            />
                        </div>
                    </div>

                    <div className="flex items-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={resetFilters}
                            disabled={!hasActiveFilters}
                            className="inline-flex items-center gap-2"
                        >
                            <XIcon width={16} height={16} />
                            {t('common.resetFilters', 'Reset filters')}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
                    <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {t('accountManagement.listHeading', 'Accounts List')}
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            {t(
                                accountType === 'teacher'
                                    ? 'accountManagement.teacherSubtitle'
                                    : 'accountManagement.studentSubtitle',
                                accountType === 'teacher'
                                    ? 'Review teacher accounts for your entity.'
                                    : 'Review student accounts for your entity.'
                            )}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => refresh()} disabled={isLoading}>
                            {t('common.refresh', 'Refresh')}
                        </Button>
                        <div className="flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                            <CurrentTypeIcon width={14} height={14} />
                            <span>{t(currentTypeOption.translationKey, currentTypeOption.fallback)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 min-h-0 flex-col overflow-auto">
                    <Table
                        columns={columns}
                        data={list}
                        loading={isLoading}
                        emptyMessage={t(
                            accountType === 'teacher'
                                ? 'accountManagement.noTeachers'
                                : 'accountManagement.noStudents',
                            accountType === 'teacher'
                                ? 'No teachers found.'
                                : 'No students found.'
                        )}
                        actionButtons={{
                            showView: true,
                            onView: handleView
                        }}
                    />
                </div>

                {totalPages > 1 ? (
                    <div className="flex-shrink-0 border-t border-gray-200 px-4 py-3">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            perPage={meta?.per_page ?? perPage}
                            total={total}
                            onPageChange={setPage}
                        />
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default AccountManagementList;
