import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    AlertTriangleIcon,
    AwardIcon,
    BookOpenIcon,
    CalendarIcon,
    ClipboardCheckIcon,
    SettingsIcon,
    StarIcon,
    TeacherIcon,
    UserIcon,
    UsersIcon
} from '@/shared/icons';
import { Button, PageHeader, Table } from '@/shared/components';
import { formatTimePart, getDisplayDate, getErrorMessage, getLocalizedText, isAppDate } from '@/shared/utils';
import {
    useAccountManagementSection,
    useTeacherStudentNestedSection
} from '@/features/entity-manager/account-management/hooks/useAccountManagement';

const CARD_CLASS = 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm';
const MAX_TABLE_COLUMNS = 8;
const DEFAULT_TAB = 'profile';

const STUDENT_TABS = [
    { key: 'profile', labelKey: 'accountManagement.sections.profile', fallback: 'Profile', icon: UserIcon },
    { key: 'plans', labelKey: 'accountManagement.sections.plans', fallback: 'Plans', icon: BookOpenIcon },
    { key: 'grades', labelKey: 'accountManagement.sections.grades', fallback: 'Grades', icon: StarIcon },
    { key: 'certificates', labelKey: 'accountManagement.sections.certificates', fallback: 'Certificates', icon: AwardIcon },
    { key: 'absences', labelKey: 'accountManagement.sections.absences', fallback: 'Absences', icon: CalendarIcon },
    { key: 'warnings', labelKey: 'accountManagement.sections.warnings', fallback: 'Warnings', icon: AlertTriangleIcon },
    { key: 'requests', labelKey: 'accountManagement.sections.requests', fallback: 'Requests', icon: ClipboardCheckIcon }
];

const TEACHER_TABS = [
    { key: 'profile', labelKey: 'accountManagement.sections.profile', fallback: 'Profile', icon: TeacherIcon },
    { key: 'currentLicense', labelKey: 'accountManagement.sections.currentLicense', fallback: 'Current License', icon: AwardIcon },
    { key: 'halaqas', labelKey: 'accountManagement.sections.halaqas', fallback: 'Halaqas', icon: UsersIcon },
    { key: 'warnings', labelKey: 'accountManagement.sections.warnings', fallback: 'Warnings', icon: AlertTriangleIcon },
    { key: 'leaves', labelKey: 'accountManagement.sections.leaves', fallback: 'Leaves', icon: CalendarIcon },
    { key: 'absences', labelKey: 'accountManagement.sections.absences', fallback: 'Absences', icon: CalendarIcon },
    { key: 'requests', labelKey: 'accountManagement.sections.requests', fallback: 'Requests', icon: ClipboardCheckIcon }
];

function isPlainObject(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value);
}

function toArray(value) {
    if (Array.isArray(value)) {
        return value;
    }

    if (Array.isArray(value?.data)) {
        return value.data;
    }

    if (Array.isArray(value?.items)) {
        return value.items;
    }

    if (Array.isArray(value?.results)) {
        return value.results;
    }

    return [];
}

function getTabList(accountType) {
    return accountType === 'teacher' ? TEACHER_TABS : STUDENT_TABS;
}

function normalizeTab(accountType, value) {
    const tabs = getTabList(accountType);
    return tabs.some((tab) => tab.key === value) ? value : DEFAULT_TAB;
}

function prettifyKey(key = '') {
    return String(key)
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildLocalizedValue(arValue, enValue) {
    if (!arValue && !enValue) {
        return null;
    }

    return {
        ...(arValue ? { ar: arValue } : {}),
        ...(enValue ? { en: enValue } : {})
    };
}

function hasMeaningfulValue(value) {
    if (value == null) {
        return false;
    }

    if (typeof value === 'string') {
        return value.trim() !== '';
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        return true;
    }

    if (Array.isArray(value)) {
        return value.length > 0;
    }

    if (isPlainObject(value)) {
        return Object.keys(value).length > 0;
    }

    return false;
}

function getPreferredLocalizedValue(...candidates) {
    return candidates.find((candidate) => hasMeaningfulValue(candidate)) ?? null;
}

function getPersonNameSource(person) {
    if (person == null || typeof person === 'string' || typeof person === 'number') {
        return person ?? null;
    }

    return getPreferredLocalizedValue(
        person?.name,
        person?.full_name,
        person?.title,
        person?.label,
        person?.display_name,
        person?.halaqa_name,
        person?.teacher_name,
        person?.student_name,
        buildLocalizedValue(person?.name_ar ?? person?.full_name_ar, person?.name_en ?? person?.full_name_en),
        buildLocalizedValue(person?.halaqa_name_ar, person?.halaqa_name_en),
        buildLocalizedValue(person?.teacher_name_ar, person?.teacher_name_en),
        buildLocalizedValue(person?.student_name_ar, person?.student_name_en),
        person?.user?.name,
        person?.user?.full_name,
        buildLocalizedValue(person?.user?.name_ar ?? person?.user?.full_name_ar, person?.user?.name_en ?? person?.user?.full_name_en),
        person?.profile?.name,
        person?.profile?.full_name,
        buildLocalizedValue(person?.profile?.name_ar ?? person?.profile?.full_name_ar, person?.profile?.name_en ?? person?.profile?.full_name_en)
    );
}

function getAccountName(profile, currentLang, t) {
    const nameValue = getPersonNameSource(profile);

    if (!nameValue) {
        return t('accountManagement.accountFallback', 'Account Details');
    }

    return getLocalizedText(nameValue, currentLang, t('accountManagement.accountFallback', 'Account Details'));
}

function getSimpleObjectSummary(value, currentLang, t) {
    if (!isPlainObject(value)) {
        return t('common.not_available', 'N/A');
    }

    const localizedValue = getLocalizedText(
        value?.name ?? value?.title ?? value?.label ?? value?.type ?? value?.status,
        currentLang,
        ''
    );

    if (localizedValue) {
        return localizedValue;
    }

    if (isAppDate(value)) {
        return getDisplayDate(value);
    }

    const simpleEntries = Object.entries(value)
        .filter(([, entryValue]) => !Array.isArray(entryValue) && !isPlainObject(entryValue))
        .slice(0, 2);

    if (simpleEntries.length === 0) {
        return value?.id ? `#${value.id}` : t('common.not_available', 'N/A');
    }

    return simpleEntries
        .map(([entryKey, entryValue]) => `${prettifyKey(entryKey)}: ${entryValue}`)
        .join(' - ');
}

function getDisplayValue(value, key, currentLang, t) {
    const normalizedKey = String(key || '').toLowerCase();

    if (value == null || value === '') {
        return t('common.not_available', 'N/A');
    }

    if (React.isValidElement(value)) {
        return value;
    }

    if (typeof value === 'boolean') {
        return value
            ? t('accountManagement.boolean.true', 'Yes')
            : t('accountManagement.boolean.false', 'No');
    }

    if (typeof value === 'number') {
        return String(value);
    }

    if (typeof value === 'string') {
        if (/^https?:\/\//i.test(value)) {
            return (
                <a
                    href={value}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary-600 underline underline-offset-2 hover:text-primary-700"
                >
                    {value}
                </a>
            );
        }

        if (normalizedKey.includes('time') && value.includes(':')) {
            return formatTimePart(value);
        }

        if (normalizedKey.includes('date') || /^\d{4}-\d{2}-\d{2}(?:[T\s].*)?$/.test(value)) {
            return getDisplayDate(value);
        }

        return value;
    }

    if (Array.isArray(value)) {
        if (value.length === 0) {
            return t('common.noData', 'No data available');
        }

        if (value.every((entry) => !isPlainObject(entry))) {
            return value.join(', ');
        }

        return `${value.length} ${t('accountManagement.itemsLabel', 'items')}`;
    }

    if (isAppDate(value)) {
        return getDisplayDate(value);
    }

    if (isPlainObject(value)) {
        return getSimpleObjectSummary(value, currentLang, t);
    }

    return String(value);
}

function getLabelForKey(key, t) {
    return t(`accountManagement.fields.${key}`, prettifyKey(key));
}

function getPrimaryArrayEntries(payload) {
    if (Array.isArray(payload)) {
        return [['items', payload]];
    }

    if (!isPlainObject(payload)) {
        return [];
    }

    return Object.entries(payload).filter(([, value]) => Array.isArray(value));
}

function getObjectOnlyPayload(payload) {
    if (!isPlainObject(payload)) {
        return null;
    }

    const entries = Object.entries(payload).filter(([, value]) => !Array.isArray(value));

    if (entries.length === 0) {
        return null;
    }

    return Object.fromEntries(entries);
}

function inferColumns(items, currentLang, t) {
    const keySet = new Set();

    items.slice(0, 5).forEach((item) => {
        if (!isPlainObject(item)) {
            return;
        }

        Object.keys(item).forEach((key) => {
            if (key !== 'pivot' && key !== 'students') {
                keySet.add(key);
            }
        });
    });

    const prioritizedKeys = Array.from(keySet)
        .sort((firstKey, secondKey) => {
            const priority = ['id', 'name', 'title', 'status', 'date', 'created_at', 'updated_at', 'grade', 'score'];
            const firstIndex = priority.findIndex((token) => firstKey.includes(token));
            const secondIndex = priority.findIndex((token) => secondKey.includes(token));

            if (firstIndex === -1 && secondIndex === -1) {
                return firstKey.localeCompare(secondKey);
            }

            if (firstIndex === -1) {
                return 1;
            }

            if (secondIndex === -1) {
                return -1;
            }

            return firstIndex - secondIndex;
        })
        .slice(0, MAX_TABLE_COLUMNS);

    return prioritizedKeys.map((key) => ({
        header: getLabelForKey(key, t),
        accessor: (row) => getDisplayValue(row?.[key], key, currentLang, t),
        minWidth: key.includes('name') || key.includes('title') ? 180 : 140,
        cellClassName: 'px-6 py-4 text-sm text-gray-900 text-start whitespace-normal break-words'
    }));
}

const DetailCard = ({ icon, title, children, action }) => {
    const IconComponent = icon;

    return (
        <section className={CARD_CLASS}>
            <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e7f5f3] text-primary-600">
                        <IconComponent width={18} height={18} />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                </div>
                {action}
            </div>

            <div className="space-y-4">{children}</div>
        </section>
    );
};

const InfoRow = ({ label, value }) => (
    <div className="grid grid-cols-1 gap-1 border-b border-gray-100 pb-3 last:border-b-0 last:pb-0 md:grid-cols-[190px_minmax(0,1fr)]">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <div className="text-sm text-gray-900 break-words">{value}</div>
    </div>
);

const EmptyState = ({ message }) => (
    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
        {message}
    </div>
);

const LoadingState = ({ label }) => (
    <div className="flex min-h-[280px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            <p className="text-sm text-gray-600">{label}</p>
        </div>
    </div>
);

function buildOverviewRows(profile, currentLang, t) {
    if (!isPlainObject(profile)) {
        return [];
    }

    const overviewCandidates = [
        { key: 'name', value: profile?.name ?? profile?.full_name ?? profile?.user?.name },
        { key: 'phone', value: profile?.phone ?? profile?.mobile ?? profile?.phone_number ?? profile?.user?.phone },
        { key: 'email', value: profile?.email ?? profile?.user?.email },
        { key: 'national_id', value: profile?.national_id ?? profile?.identity_number ?? profile?.identity },
        { key: 'entity', value: profile?.entity?.name ?? profile?.branch?.name ?? profile?.halaqa?.name ?? profile?.school?.name }
    ];

    return overviewCandidates
        .filter((entry) => entry.value != null && entry.value !== '')
        .map((entry) => ({
            label: getLabelForKey(entry.key, t),
            value: getDisplayValue(entry.value, entry.key, currentLang, t)
        }));
}

const StructuredObjectDetails = ({ data, currentLang, t }) => {
    if (!isPlainObject(data)) {
        return <EmptyState message={t('accountManagement.noSectionData', 'No data available for this section.')} />;
    }

    const entries = Object.entries(data).filter(([, value]) => value !== undefined);

    if (entries.length === 0) {
        return <EmptyState message={t('accountManagement.noSectionData', 'No data available for this section.')} />;
    }

    return (
        <dl className="space-y-3">
            {entries.map(([key, value]) => (
                <InfoRow
                    key={key}
                    label={getLabelForKey(key, t)}
                    value={getDisplayValue(value, key, currentLang, t)}
                />
            ))}
        </dl>
    );
};

const CollectionRenderer = ({ title, items, currentLang, t }) => {
    if (!Array.isArray(items) || items.length === 0) {
        return <EmptyState message={t('accountManagement.noSectionData', 'No data available for this section.')} />;
    }

    const areObjects = items.some((item) => isPlainObject(item));

    if (!areObjects) {
        return (
            <DetailCard icon={SettingsIcon} title={title}>
                <div className="flex flex-wrap gap-2">
                    {items.map((item, index) => (
                        <span
                            key={`${title}-${index}`}
                            className="inline-flex rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700"
                        >
                            {getDisplayValue(item, title, currentLang, t)}
                        </span>
                    ))}
                </div>
            </DetailCard>
        );
    }

    const columns = inferColumns(items, currentLang, t);

    return (
        <DetailCard icon={SettingsIcon} title={title}>
            <Table
                columns={columns}
                data={items}
                loading={false}
                scrollable={false}
                emptyMessage={t('accountManagement.noSectionData', 'No data available for this section.')}
            />
        </DetailCard>
    );
};

const StudentPlansSection = ({ payload, currentLang, t }) => {
    const items = Array.isArray(payload)
        ? payload
        : toArray(payload?.plans ?? payload?.items ?? payload?.halaqas ?? payload);

    if (items.length === 0) {
        return <EmptyState message={t('accountManagement.noSectionData', 'No data available for this section.')} />;
    }

    return (
        <div className="space-y-6">
            {items.map((item, index) => {
                const title = getHalaqaName(item, currentLang, t);
                const rows = buildStudentPlanRows(item, currentLang, t);

                return (
                    <DetailCard
                        key={item?.id ?? item?.halaqa_id ?? item?.halaqa?.id ?? index}
                        icon={BookOpenIcon}
                        title={title}
                    >
                        <dl className="space-y-3">
                            {rows.map((row) => (
                                <InfoRow
                                    key={`${title}-${row.label}`}
                                    label={row.label}
                                    value={row.value}
                                />
                            ))}
                        </dl>
                    </DetailCard>
                );
            })}
        </div>
    );
};

function getTeacherHalaqaList(payload) {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (Array.isArray(payload?.data)) {
        return payload.data;
    }

    if (Array.isArray(payload?.halaqas)) {
        return payload.halaqas;
    }

    if (Array.isArray(payload?.items)) {
        return payload.items;
    }

    return [];
}

function getNestedSectionTitle(mode, t) {
    return mode === 'history'
        ? t('accountManagement.nested.history', 'Student History')
        : t('accountManagement.nested.plan', 'Student Plan');
}

function getPersonLabel(person, currentLang, t, fallbackKey = 'accountManagement.accountFallback') {
    if (person == null) {
        return t('common.not_available', 'N/A');
    }

    if (typeof person === 'string' || typeof person === 'number') {
        return String(person);
    }

    const localizedPersonName = getPersonNameSource(person);

    if (localizedPersonName) {
        return getLocalizedText(
            localizedPersonName,
            currentLang,
            t(fallbackKey, 'Account Details')
        );
    }

    if (person?.email || person?.user?.email) {
        return person?.email ?? person?.user?.email;
    }

    if (person?.id != null || person?.student_id != null || person?.teacher_id != null || person?.halaqa_id != null) {
        return `#${person?.id ?? person?.student_id ?? person?.teacher_id ?? person?.halaqa_id}`;
    }

    return getLocalizedText(
        person,
        currentLang,
        t(fallbackKey, 'Account Details')
    );
}

function getSafeText(value, currentLang, t) {
    if (value == null || value === '') {
        return t('common.not_available', 'N/A');
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }

    if (Array.isArray(value)) {
        if (value.length === 0) {
            return t('common.not_available', 'N/A');
        }

        return value.map((item) => getSafeText(item, currentLang, t)).join(', ');
    }

    if (isPlainObject(value)) {
        const localized = getLocalizedText(
            value?.name ?? value?.title ?? value?.label ?? value?.status ?? value,
            currentLang,
            ''
        );

        if (localized) {
            return localized;
        }

        if (value.id != null) {
            return `#${value.id}`;
        }

        try {
            return JSON.stringify(value);
        } catch {
            return t('common.not_available', 'N/A');
        }
    }

    return String(value);
}

function getPeriodLabel(value, currentLang, t) {
    if (!value) {
        return t('common.not_available', 'N/A');
    }

    if (typeof value === 'string') {
        return t(`halaqa.period.${value}`, value);
    }

    return getSafeText(value, currentLang, t);
}

function getActivitiesLabel(activities, currentLang, t) {
    const normalizedActivities = toArray(activities);

    if (normalizedActivities.length === 0) {
        return t('common.not_available', 'N/A');
    }

    return normalizedActivities
        .map((activity) => {
            if (typeof activity === 'string') {
                return t(`halaqa.activity.${activity}`, activity);
            }

            return getLocalizedText(
                activity?.name ?? activity?.title,
                currentLang,
                t('common.not_available', 'N/A')
            );
        })
        .join(', ');
}

function getWeeklyHolidayLabel(value, t) {
    if (Array.isArray(value)) {
        if (value.length === 0) {
            return t('common.not_available', 'N/A');
        }

        return value
            .map((item) => {
                const normalizedItem = typeof item === 'string' ? item : String(item);
                return t(`halaqa.weekdays.${normalizedItem}`, normalizedItem);
            })
            .join(', ');
    }

    if (typeof value === 'string' && value.trim() !== '') {
        return value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
            .map((item) => t(`halaqa.weekdays.${item}`, item))
            .join(', ');
    }

    return t('common.not_available', 'N/A');
}

function getStudentCountValue(item) {
    const nestedStudents = toArray(item?.students);

    if (typeof item?.current_students_count === 'number') {
        return item.current_students_count;
    }

    if (typeof item?.students_count === 'number') {
        return item.students_count;
    }

    if (nestedStudents.length > 0) {
        return nestedStudents.length;
    }

    if (typeof item?.max_students === 'number') {
        return item.max_students;
    }

    return null;
}

function getHalaqaAverageGradeValue(item) {
    return item?.halaqa_plans_average_grade ??
        item?.plans_average_grade ??
        item?.average_grade ??
        item?.avg_grade ??
        null;
}

function getHalaqaName(item, currentLang, t) {
    return getSafeText(getPersonLabel(
        item?.halaqa ??
        item?.halaqa_detail ??
        buildLocalizedValue(item?.halaqa_name_ar, item?.halaqa_name_en) ??
        item?.halaqa_name ??
        item,
        currentLang,
        t,
        'common.not_available'
    ), currentLang, t);
}

function getTeacherName(item, currentLang, t) {
    return getSafeText(getPersonLabel(
        item?.teacher ??
        item?.halaqa?.teacher ??
        item?.supervisor ??
        item?.instructor ??
        buildLocalizedValue(
            item?.teacher_name_ar ?? item?.halaqa?.teacher_name_ar,
            item?.teacher_name_en ?? item?.halaqa?.teacher_name_en
        ) ??
        item?.teacher_name,
        currentLang,
        t,
        'common.not_available'
    ), currentLang, t);
}

function buildStudentPlanRows(item, currentLang, t) {
    return [
        {
            label: t('accountManagement.fields.halaqa', 'Halaqa'),
            value: getHalaqaName(item, currentLang, t)
        },
        {
            label: t('halaqa.teacher', 'Teacher'),
            value: getTeacherName(item, currentLang, t)
        },
        {
            label: t('halaqa.period', 'Period'),
            value: getPeriodLabel(item?.period ?? item?.halaqa?.period, currentLang, t)
        },
        {
            label: t('halaqa.startDate', 'Start Date'),
            value: getDisplayValue(item?.start_date ?? item?.halaqa?.start_date, 'start_date', currentLang, t)
        },
        {
            label: t('halaqa.endDate', 'End Date'),
            value: getDisplayValue(item?.end_date ?? item?.halaqa?.end_date, 'end_date', currentLang, t)
        },
        {
            label: t('halaqa.activities', 'Activities'),
            value: getActivitiesLabel(item?.activities ?? item?.halaqa?.activities, currentLang, t)
        },
        {
            label: prettifyKey('current_students_count'),
            value: getStudentCountValue(item) ?? t('common.not_available', 'N/A')
        },
        {
            label: prettifyKey('halaqa_plans_average_grade'),
            value: getHalaqaAverageGradeValue(item) ?? t('common.not_available', 'N/A')
        },
        {
            label: prettifyKey('weekly_holiday'),
            value: getWeeklyHolidayLabel(item?.weekly_holiday ?? item?.halaqa?.weekly_holiday, t)
        }
    ].filter((row) => row.value != null && row.value !== '');
}

function extractStudentsList(halaqa) {
    return toArray(
        halaqa?.students ??
        halaqa?.student_list ??
        halaqa?.students_list ??
        halaqa?.members
    );
}

function buildTeacherHalaqaRows(halaqa, currentLang, t) {
    return [
        {
            label: t('accountManagement.fields.halaqa', 'Halaqa'),
            value: getHalaqaName(halaqa, currentLang, t)
        },
        {
            label: t('halaqa.teacher', 'Teacher'),
            value: getTeacherName(halaqa, currentLang, t)
        },
        {
            label: t('halaqa.period', 'Period'),
            value: getPeriodLabel(halaqa?.period, currentLang, t)
        },
        {
            label: t('halaqa.startDate', 'Start Date'),
            value: getDisplayValue(halaqa?.start_date, 'start_date', currentLang, t)
        },
        {
            label: t('halaqa.endDate', 'End Date'),
            value: getDisplayValue(halaqa?.end_date, 'end_date', currentLang, t)
        },
        {
            label: t('halaqa.activities', 'Activities'),
            value: getActivitiesLabel(halaqa?.activities, currentLang, t)
        },
        {
            label: prettifyKey('current_students_count'),
            value: getStudentCountValue(halaqa) ?? t('common.not_available', 'N/A')
        },
        {
            label: prettifyKey('weekly_holiday'),
            value: getWeeklyHolidayLabel(halaqa?.weekly_holiday, t)
        }
    ].filter((row) => row.value != null && row.value !== '');
}

const TeacherNestedSectionCard = ({
    teacherId,
    selectedStudentContext,
    currentLang,
    t
}) => {
    const nestedQuery = useTeacherStudentNestedSection(
        teacherId,
        selectedStudentContext?.halaqaId,
        selectedStudentContext?.studentId,
        selectedStudentContext?.mode,
        {
            enabled: Boolean(selectedStudentContext?.halaqaId) && Boolean(selectedStudentContext?.studentId)
        }
    );

    if (!selectedStudentContext) {
        return null;
    }

    const payload = nestedQuery.payload;
    const title = `${getNestedSectionTitle(selectedStudentContext.mode, t)} - ${selectedStudentContext.studentName}`;

    return (
        <DetailCard
            icon={selectedStudentContext.mode === 'history' ? BookOpenIcon : ClipboardCheckIcon}
            title={title}
            action={(
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={selectedStudentContext.onClear}
                >
                    {t('common.close', 'Close')}
                </Button>
            )}
        >
            <div className="space-y-3">
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    <span className="font-medium text-gray-900">{t('accountManagement.fields.halaqa', 'Halaqa')}:</span>{' '}
                    {selectedStudentContext.halaqaName}
                </div>

                {nestedQuery.isLoading ? (
                    <LoadingState label={t('common.loading', 'Loading...')} />
                ) : nestedQuery.error ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {getErrorMessage(nestedQuery.error)}
                    </div>
                ) : payload == null ? (
                    <EmptyState message={t('accountManagement.noSectionData', 'No data available for this section.')} />
                ) : Array.isArray(payload) ? (
                    <CollectionRenderer
                        title={title}
                        items={payload}
                        currentLang={currentLang}
                        t={t}
                    />
                ) : (
                    <StructuredObjectDetails data={payload} currentLang={currentLang} t={t} />
                )}
            </div>
        </DetailCard>
    );
};

const TeacherHalaqasSection = ({
    payload,
    currentLang,
    t,
    onSelectStudentSection
}) => {
    const halaqas = getTeacherHalaqaList(payload);

    if (halaqas.length === 0) {
        return <EmptyState message={t('accountManagement.noSectionData', 'No data available for this section.')} />;
    }

    return (
        <div className="space-y-6">
            {halaqas.map((halaqa, index) => {
                const halaqaId = halaqa?.id ?? halaqa?.halaqa_id ?? index;
                const halaqaName = getPersonLabel(halaqa, currentLang, t, 'accountManagement.sections.halaqas');
                const students = extractStudentsList(halaqa);
                const summaryRows = buildTeacherHalaqaRows(halaqa, currentLang, t);

                return (
                    <DetailCard
                        key={halaqaId}
                        icon={UsersIcon}
                        title={halaqaName}
                    >
                        {summaryRows.length > 0 ? (
                            <dl className="space-y-3">
                                {summaryRows.map((row) => (
                                    <InfoRow
                                        key={`${halaqaId}-${row.label}`}
                                        label={row.label}
                                        value={row.value}
                                    />
                                ))}
                            </dl>
                        ) : null}

                        <div className="pt-2">
                            <h3 className="mb-3 text-sm font-semibold text-gray-700">
                                {t('accountManagement.fields.students', 'Students')}
                            </h3>

                            {students.length === 0 ? (
                                <EmptyState message={t('accountManagement.noStudentsInHalaqa', 'No students are available inside this halaqa.')} />
                            ) : (
                                <div className="space-y-3">
                                    {students.map((student, studentIndex) => {
                                        const studentId = student?.id ?? student?.student_id ?? studentIndex;
                                        const studentName = getPersonLabel(student, currentLang, t);

                                        return (
                                            <div
                                                key={`${halaqaId}-${studentId}`}
                                                className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 lg:flex-row lg:items-center lg:justify-between"
                                            >
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900">{studentName}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {t('accountManagement.fields.id', 'ID')}: {studentId}
                                                    </p>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => onSelectStudentSection({
                                                            halaqaId,
                                                            halaqaName,
                                                            studentId,
                                                            studentName,
                                                            mode: 'plan'
                                                        })}
                                                    >
                                                        {t('accountManagement.nested.plan', 'Student Plan')}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => onSelectStudentSection({
                                                            halaqaId,
                                                            halaqaName,
                                                            studentId,
                                                            studentName,
                                                            mode: 'history'
                                                        })}
                                                    >
                                                        {t('accountManagement.nested.history', 'Student History')}
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </DetailCard>
                );
            })}
        </div>
    );
};

const AccountManagementDetailPage = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { lang, accountType = 'student', id } = useParams();
    const currentLang = i18n.language || lang || 'ar';
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = normalizeTab(accountType, searchParams.get('tab'));
    const [selectedStudentContext, setSelectedStudentContext] = useState(null);

    const profileQuery = useAccountManagementSection(accountType, id || '', 'profile', {
        enabled: Boolean(id)
    });
    const sectionQuery = useAccountManagementSection(accountType, id || '', activeTab, {
        enabled: Boolean(id) && activeTab !== 'profile'
    });

    const profile = profileQuery.payload;
    const activePayload = activeTab === 'profile' ? profileQuery.payload : sectionQuery.payload;
    const isLoading = activeTab === 'profile' ? profileQuery.isLoading : sectionQuery.isLoading;
    const activeError = activeTab === 'profile' ? profileQuery.error : sectionQuery.error;
    const refresh = activeTab === 'profile' ? profileQuery.refetch : sectionQuery.refetch;

    const tabs = getTabList(accountType);
    const activeTabConfig = tabs.find((tab) => tab.key === activeTab) ?? tabs[0];
    const ActiveTabIcon = activeTabConfig.icon;
    const accountTypeLabel = accountType === 'teacher'
        ? t('accountManagement.types.teacher', 'Teachers')
        : t('accountManagement.types.student', 'Students');
    const detailSubtitle = accountType === 'teacher'
        ? t('accountManagement.teacherDetailSubtitle', 'Review the teacher profile, current license, halaqas, warnings, leaves, absences, and requests from one place.')
        : t('accountManagement.detailSubtitle', 'Review the student profile, plans, grades, certificates, absences, warnings, and requests from one place.');
    const overviewRows = useMemo(() => buildOverviewRows(profile, currentLang, t), [profile, currentLang, t]);

    const title = getAccountName(profile, currentLang, t);
    const primaryArrayEntries = getPrimaryArrayEntries(activePayload);
    const objectPayload = Array.isArray(activePayload)
        ? null
        : getObjectOnlyPayload(activePayload);

    const handleBack = () => {
        navigate(`/${lang || 'ar'}/account-management?type=${accountType}`);
    };

    const handleTabChange = (tabKey) => {
        setSelectedStudentContext(null);

        setSearchParams((previous) => {
            const next = new URLSearchParams(previous);

            if (tabKey === DEFAULT_TAB) {
                next.delete('tab');
            } else {
                next.set('tab', tabKey);
            }

            return next;
        });
    };

    const renderDefaultSection = () => {
        if (activePayload == null) {
            return <EmptyState message={t('accountManagement.noSectionData', 'No data available for this section.')} />;
        }

        return (
            <div className="space-y-6">
                {objectPayload ? (
                    <DetailCard icon={ActiveTabIcon} title={t(activeTabConfig.labelKey, activeTabConfig.fallback)}>
                        <StructuredObjectDetails data={objectPayload} currentLang={currentLang} t={t} />
                    </DetailCard>
                ) : null}

                {primaryArrayEntries.length > 0 ? (
                    primaryArrayEntries.map(([entryKey, entryValue]) => (
                        <CollectionRenderer
                            key={entryKey}
                            title={entryKey === 'items' ? t(activeTabConfig.labelKey, activeTabConfig.fallback) : getLabelForKey(entryKey, t)}
                            items={entryValue}
                            currentLang={currentLang}
                            t={t}
                        />
                    ))
                ) : !objectPayload ? (
                    <DetailCard icon={ActiveTabIcon} title={t(activeTabConfig.labelKey, activeTabConfig.fallback)}>
                        <StructuredObjectDetails
                            data={isPlainObject(activePayload) ? activePayload : { value: activePayload }}
                            currentLang={currentLang}
                            t={t}
                        />
                    </DetailCard>
                ) : null}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title={title}
                subtitle={detailSubtitle}
                breadcrumb={{
                    label: t('accountManagement.backToList', 'Back to Account Management'),
                    onClick: handleBack
                }}
                badges={[
                    {
                        key: 'type',
                        icon: accountType === 'teacher' ? <TeacherIcon width={16} height={16} /> : <UserIcon width={16} height={16} />,
                        label: accountTypeLabel
                    },
                    {
                        key: 'tab',
                        icon: <ActiveTabIcon width={16} height={16} />,
                        label: t(activeTabConfig.labelKey, activeTabConfig.fallback)
                    }
                ]}
                actions={[
                    {
                        label: t('common.refresh', 'Refresh'),
                        onClick: () => refresh(),
                        variant: 'primary'
                    }
                ]}
            />

            {overviewRows.length > 0 ? (
                <DetailCard icon={accountType === 'teacher' ? TeacherIcon : UserIcon} title={t('accountManagement.overview', 'Quick Overview')}>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {overviewRows.map((row) => (
                            <div key={row.label} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                                <p className="mb-1 text-xs font-medium text-gray-500">{row.label}</p>
                                <div className="text-sm font-semibold text-gray-900 break-words">{row.value}</div>
                            </div>
                        ))}
                    </div>
                </DetailCard>
            ) : null}

            <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                <div className="flex flex-wrap gap-2">
                    {tabs.map((tab) => {
                        const IconComponent = tab.icon;
                        const isActive = tab.key === activeTab;

                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => handleTabChange(tab.key)}
                                className={`inline-flex min-h-[44px] items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition-all ${
                                    isActive
                                        ? 'bg-primary-600 text-white shadow-sm'
                                        : 'bg-gray-50 text-gray-600 hover:bg-primary-50 hover:text-primary-700'
                                }`}
                            >
                                <IconComponent width={16} height={16} />
                                <span>{t(tab.labelKey, tab.fallback)}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {isLoading ? (
                <LoadingState label={t('common.loading', 'Loading...')} />
            ) : activeError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm">
                    {getErrorMessage(activeError) || t('accountManagement.loadDetailError', 'Error loading account details. Please try again.')}
                </div>
            ) : accountType === 'teacher' && activeTab === 'halaqas' ? (
                <div className="space-y-6">
                    <TeacherHalaqasSection
                        payload={activePayload}
                        currentLang={currentLang}
                        t={t}
                        onSelectStudentSection={setSelectedStudentContext}
                    />

                    <TeacherNestedSectionCard
                        teacherId={id || ''}
                        selectedStudentContext={selectedStudentContext ? {
                            ...selectedStudentContext,
                            onClear: () => setSelectedStudentContext(null)
                        } : null}
                        currentLang={currentLang}
                        t={t}
                    />
                </div>
            ) : accountType === 'student' && activeTab === 'plans' ? (
                <StudentPlansSection payload={activePayload} currentLang={currentLang} t={t} />
            ) : (
                renderDefaultSection()
            )}
        </div>
    );
};

export default AccountManagementDetailPage;
