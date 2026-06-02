import { DateCell } from '@/globals/components';
/**
 * Table columns for Teacher Received Evaluations List
 */
export const createReceivedEvaluationsListColumns = (params) => {
    const { t, getLocalizedText } = params;
    return [
        {
            header: t('evaluations.evaluationName', 'Evaluation'),
            accessor: (row) => getLocalizedText(row.evaluation_name) || '-'
        },
        {
            header: t('evaluations.date', 'Date'),
            cellClassName: 'whitespace-normal align-top',
            accessor: (row) => (<DateCell value={row.evaluation_date?.gregorian ?? row.date?.gregorian ?? ''}/>)
        },
        {
            header: t('evaluations.submittedBy', 'Submitted By'),
            accessor: (row) => getLocalizedText(row.submitted_by?.name) || '-'
        },
        {
            header: t('evaluations.evaluated', 'Evaluated'),
            accessor: (row) => getLocalizedText(row.evaluated?.name) || '-'
        },
        {
            header: t('evaluations.entity', 'Entity'),
            accessor: (row) => getLocalizedText(row.entity?.name) || '-'
        },
        {
            header: t('evaluations.totalScore', 'Total Score'),
            accessor: (row) => row.total_score ?? '-'
        }
    ];
};
/**
 * Table columns for Teacher Given Evaluations List (same shape as received)
 */
export const createGivenEvaluationsListColumns = (params) => {
    const { t, getLocalizedText } = params;
    return [
        {
            header: t('evaluations.evaluationName', 'Evaluation'),
            accessor: (row) => getLocalizedText(row.evaluation_name) || '-'
        },
        {
            header: t('evaluations.date', 'Date'),
            cellClassName: 'whitespace-normal align-top',
            accessor: (row) => (<DateCell value={row.evaluation_date?.gregorian ?? row.date?.gregorian ?? ''}/>)
        },
        {
            header: t('evaluations.evaluated', 'Evaluated'),
            accessor: (row) => getLocalizedText(row.evaluated?.name) || '-'
        },
        {
            header: t('evaluations.entity', 'Entity'),
            accessor: (row) => getLocalizedText(row.entity?.name) || '-'
        },
        {
            header: t('evaluations.totalScore', 'Total Score'),
            accessor: (row) => row.total_score ?? '-'
        }
    ];
};
