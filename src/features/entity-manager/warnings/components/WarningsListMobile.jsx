import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangleIcon, CalendarIcon, EyeIcon, SearchIcon, TrashIcon } from '@/shared/icons';
import { getDisplayDate } from '@/shared/utils';
import { useDateFormatStore } from '@/app/stores';

const WarningField = ({ label, value, icon = null, fullWidth = false }) => (
    <div className={fullWidth ? 'sm:col-span-2' : ''}>
        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
            {icon ? <span className="text-slate-300">{icon}</span> : null}
            <span>{label}</span>
        </div>
        <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
            {value || '-'}
        </p>
    </div>
);

export const WarningsListMobile = ({
    list,
    isLoading,
    hasError,
    errorMessage,
    emptyMessage,
    getLocalizedText,
    onView,
    onDelete,
    isDeleting = false
}) => {
    const { t } = useTranslation();

    useDateFormatStore((s) => s.dateFormat);

    if (isLoading && list.length === 0) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#d7e5e5] border-t-[#0d6a70]" />
                    <p className="text-sm font-medium text-slate-500">
                        {t('common.loading', 'Loading...')}
                    </p>
                </div>
            </div>
        );
    }

    if (hasError) {
        return (
            <div className="rounded-[22px] border border-red-100 bg-red-50/80 p-8 text-center text-sm font-medium text-red-600">
                {errorMessage || t('warning.loadError', 'Error loading warnings.')}
            </div>
        );
    }

    if (list.length === 0) {
        return (
            <div className="rounded-[22px] border border-dashed border-[#d6e7e7] bg-[#f8fbfb] p-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                    <SearchIcon width={20} height={20} className="text-slate-300" />
                </div>
                <p className="mt-4 text-sm font-medium text-slate-500">
                    {emptyMessage}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {list.map((row) => {
                const targetName =
                    row.warning_type === 'student' && row.student
                        ? getLocalizedText(row.student.name)
                        : row.warning_type === 'teacher' && row.teacher
                            ? getLocalizedText(row.teacher.name)
                            : row.warning_type === 'entity' && row.entity
                                ? getLocalizedText(row.entity.name)
                                : '-';

                const note = row.note || row.notes || '';

                return (
                    <article
                        key={row.id}
                        className="overflow-hidden rounded-[24px] border border-[#e3ecec] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]"
                    >
                        <div className="flex flex-col gap-3 bg-[#eef6f5] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#0d6a70] shadow-sm">
                                    <AlertTriangleIcon width={18} height={18} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-[#0d6a70]">
                                        {t('warning.listTitle', 'Warnings')}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {t('common.id', 'ID')} #{row.id}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-3 sm:justify-end">
                                <span
                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                        row.status
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-rose-100 text-rose-700'
                                    }`}
                                >
                                    {row.status
                                        ? t('common.active', 'Active')
                                        : t('common.inactive', 'Inactive')}
                                </span>

                                {(onView || onDelete) ? (
                                    <div className="flex items-center gap-2">
                                        {onView ? (
                                            <button
                                                type="button"
                                                onClick={() => onView(row)}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#d7e5e5] bg-white text-slate-500 transition-colors hover:border-[#0d6a70] hover:text-[#0d6a70]"
                                                aria-label={t('common.view', 'View')}
                                                title={t('common.view', 'View')}
                                            >
                                                <EyeIcon width={16} height={16} />
                                            </button>
                                        ) : null}

                                        {onDelete ? (
                                            <button
                                                type="button"
                                                onClick={() => onDelete(row)}
                                                disabled={isDeleting}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#f3d4d4] bg-white text-rose-500 transition-colors hover:border-rose-500 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                aria-label={t('common.delete', 'Delete')}
                                                title={t('common.delete', 'Delete')}
                                            >
                                                <TrashIcon width={16} height={16} />
                                            </button>
                                        ) : null}
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        <div className="grid gap-4 px-4 py-4 sm:grid-cols-2">
                            <WarningField
                                label={t('warning.date', 'Date')}
                                value={getDisplayDate(row.date)}
                                icon={<CalendarIcon width={14} height={14} />}
                            />
                            <WarningField
                                label={t('warning.warningType', 'Warning Type')}
                                value={t(`warning.type.${row.warning_type}`, row.warning_type)}
                            />
                            <WarningField
                                label={t('warning.target', 'Target')}
                                value={targetName}
                            />
                            <WarningField
                                label={t('warning.warningReason', 'Warning Reason')}
                                value={getLocalizedText(row.warning_reason?.name)}
                            />

                            {note ? (
                                <WarningField
                                    label={t('warning.note', 'Note')}
                                    value={note}
                                    fullWidth
                                />
                            ) : null}
                        </div>
                    </article>
                );
            })}
        </div>
    );
};
