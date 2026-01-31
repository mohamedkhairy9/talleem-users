import { TableProps } from '@/globals/types';

/**
 * Table Component
 * Scrollable body with sticky header when used inside a flex container with min-h-0.
 * Pass scrollable to enable the scroll wrapper (for bounded height).
 */
const Table = <T = any>({
    columns = [],
    data = [],
    loading = false,
    emptyMessage = 'No data available',
    className = '',
    scrollable = true
}: TableProps<T>) => {
    const isEmpty = !loading && data.length === 0;

    const tableContent = (
        <>
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                    <tr>
                        {columns.map((column, index) => (
                            <th
                                key={index}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-gray-50">
                            {columns.map((column, colIndex) => (
                                <td
                                    key={colIndex}
                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                >
                                    {column.accessor
                                        ? typeof column.accessor === 'function'
                                            ? column.accessor(row)
                                            : (row as any)[column.accessor]
                                        : column.cell
                                        ? column.cell(row)
                                        : '-'}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );

    if (loading && data.length === 0) {
        return (
            <div className={`flex justify-center items-center py-12 ${className}`}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
        );
    }

    if (isEmpty) {
        return (
            <div className={`text-center py-12 text-gray-500 ${className}`}>
                {emptyMessage}
            </div>
        );
    }

    if (scrollable) {
        return (
            <div
                className={`flex flex-col min-h-0 rounded-lg bg-white overflow-hidden ${className}`}
            >
                <div className="flex-1 min-h-0 overflow-auto overflow-x-auto relative">
                    {loading && data.length > 0 && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20 rounded-lg pointer-events-none">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                        </div>
                    )}
                    {tableContent}
                </div>
            </div>
        );
    }

    return (
        <div className={`overflow-x-auto ${className}`}>
            {tableContent}
        </div>
    );
};

export default Table;
