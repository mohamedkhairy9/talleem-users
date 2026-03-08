import { TableColumn } from '@/globals/types';
import type { ReceivedEvaluationItem, GivenEvaluationItem } from '../types/evaluations.types';
import { DateCell } from '@/globals/components';
import { useTranslation } from 'react-i18next';

/**
 * Table columns for Teacher Received Evaluations List
 */
export const createReceivedEvaluationsListColumns = (params: {
    t: ReturnType<typeof useTranslation>['t'];
    getLocalizedText: (obj: { en?: string; ar?: string } | string | null | undefined) => string;
}): TableColumn<ReceivedEvaluationItem>[] => {
    const { t, getLocalizedText } = params;

    return [
        {
            header: t('evaluations.evaluationName', 'Evaluation'),
            accessor: (row: ReceivedEvaluationItem) => getLocalizedText(row.evaluation_name) || '-'
        },
        {
            header: t('evaluations.date', 'Date'),
            cellClassName: 'whitespace-normal align-top',
            accessor: (row: ReceivedEvaluationItem) => (
                <DateCell value={row.evaluation_date?.gregorian ?? row.date?.gregorian ?? ''} />
            )
        },
        {
            header: t('evaluations.submittedBy', 'Submitted By'),
            accessor: (row: ReceivedEvaluationItem) => getLocalizedText(row.submitted_by?.name) || '-'
        },
        {
            header: t('evaluations.evaluated', 'Evaluated'),
            accessor: (row: ReceivedEvaluationItem) => getLocalizedText(row.evaluated?.name) || '-'
        },
        {
            header: t('evaluations.entity', 'Entity'),
            accessor: (row: ReceivedEvaluationItem) => getLocalizedText(row.entity?.name) || '-'
        },
        {
            header: t('evaluations.totalScore', 'Total Score'),
            accessor: (row: ReceivedEvaluationItem) => row.total_score ?? '-'
        }
    ];
};

/**
 * Table columns for Teacher Given Evaluations List (same shape as received)
 */
export const createGivenEvaluationsListColumns = (params: {
    t: ReturnType<typeof useTranslation>['t'];
    getLocalizedText: (obj: { en?: string; ar?: string } | string | null | undefined) => string;
}): TableColumn<GivenEvaluationItem>[] => {
    const { t, getLocalizedText } = params;

    return [
        {
            header: t('evaluations.evaluationName', 'Evaluation'),
            accessor: (row: GivenEvaluationItem) => getLocalizedText(row.evaluation_name) || '-'
        },
        {
            header: t('evaluations.date', 'Date'),
            cellClassName: 'whitespace-normal align-top',
            accessor: (row: GivenEvaluationItem) => (
                <DateCell value={row.evaluation_date?.gregorian ?? row.date?.gregorian ?? ''} />
            )
        },
        {
            header: t('evaluations.evaluated', 'Evaluated'),
            accessor: (row: GivenEvaluationItem) => getLocalizedText(row.evaluated?.name) || '-'
        },
        {
            header: t('evaluations.entity', 'Entity'),
            accessor: (row: GivenEvaluationItem) => getLocalizedText(row.entity?.name) || '-'
        },
        {
            header: t('evaluations.totalScore', 'Total Score'),
            accessor: (row: GivenEvaluationItem) => row.total_score ?? '-'
        }
    ];
};
