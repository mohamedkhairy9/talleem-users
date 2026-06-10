import React from 'react';
import Button from '../ui/Button';
/**
 * Pagination Component
 * Global reusable pagination component
 */
const Pagination = ({ currentPage = 1, totalPages = 1, perPage = 10, total = 0, onPageChange, className = '' }) => {
    const start = (currentPage - 1) * perPage + 1;
    const end = Math.min(currentPage * perPage, total);
    return (<div className={`flex items-center justify-between ${className}`}>
            <div className="text-sm text-gray-700">
                Showing {start} to {end} of {total} results
            </div>
            
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
                    Previous
                </Button>
                
                <span className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                </span>
                
                <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                    Next
                </Button>
            </div>
        </div>);
};
export default Pagination;
