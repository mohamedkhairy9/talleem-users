import { getDisplayDate } from '@/shared/utils';
const getHalaqaPeriodValue = (row) => row.period ?? row.session_period ?? row.time_period ?? row.shift ?? null;
const getHalaqaStartDateValue = (row) =>
    row.date?.from ?? row.start_date ?? row.startDate ?? row.from_date ?? null;

const getHalaqaEndDateValue = (row) =>
    row.date?.to ?? row.end_date ?? row.endDate ?? row.to_date ?? null;
const getHalaqaSessionTimeValue = (row) => row.session_time ??
    row.sessionTime ??
    (row.session_from && row.session_to ? `${row.session_from}-${row.session_to}` : null) ??
    null;
/**
 * Table Columns Configuration for Halaqa List
 * Returns a function that creates table columns with the necessary dependencies
 */
export const createHalaqaListColumns = (params) => {
    const { t, getLocalizedText, formatActivities } = params;
    return [
        {
            header: t('halaqa.name', 'Name'),
            accessor: (row) => getLocalizedText(row.name)
        },
        {
            header: t('halaqa.teacher', 'Teacher'),
            accessor: (row) => getLocalizedText(row.teacher?.name)
        },
        {
            header: t('halaqa.period', 'Period'),
            accessor: (row) => {
                console.log('Row:', row);

                const periodValue = getHalaqaPeriodValue(row);

                console.log('Period Value:', periodValue);

                return periodValue
                    ? t(`halaqa.period.${periodValue}`, periodValue)
                    : '-';
            }
        },
        {
            header: t('halaqa.startDate', 'Start Date'),
            accessor: (row) => getDisplayDate(getHalaqaStartDateValue(row))
        },
        {
            header: t('halaqa.endDate', 'End Date'),
            accessor: (row) => getDisplayDate(getHalaqaEndDateValue(row))
        },
        {
            header: t('halaqa.sessionTime', 'Session Time'),
            accessor: (row) => getHalaqaSessionTimeValue(row) || '-'
        },
        {
            header: t('halaqa.activities', 'Activities'),
            accessor: (row) => formatActivities(row.activities)
        },
        {
            header: t('halaqa.platform', 'Platform'),
            accessor: (row) => getLocalizedText(row.platform?.name)
        },
        {
            header: t('halaqa.teachingMethod', 'Teaching Method'),
            accessor: (row) => {
                if (!row.teaching_method)
                    return '-';
                const keyMap = {
                    in_person: 'inPerson',
                    remote: 'remote',
                    hybrid: 'hybrid'
                };
                const labelKey = keyMap[row.teaching_method] ?? row.teaching_method;
                return t(`halaqa.teachingMethod.${labelKey}`, row.teaching_method);
            }
        },
        {
            header: t('halaqa.students', 'Students'),
            accessor: (row) => row.current_students_count ?? row.students?.length ?? row.max_students ?? '-'
        }
    ];
};
