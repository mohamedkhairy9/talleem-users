import { EyeIcon, EditIcon, TrashIcon } from '@/shared/icons';
import { useTranslation } from 'react-i18next';
/**
 * Table Component
 * Scrollable body with sticky header when used inside a flex container with min-h-0.
 * Pass scrollable to enable the scroll wrapper (for bounded height).
 */
const Table = ({ columns = [], data = [], loading = false, emptyMessage = 'No data available', className = '', scrollable = true, actionButtons, rowClassName }) => {
    const { t } = useTranslation();
    const isEmpty = !loading && data.length === 0;
    // Render action buttons if configured
    const renderActionButtons = (row) => {
        if (!actionButtons)
            return null;
        const { showView, showEdit, showDelete, onView, onEdit, onDelete, isDeleting, customActions = [] } = actionButtons;
        const hasAnyAction = showView || showEdit || showDelete || customActions.length > 0;
        if (!hasAnyAction)
            return null;
        return (<div className="flex items-center gap-1">
                {customActions.map((action) => {
                    const isDisabled = typeof action.disabled === 'function' ? action.disabled(row) : Boolean(action.disabled);
                    const label = typeof action.label === 'function' ? action.label(row) : action.label;
                    const title = typeof action.title === 'function' ? action.title(row) : (action.title ?? label);
                    const className = action.className ?? 'inline-flex items-center gap-1 rounded-lg bg-primary-50 px-3 py-2 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-100 disabled:opacity-50 disabled:cursor-not-allowed';
                    const Icon = action.icon;

                    return (
                        <button
                            key={action.key}
                            type="button"
                            onClick={() => action.onClick(row)}
                            disabled={isDisabled}
                            className={className}
                            aria-label={title}
                            title={title}
                        >
                            {Icon ? <Icon width={16} height={16} /> : null}
                            {label ? <span>{label}</span> : null}
                        </button>
                    );
                })}
                {showView && onView && (<button type="button" onClick={() => onView(row)} className="p-2 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-colors" aria-label={t('common.view', 'View')} title={t('common.view', 'View')}>
                        <EyeIcon width={18} height={18}/>
                    </button>)}
                {showEdit && onEdit && (<button type="button" onClick={() => onEdit(row)} className="p-2 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-colors" aria-label={t('common.edit', 'Edit')} title={t('common.edit', 'Edit')}>
                        <EditIcon width={18} height={18}/>
                    </button>)}
                {showDelete && onDelete && (<button type="button" onClick={() => onDelete(row)} disabled={isDeleting} className="p-2 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" aria-label={t('common.delete', 'Delete')} title={t('common.delete', 'Delete')}>
                        <TrashIcon width={18} height={18}/>
                    </button>)}
            </div>);
    };
    // Combine columns with action column if configured
    const actionColumn = actionButtons && (actionButtons.showView || actionButtons.showEdit || actionButtons.showDelete || actionButtons.customActions?.length > 0)
        ? {
            header: t('common.actions', 'Actions'),
            cell: (row) => renderActionButtons(row)
        }
        : null;
    const allColumns = actionColumn ? [...columns, actionColumn] : columns;
    const DEFAULT_MIN_WIDTH_PX = 100;
    const getMinWidthStyle = (col) => {
        const raw = col.minWidth != null ? col.minWidth : DEFAULT_MIN_WIDTH_PX;
        const value = typeof raw === 'number' ? `${raw}px` : raw;
        return { minWidth: value };
    };
    const tableContent = (<>
            <table className="w-max min-w-full table-auto divide-y divide-gray-200 border-collapse">
                <colgroup>
                    {allColumns.map((col, index) => (<col key={index} style={getMinWidthStyle(col)}/>))}
                </colgroup>
                <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                    <tr>
                        {allColumns.map((column, index) => (<th key={index} style={getMinWidthStyle(column)} className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {column.header}
                            </th>))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((row, rowIndex) => (<tr key={rowIndex} className={`hover:bg-gray-50 ${typeof rowClassName === 'function' ? rowClassName(row) : (rowClassName ?? '')}`}>
                            {allColumns.map((column, colIndex) => (<td key={colIndex} style={getMinWidthStyle(column)} className={`px-6 py-4 text-sm text-gray-900 text-start ${column.cellClassName ?? 'whitespace-nowrap'}`}>
                                    {column.accessor
                    ? typeof column.accessor === 'function'
                        ? column.accessor(row)
                        : row[column.accessor]
                    : column.cell
                        ? column.cell(row)
                        : '-'}
                                </td>))}
                        </tr>))}
                </tbody>
            </table>
        </>);
    if (loading && data.length === 0) {
        return (<div className={`flex justify-center items-center py-12 ${className}`}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"/>
            </div>);
    }
    if (isEmpty) {
        return (<div className={`text-center py-12 text-gray-500 ${className}`}>
                {emptyMessage}
            </div>);
    }
    if (scrollable) {
        return (<div className={`flex flex-col min-h-0 h-full rounded-lg bg-white overflow-hidden ${className}`}>
                {/*
                Uses flex-1 to fill available space and adapts to viewport height changes.
                Parent container should have flex layout with min-h-0 for proper sizing.
            */}
                <div className="table-scrollbar flex-1 min-h-0 overflow-auto overflow-x-auto relative">
                    {loading && data.length > 0 && (<div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20 rounded-lg pointer-events-none">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"/>
                        </div>)}
                    {tableContent}
                </div>
            </div>);
    }
    return (<div className={`overflow-x-auto ${className}`}>
            {tableContent}
        </div>);
};
export default Table;
