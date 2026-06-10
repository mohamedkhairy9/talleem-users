import { getDisplayDate } from '@/shared/utils';
/**
 * Table Columns Configuration for Teacher Halaqa List
 * Returns a function that creates table columns with the necessary dependencies
 */
export const createTeacherHalaqaListColumns = (params) => {
    const { t, getLocalizedText, formatActivities } = params;
    return [
        {
            header: t('halaqa.name', 'Name'),
            accessor: (row) => getLocalizedText(row.halaqa.name)
        },
        {
            header: t('halaqa.period', 'Period'),
            accessor: (row) => (row.halaqa.period ? t(`halaqa.period.${row.halaqa.period}`, row.halaqa.period) : '-')
        },
        {
            header: t('halaqa.startDate', 'Start Date'),
            accessor: (row) => getDisplayDate(row.halaqa.start_date)
        },
        {
            header: t('halaqa.endDate', 'End Date'),
            accessor: (row) => getDisplayDate(row.halaqa.end_date)
        },
        {
            header: t('halaqa.sessionTime', 'Session Time'),
            accessor: (row) => row.halaqa.session_time || '-'
        },
        {
            header: t('halaqa.activities', 'Activities'),
            accessor: (row) => formatActivities(row.halaqa.activities)
        },
        {
            header: t('halaqa.platform', 'Platform'),
            accessor: (row) => getLocalizedText(row.halaqa.platform?.name)
        },
        {
            header: t('halaqa.teachingMethod', 'Teaching Method'),
            accessor: (row) => {
                if (!row.halaqa.teaching_method)
                    return '-';
                const keyMap = {
                    in_person: 'inPerson',
                    remote: 'remote',
                    hybrid: 'hybrid'
                };
                const labelKey = keyMap[row.halaqa.teaching_method] ?? row.halaqa.teaching_method;
                return t(`halaqa.teachingMethod.${labelKey}`, row.halaqa.teaching_method);
            }
        },
        {
            header: t('halaqa.students', 'Students'),
            accessor: (row) => row.halaqa.current_students_count ?? row.halaqa.students?.length ?? row.halaqa.max_students ?? '-'
        },
        {
            header: t('halaqa.canRecord', 'Can Record'),
            accessor: (row) => (row.can_record ? t('common.yes', 'Yes') : t('common.no', 'No'))
        }
    ];
};
