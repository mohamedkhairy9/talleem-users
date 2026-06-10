import React from 'react';
import { useTranslation } from 'react-i18next';
import { EyeIcon } from '@/shared/icons';
import { getDisplayDate } from '@/shared/utils';
import { useDateFormatStore } from '@/app/stores';
const TeacherHalaqaListMobile = ({ list, isLoading, hasError, errorMessage, emptyMessage, getLocalizedText, formatActivities, onView }) => {
    const { t } = useTranslation();
    useDateFormatStore((s) => s.dateFormat); // re-render when date format changes
    if (isLoading && list.length === 0) {
        return (<div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600"/>
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
            {list.map((item) => {
            const row = item.halaqa;
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
            return (<div key={row.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                        <h3 className="mb-2 text-base font-bold text-gray-900">
                            {getLocalizedText(row.name) || t('halaqa.name', 'Name')}
                        </h3>
                        <dl className="space-y-1.5 text-sm">
                            <div className="flex justify-between gap-2">
                                <span className="text-gray-500">{t('halaqa.period', 'Period')}</span>
                                <span className="text-gray-900 text-end">
                                    {row.period
                    ? t(`halaqa.period.${row.period}`, row.period)
                    : '-'}
                                </span>
                            </div>
                            <div className="flex justify-between gap-2">
                                <span className="text-gray-500">
                                    {t('halaqa.startDate', 'Start Date')}
                                </span>
                                <span className="text-gray-900 text-end">
                                    {getDisplayDate(row.start_date)}
                                </span>
                            </div>
                            <div className="flex justify-between gap-2">
                                <span className="text-gray-500">
                                    {t('halaqa.sessionTime', 'Session Time')}
                                </span>
                                <span className="text-gray-900 text-end">
                                    {row.session_time || '-'}
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
                            <div className="flex justify-between gap-2">
                                <span className="text-gray-500">{t('halaqa.canRecord', 'Can Record')}</span>
                                <span className="text-gray-900 text-end">
                                    {item.can_record ? t('common.yes', 'Yes') : t('common.no', 'No')}
                                </span>
                            </div>
                        </dl>
                        <div className="mt-4 flex gap-2">
                            <button type="button" onClick={() => onView(row.id)} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary-50 py-2.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-100">
                                <EyeIcon width={18} height={18}/>
                                {t('common.view', 'View')}
                            </button>
                        </div>
                    </div>);
        })}
        </div>);
};
export default TeacherHalaqaListMobile;
