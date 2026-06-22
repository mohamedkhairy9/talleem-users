import React from 'react';
import { useTranslation } from 'react-i18next';
import { EyeIcon, EditIcon, PlusIcon, TrashIcon } from '@/shared/icons';
import { getDisplayDate } from '@/shared/utils';
import { useDateFormatStore } from '@/app/stores';

const getHalaqaRowId = (row) =>
    row?.id ??
    row?.halaqa?.id ??
    row?.halaqa_id ??
    row?.memorization_halaqa_id ??
    row?.memorization_ring_id ??
    null;
const getHalaqaPeriodValue = (row) =>
    row.period ?? row.session_period ?? row.time_period ?? row.shift ?? null;

const getHalaqaStartDateValue = (row) =>
    row.date?.from ?? row.start_date ?? row.startDate ?? row.from_date ?? null;

const getHalaqaSessionTimeValue = (row) =>
    row.session_time ??
    row.sessionTime ??
    (row.session_from && row.session_to ? `${row.session_from}-${row.session_to}` : null) ??
    null;
export const HalaqaListMobile = ({ list, isLoading, hasError, errorMessage, emptyMessage, getLocalizedText, formatActivities, onView, onEdit, onDelete, onJoinStudentAfterStart, isDeleting }) => {
    const { t } = useTranslation();
    useDateFormatStore((s) => s.dateFormat); // re-render when date format changes
    if (isLoading && list.length === 0) {
        return (<div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />
                <p className="text-sm text-gray-600">{t('common.loading', 'Loading...')}</p>
            </div>
        </div>);
    }
    if (hasError) {
        return (<div className="rounded-lg bg-white p-8 text-center text-red-600 shadow-sm">
            {errorMessage || t('halaqa.loadError', 'Error loading halaqas.')}
        </div>);
    }
    if (list.length === 0) {
        return (<div className="rounded-lg bg-white p-8 text-center text-gray-500 shadow-sm">
            {emptyMessage}
        </div>);
    }
    return (<div className="space-y-4 overflow-y-auto">
        {list.map((row) => {
            const teachingMethodLabel = row.teaching_method
                ? (() => {
                    const keyMap = {
                        in_person: 'inPerson',
                        remote: 'remote',
                        hybrid: 'hybrid'
                    };
                    const key = keyMap[row.teaching_method] ?? row.teaching_method;
                    return t(`halaqa.teachingMethod.${key}`, row.teaching_method);
                })()
                : '-';
            const periodValue = getHalaqaPeriodValue(row);
            const rowId = getHalaqaRowId(row);
            console.log('Halaqa Row:', row);
            console.log('Period Value:', periodValue);
            console.log('Start Date:', getHalaqaStartDateValue(row));
            console.log('Session Time:', getHalaqaSessionTimeValue(row));
            return (<div key={rowId ?? getLocalizedText(row.name)} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="mb-2 text-base font-bold text-gray-900">
                    {getLocalizedText(row.name) || t('halaqa.name', 'Name')}
                </h3>
                <dl className="space-y-1.5 text-sm">
                    <div className="flex justify-between gap-2">
                        <span className="text-gray-500">{t('halaqa.teacher', 'Teacher')}</span>
                        <span className="text-gray-900 text-end">
                            {getLocalizedText(row.teacher?.name)}
                        </span>
                    </div>
                    <div className="flex justify-between gap-2">
                        <span className="text-gray-500">{t('halaqa.period', 'Period')}</span>
                        <span className="text-gray-900 text-end">
                            {periodValue
                                ? t(`halaqa.period.${periodValue}`, periodValue)
                                : '-'}
                        </span>
                    </div>
                    <div className="flex justify-between gap-2">
                        <span className="text-gray-500">
                            {t('halaqa.startDate', 'Start Date')}
                        </span>
                        <span className="text-gray-900 text-end">
                            {getDisplayDate(getHalaqaStartDateValue(row))}
                        </span>
                    </div>
                    <div className="flex justify-between gap-2">
                        <span className="text-gray-500">
                            {t('halaqa.sessionTime', 'Session Time')}
                        </span>
                        <span className="text-gray-900 text-end">
                            {getHalaqaSessionTimeValue(row) || '-'}
                        </span>
                    </div>
                    <div className="flex justify-between gap-2">
                        <span className="text-gray-500">
                            {t('halaqa.teachingMethod', 'Teaching Method')}
                        </span>
                        <span className="text-gray-900 text-end">
                            {teachingMethodLabel}
                        </span>
                    </div>
                    <div className="flex justify-between gap-2">
                        <span className="text-gray-500">{t('halaqa.students', 'Students')}</span>
                        <span className="text-gray-900 text-end">
                            {row.current_students_count ??
                                row.students?.length ??
                                row.max_students ??
                                '-'}
                        </span>
                    </div>
                    {row.activities?.length ? (<div className="flex justify-between gap-2">
                        <span className="text-gray-500">{t('halaqa.activities', 'Activities')}</span>
                        <span className="text-gray-900 text-end">
                            {formatActivities(row.activities)}
                        </span>
                    </div>) : null}
                </dl>
                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button type="button" onClick={() => onView(rowId)} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary-50 py-2.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-100">
                        <EyeIcon width={18} height={18} />
                        {t('common.view', 'View')}
                    </button>
                    <button type="button" onClick={() => onEdit(rowId)} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gray-100 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200">
                        <EditIcon width={18} height={18} />
                        {t('common.edit', 'Edit')}
                    </button>
                    <button
                        type="button"
                        onClick={() => onJoinStudentAfterStart?.(row)}
                        className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 py-2.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 sm:col-span-2"
                    >
                        <PlusIcon width={18} height={18} />
                        {t('halaqa.joinStudentAfterStart', 'التحاق الطلاب بعد البداية')}
                    </button>
                    <button type="button" onClick={() => onDelete(rowId)} disabled={isDeleting} className="flex items-center justify-center gap-1.5 rounded-lg bg-red-50 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50 sm:col-span-2" aria-label={t('common.delete', 'Delete')}>
                        <TrashIcon width={18} height={18} />
                        {t('common.delete', 'Delete')}
                    </button>
                </div>
            </div>);
        })}
    </div>);
};
