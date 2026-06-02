import { getDisplayDate } from '@/utils';
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
            accessor: (row) => (row.period ? t(`halaqa.period.${row.period}`, row.period) : '-')
        },
        {
            header: t('halaqa.startDate', 'Start Date'),
            accessor: (row) => getDisplayDate(row.start_date)
        },
        {
            header: t('halaqa.endDate', 'End Date'),
            accessor: (row) => getDisplayDate(row.end_date)
        },
        {
            header: t('halaqa.sessionTime', 'Session Time'),
            accessor: (row) => row.session_time || '-'
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
