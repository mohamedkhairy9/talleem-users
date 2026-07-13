import { EyeIcon, EditIcon, TrashIcon } from '@/shared/icons';
import { useTranslation } from 'react-i18next';

/**
 * Table Component
 * Scrollable body with sticky header when used inside a flex container with min-h-0.
 * Pass scrollable to enable the scroll wrapper (for bounded height).
 */
const Table = ({
    columns = [],
    data = [],
    loading = false,
    emptyMessage = 'No data available',
    className = '',
    scrollable = true,
    actionButtons,
    rowClassName,
    mobileCards = false
}) => {
    const { t } = useTranslation();
    const isEmpty = !loading && data.length === 0;

    const getCellContent = (column, row) => {
        if (column.accessor) {
            return typeof column.accessor === 'function'
                ? column.accessor(row)
                : row[column.accessor];
        }

        if (column.cell) {
            return column.cell(row);
        }

        return '-';
    };

    const renderActionButtons = (row, { mobile = false } = {}) => {
        if (!actionButtons) {
            return null;
        }

        const {
            showView,
            showEdit,
            showDelete,
            onView,
            onEdit,
            onDelete,
            isDeleting,
            customActions = []
        } = actionButtons;
        const hasAnyAction = showView || showEdit || showDelete || customActions.length > 0;

        if (!hasAnyAction) {
            return null;
        }

        return (
            <div className="flex flex-wrap items-center gap-2">
                {customActions.map((action) => {
                    const isDisabled = typeof action.disabled === 'function' ? action.disabled(row) : Boolean(action.disabled);
                    const label = typeof action.label === 'function' ? action.label(row) : action.label;
                    const title = typeof action.title === 'function' ? action.title(row) : (action.title ?? label);
                    const customClassName = action.className ?? 'inline-flex items-center gap-1 rounded-lg bg-primary-50 px-3 py-2 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-50';
                    const Icon = action.icon;

                    return (
                        <button
                            key={action.key}
                            type="button"
                            onClick={() => action.onClick(row)}
                            disabled={isDisabled}
                            className={customClassName}
                            aria-label={title}
                            title={title}
                        >
                            {Icon ? <Icon width={16} height={16} /> : null}
                            {label ? <span>{label}</span> : null}
                        </button>
                    );
                })}

                {showView && onView ? (
                    <button
                        type="button"
                        onClick={() => onView(row)}
                        className={mobile
                            ? 'inline-flex items-center gap-1 rounded-lg bg-primary-50 px-3 py-2 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-100'
                            : 'rounded-lg p-2 text-gray-600 transition-colors hover:bg-primary-50 hover:text-primary-600'}
                        aria-label={t('common.view', 'View')}
                        title={t('common.view', 'View')}
                    >
                        <EyeIcon width={18} height={18} />
                        {mobile ? <span>{t('common.view', 'View')}</span> : null}
                    </button>
                ) : null}

                {showEdit && onEdit ? (
                    <button
                        type="button"
                        onClick={() => onEdit(row)}
                        className={mobile
                            ? 'inline-flex items-center gap-1 rounded-lg bg-primary-50 px-3 py-2 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-100'
                            : 'rounded-lg p-2 text-gray-600 transition-colors hover:bg-primary-50 hover:text-primary-600'}
                        aria-label={t('common.edit', 'Edit')}
                        title={t('common.edit', 'Edit')}
                    >
                        <EditIcon width={18} height={18} />
                        {mobile ? <span>{t('common.edit', 'Edit')}</span> : null}
                    </button>
                ) : null}

                {showDelete && onDelete ? (
                    <button
                        type="button"
                        onClick={() => onDelete(row)}
                        disabled={isDeleting}
                        className={mobile
                            ? 'inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50'
                            : 'rounded-lg p-2 text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50'}
                        aria-label={t('common.delete', 'Delete')}
                        title={t('common.delete', 'Delete')}
                    >
                        <TrashIcon width={18} height={18} />
                        {mobile ? <span>{t('common.delete', 'Delete')}</span> : null}
                    </button>
                ) : null}
            </div>
        );
    };

    const actionColumn = actionButtons && (actionButtons.showView || actionButtons.showEdit || actionButtons.showDelete || actionButtons.customActions?.length > 0)
        ? {
            header: t('common.actions', 'Actions'),
            cell: (row) => renderActionButtons(row)
        }
        : null;
    const allColumns = actionColumn ? [...columns, actionColumn] : columns;
    const mobileCardColumns = columns.filter((column) => !column.hideOnMobileCard);

    const DEFAULT_MIN_WIDTH_PX = 100;
    const getMinWidthStyle = (col) => {
        const raw = col.minWidth != null ? col.minWidth : DEFAULT_MIN_WIDTH_PX;
        const value = typeof raw === 'number' ? `${raw}px` : raw;
        return { minWidth: value };
    };

    const tableContent = (
        <table className="w-max min-w-full table-auto divide-y divide-gray-200 border-collapse">
            <colgroup>
                {allColumns.map((col, index) => (
                    <col key={index} style={getMinWidthStyle(col)} />
                ))}
            </colgroup>

            <thead className="sticky top-0 z-10 bg-gray-50 shadow-sm">
                <tr>
                    {allColumns.map((column, index) => (
                        <th
                            key={index}
                            style={getMinWidthStyle(column)}
                            className="px-6 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500"
                        >
                            {column.header}
                        </th>
                    ))}
                </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 bg-white">
                {data.map((row, rowIndex) => (
                    <tr
                        key={rowIndex}
                        className={`hover:bg-gray-50 ${typeof rowClassName === 'function' ? rowClassName(row) : (rowClassName ?? '')}`}
                    >
                        {allColumns.map((column, colIndex) => (
                            <td
                                key={colIndex}
                                style={getMinWidthStyle(column)}
                                className={`px-6 py-4 text-start text-sm text-gray-900 ${column.cellClassName ?? 'whitespace-nowrap'}`}
                            >
                                {getCellContent(column, row)}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );

    const mobileCardsContent = mobileCards ? (
        <div className="space-y-3 p-3 md:hidden">
            {data.map((row, rowIndex) => (
                <article
                    key={row?.id ?? row?.uuid ?? row?.student_id ?? row?.teacher_id ?? rowIndex}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                    <div className="space-y-3">
                        {mobileCardColumns.map((column, colIndex) => (
                            <div
                                key={`${rowIndex}-${colIndex}`}
                                className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0"
                            >
                                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                    {column.mobileLabel ?? column.header}
                                </p>
                                <div className="break-words text-sm text-gray-900">
                                    {getCellContent(column, row)}
                                </div>
                            </div>
                        ))}
                    </div>

                    {actionColumn ? (
                        <div className="mt-4 border-t border-gray-100 pt-3">
                            {renderActionButtons(row, { mobile: true })}
                        </div>
                    ) : null}
                </article>
            ))}
        </div>
    ) : null;

    if (loading && data.length === 0) {
        return (
            <div className={`flex items-center justify-center py-12 ${className}`}>
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600" />
            </div>
        );
    }

    if (isEmpty) {
        return (
            <div className={`py-12 text-center text-gray-500 ${className}`}>
                {emptyMessage}
            </div>
        );
    }

    if (scrollable) {
        return (
            <div className={`flex h-full min-h-0 flex-col overflow-hidden rounded-lg bg-white ${className}`}>
                {mobileCardsContent}

                <div className={`table-scrollbar relative min-h-0 flex-1 overflow-auto overflow-x-auto ${mobileCards ? 'hidden md:block' : ''}`}>
                    {loading && data.length > 0 ? (
                        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-white/80">
                            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600" />
                        </div>
                    ) : null}
                    {tableContent}
                </div>
            </div>
        );
    }

    return (
        <div className={className}>
            {mobileCardsContent}
            <div className={`overflow-x-auto ${mobileCards ? 'hidden md:block' : ''}`}>
                {tableContent}
            </div>
        </div>
    );
};

export default Table;
