import React, { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Table } from '@/globals/components';
import { useGivenEvaluations } from '../hooks/useEvaluations';
import GivenEvaluationsListMobile from './GivenEvaluationsListMobile';
import { createGivenEvaluationsListColumns } from '../config/table.config';
import { getLocalizedText as getLocalizedTextHelper } from '@/utils/helpers/getLocalizedText';
import { useDateFormatStore } from '@/stores';
/**
 * Teacher Given Evaluations List
 * Responsive: cards on mobile, table on desktop (evaluations the teacher submitted)
 */
const GivenEvaluationsList = () => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'ar';
    useDateFormatStore((s) => s.dateFormat);
    const { list, isLoading, error } = useGivenEvaluations();
    const getLocalizedText = useCallback((obj) => getLocalizedTextHelper(obj, currentLang, t('common.not_available', 'N/A')), [currentLang, t]);
    const columns = useMemo(() => createGivenEvaluationsListColumns({ t, getLocalizedText }), [t, getLocalizedText]);
    if (error) {
        return (<div className="text-center py-12 text-red-600">
                {t('evaluations.loadError', 'Error loading evaluations. Please try again.')}
            </div>);
    }
    return (<div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex flex-1 flex-col overflow-hidden md:hidden min-h-[280px] bg-white rounded-lg">
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
                    <GivenEvaluationsListMobile list={list} isLoading={isLoading} hasError={!!error} errorMessage={error ? t('evaluations.loadError', 'Error loading evaluations.') : undefined} emptyMessage={t('evaluations.noGivenEvaluations', 'No evaluations submitted yet.')} getLocalizedText={getLocalizedText}/>
                </div>
            </div>

            <div className="hidden md:flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="flex-1 min-h-0 overflow-hidden">
                    <Table columns={columns} data={list} loading={isLoading} emptyMessage={t('evaluations.noGivenEvaluations', 'No evaluations submitted yet.')} scrollable/>
                </div>
            </div>
        </div>);
};
export default GivenEvaluationsList;
