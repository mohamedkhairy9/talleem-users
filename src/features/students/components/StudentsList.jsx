import React from 'react';
import Table from '@/globals/components/tables/Table';
import Pagination from '@/globals/components/tables/Pagination';

/**
 * Students List Component
 * Feature-specific component for displaying students
 */
const StudentsList = ({
    students = [],
    loading = false,
    pagination,
    onPageChange
}) => {
    const columns = [
        {
            header: 'ID',
            accessor: 'id'
        },
        {
            header: 'Name',
            accessor: 'name'
        },
        {
            header: 'Email',
            accessor: 'email'
        },
        {
            header: 'Status',
            accessor: (row) => (
                <span className={`px-2 py-1 rounded text-xs ${
                    row.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                }`}>
                    {row.status}
                </span>
            )
        }
    ];

    return (
        <div>
            <Table
                columns={columns}
                data={students}
                loading={loading}
                emptyMessage="No students found"
            />
            {pagination && (
                <Pagination
                    currentPage={pagination.page}
                    totalPages={Math.ceil(pagination.total / pagination.per_page)}
                    perPage={pagination.per_page}
                    total={pagination.total}
                    onPageChange={onPageChange}
                    className="mt-4"
                />
            )}
        </div>
    );
};

export default StudentsList;
