import React from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';

/**
 * Global reusable pagination component
 */
const Pagination = ({ currentPage = 1, totalPages = 1, perPage = 10, total = 0, onPageChange, className = '' }) => {
    const { t } = useTranslation();
    const start = (currentPage - 1) * perPage + 1;
    const end = Math.min(currentPage * perPage, total);

    return (
        <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}>
            <div className="text-center text-sm text-gray-700 sm:text-start">
                {t('common.paginationSummary', 'Showing {{start}} to {{end}} of {{total}} results', {
                    start,
                    end,
                    total
                })}
            </div>

            <div className="flex items-center gap-2">
                <Button
                    className="flex-1 sm:flex-none"
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    {t('common.previous', 'Previous')}
                </Button>

                <span className="min-w-[110px] text-center text-sm text-gray-700">
                    {t('common.paginationPage', 'Page {{currentPage}} of {{totalPages}}', {
                        currentPage,
                        totalPages
                    })}
                </span>

                <Button
                    className="flex-1 sm:flex-none"
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    {t('common.next', 'Next')}
                </Button>
            </div>
        </div>
    );
};

export default Pagination;
