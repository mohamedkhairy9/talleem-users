import React from 'react';
import { useTranslation } from 'react-i18next';
import { useEntityManagerCalendar } from '../hooks/useCalendar';
import { getDisplayDate, getGregorianDate, getLocalizedText as getLocalizedTextHelper } from '@/shared/utils';
import { useDateFormatStore } from '@/app/stores';
import { CalendarIcon, TeacherIcon, BookOpenIcon } from '@/shared/icons';

const getItemTitle = (item, currentLang) => {
    return (
        getLocalizedTextHelper(item?.title, currentLang, null) ||
        getLocalizedTextHelper(item?.name, currentLang, null) ||
        getLocalizedTextHelper(item?.halaqa?.title, currentLang, null) ||
        getLocalizedTextHelper(item?.halaqa?.name, currentLang, null) ||
        getLocalizedTextHelper(item?.exam_segment?.name, currentLang, null) ||
        getLocalizedTextHelper(item?.activity?.name, currentLang, null) ||
        getLocalizedTextHelper(item?.activity?.title, currentLang, null) ||
        item?.title ||
        item?.name ||
        item?.exam_name ||
        item?.activity_name ||
        item?.activity_type ||
        item?.event_name ||
        item?.event_type ||
        item?.halaqa_title ||
        null
    );
};

const getItemDate = (item) => item?.date || item?.session_date || item?.start_date || item?.day_date || null;

const getItemSessionTime = (item) => (
    item?.session_time ||
    item?.time ||
    item?.session?.time ||
    item?.session?.session_time ||
    item?.start_time ||
    null
);

const getTeacherLabel = (item, currentLang) => {
    return (
        getLocalizedTextHelper(item?.teacher?.name, currentLang, null) ||
        item?.teacher?.name ||
        item?.teacher_name ||
        item?.teacher?.full_name ||
        item?.teacher_name_ar ||
        item?.teacher_name_en ||
        null
    );
};

const getEntityLabel = (item, currentLang) => {
    return (
        getLocalizedTextHelper(item?.entity?.name, currentLang, null) ||
        item?.entity?.name ||
        item?.entity_name ||
        item?.branch_name ||
        null
    );
};

const getPlatformLabel = (item, currentLang) => {
    return (
        getLocalizedTextHelper(item?.platform?.name, currentLang, null) ||
        item?.platform?.name ||
        getLocalizedTextHelper(item?.remote_platform?.name, currentLang, null) ||
        item?.remote_platform?.name ||
        item?.platform_name ||
        null
    );
};

const getLocationLabel = (item) => item?.location || item?.meeting_link || item?.platform_link || item?.remote_link || null;

const getResponsibleLabel = (item, t) => {
    const responsible = item?.responsible;
    if (!responsible) {
        return null;
    }

    const key = responsible === 'general_management' ? 'generalManagement' : responsible;
    return t(`scheduledExams.responsibleOptions.${key}`, responsible);
};

const getMethodLabel = (item, t) => {
    const method = item?.method || item?.teaching_method;
    if (!method) {
        return null;
    }

    if (method === 'in_person') {
        return t('scheduledExams.methodOptions.inPerson', 'In Person');
    }

    if (method === 'remote') {
        return t('scheduledExams.methodOptions.remote', 'Remote');
    }

    if (method === 'hybrid') {
        return t('halaqa.teachingMethod.hybrid', 'Hybrid');
    }

    return method;
};

const getStatusLabel = (item, currentLang, t) => {
    if (typeof item?.status === 'boolean') {
        return item.status ? t('common.active', 'Active') : t('common.inactive', 'Inactive');
    }

    return (
        getLocalizedTextHelper(item?.status_text, currentLang, null) ||
        item?.status_text ||
        item?.status ||
        null
    );
};

const getTypeLabel = (item, t) => {
    const titleText = String(
        item?.title?.ar ||
        item?.title?.en ||
        item?.title ||
        item?.name ||
        item?.event_type ||
        item?.activity_type ||
        item?.type ||
        ''
    ).toLowerCase();

    if (titleText.includes('اختبار')) {
        return t('entityDiary.examTag', 'Exam');
    }

    if (titleText.includes('تسميع') || titleText.includes('حفظ') || titleText.includes('تثبيت')) {
        return t('entityDiary.sessionTag', 'Session');
    }

    return t('entityDiary.entryTag', 'Event');
};

const sortByDateAndTime = (items) => {
    return [...items].sort((a, b) => {
        const dateA = getGregorianDate(getItemDate(a)) || '';
        const dateB = getGregorianDate(getItemDate(b)) || '';
        const dateCompare = dateA.localeCompare(dateB);
        if (dateCompare !== 0) {
            return dateCompare;
        }

        const timeA = getItemSessionTime(a) || '';
        const timeB = getItemSessionTime(b) || '';
        return timeA.localeCompare(timeB);
    });
};

const EntityManagerDiaryList = ({
    date,
    items: itemsOverride,
    isLoading: isLoadingOverride = false,
    error: errorOverride = null,
    emptyMessage,
    compact = false
}) => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'ar';

    useDateFormatStore((state) => state.dateFormat);

    const shouldQuery = itemsOverride === undefined;
    const query = useEntityManagerCalendar(date, { enabled: shouldQuery });

    const rawItems = shouldQuery ? query.items : (Array.isArray(itemsOverride) ? itemsOverride : []);
    const isLoading = shouldQuery ? query.isLoading : isLoadingOverride;
    const error = shouldQuery ? query.error : errorOverride;
    const sortedItems = sortByDateAndTime(rawItems);

    if (isLoading && sortedItems.length === 0) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />
                    <p className="text-sm text-gray-600">{t('common.loading', 'Loading...')}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
                {error?.message || t('entityDiary.loadError', 'Error loading diary data. Please try again.')}
            </div>
        );
    }

    if (sortedItems.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-500">
                {emptyMessage || t('entityDiary.noEntries', 'No entries found for this date.')}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {sortedItems.map((item, index) => {
                const sessionTime = getItemSessionTime(item);
                const itemDate = getItemDate(item);
                const typeLabel = getTypeLabel(item, t);
                const teacherLabel = getTeacherLabel(item, currentLang);
                const entityLabel = getEntityLabel(item, currentLang);
                const platformLabel = getPlatformLabel(item, currentLang);
                const locationLabel = getLocationLabel(item);
                const methodLabel = getMethodLabel(item, t);
                const responsibleLabel = getResponsibleLabel(item, t);
                const statusLabel = getStatusLabel(item, currentLang, t);
                const itemTitle = getItemTitle(item, currentLang) || typeLabel;
                const metadataItems = [
                    {
                        key: 'teacher',
                        label: t('entityDiary.teacher', 'Teacher'),
                        value: teacherLabel,
                        icon: <TeacherIcon width={20} height={20} />
                    },
                    {
                        key: 'entity',
                        label: t('entityDiary.entity', 'Entity'),
                        value: entityLabel,
                        icon: <BookOpenIcon width={20} height={20} />
                    },
                    {
                        key: 'method',
                        label: t('scheduledExams.method', 'Method'),
                        value: methodLabel,
                        icon: <CalendarIcon width={20} height={20} />
                    },
                    {
                        key: 'responsible',
                        label: t('scheduledExams.responsible', 'Responsible'),
                        value: responsibleLabel,
                        icon: <CalendarIcon width={20} height={20} />
                    },
                    {
                        key: 'location',
                        label: t('scheduledExams.location', 'Location'),
                        value: locationLabel,
                        icon: <CalendarIcon width={20} height={20} />
                    },
                    {
                        key: 'platform',
                        label: t('scheduledExams.platform', 'Platform'),
                        value: platformLabel,
                        icon: <CalendarIcon width={20} height={20} />
                    }
                ].filter((meta) => meta.value);

                return (
                    <article
                        key={item?.id ?? `${itemTitle}-${itemDate ?? index}`}
                        className={`rounded-[28px] border border-slate-200 bg-white shadow-sm ${compact ? 'p-4' : 'p-5 sm:p-6'}`}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-3">
                                    {itemDate && (
                                        <div className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                                            {getDisplayDate(itemDate)}
                                        </div>
                                    )}
                                    <div className="rounded-xl bg-[#DDEEEF] px-4 py-2 text-sm font-semibold text-[#0B5A5E]">
                                        {typeLabel}
                                    </div>
                                    {statusLabel && (
                                        <div className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                                            {statusLabel}
                                        </div>
                                    )}
                                </div>

                                <h3 className="mt-4 text-2xl font-semibold text-slate-900">
                                    {itemTitle}
                                </h3>
                            </div>

                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#E4F2F1] text-[#0B5A5E]">
                                <CalendarIcon width={26} height={26} />
                            </div>
                        </div>

                        {(sessionTime || methodLabel || responsibleLabel) && (
                            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-lg text-slate-500">
                                {sessionTime && (
                                    <div className="flex items-center gap-2">
                                        <span>{sessionTime}</span>
                                    </div>
                                )}
                                {methodLabel && (
                                    <div className="rounded-xl bg-slate-100 px-4 py-2 text-base font-medium text-slate-700">
                                        {methodLabel}
                                    </div>
                                )}
                                {responsibleLabel && (
                                    <div className="rounded-xl bg-slate-100 px-4 py-2 text-base font-medium text-slate-700">
                                        {responsibleLabel}
                                    </div>
                                )}
                            </div>
                        )}

                        {metadataItems.length > 0 && (
                            <div className="mt-5 border-t border-slate-200 pt-5">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {metadataItems.map((meta) => (
                                        <div key={meta.key} className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E4F2F1] text-[#0B5A5E]">
                                                {meta.icon}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm text-slate-500">{meta.label}</div>
                                                <div className="truncate text-lg font-semibold text-slate-800">
                                                    {meta.value}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </article>
                );
            })}
        </div>
    );
};

export default EntityManagerDiaryList;
