import React, { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Table } from '@/globals/components';
import { useEntityLicenses } from '../hooks/useLicenses';
import EntityLicensesListMobile from './EntityLicensesListMobile';
import { createEntityLicensesListColumns } from '../config/table.config';
import { getLocalizedText as getLocalizedTextHelper } from '@/utils/helpers/getLocalizedText';
import { useDateFormatStore } from '@/stores';

/**
 * Entity Manager Licenses List
 * Responsive: cards on mobile, table on desktop (no pagination - API returns full list)
 */
const EntityLicensesList: React.FC = () => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'ar';
    useDateFormatStore((s) => s.dateFormat);

    const { list, isLoading, error } = useEntityLicenses();

    const getLocalizedText = useCallback(
        (obj: Parameters<typeof getLocalizedTextHelper>[0]) =>
            getLocalizedTextHelper(obj, currentLang, t('common.not_available', 'N/A')),
        [currentLang, t]
    );

    const columns = useMemo(
        () => createEntityLicensesListColumns({ t, getLocalizedText }),
        [t, getLocalizedText]
    );

    if (error) {
        return (
            <div className="text-center py-12 text-red-600">
                {t('licenses.loadError', 'Error loading licenses. Please try again.')}
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex flex-1 flex-col overflow-hidden md:hidden min-h-[280px] bg-white rounded-lg">
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
                    <EntityLicensesListMobile
                        list={list}
                        isLoading={isLoading}
                        hasError={!!error}
                        errorMessage={error ? t('licenses.loadError', 'Error loading licenses.') : undefined}
                        emptyMessage={t('licenses.noLicenses', 'No licenses found.')}
                        getLocalizedText={getLocalizedText}
                    />
                </div>
            </div>

            <div className="hidden md:flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="flex-1 min-h-0 overflow-hidden">
                    <Table
                        columns={columns}
                        data={list}
                        loading={isLoading}
                        emptyMessage={t('licenses.noLicenses', 'No licenses found.')}
                        scrollable
                    />
                </div>
            </div>
        </div>
    );
};

export default EntityLicensesList;
