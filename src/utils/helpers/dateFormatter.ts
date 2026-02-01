/**
 * Format date to day/month/year format
 * @param date - Date string or Date object
 * @returns Formatted date string in DD/MM/YYYY format, or '-' if date is invalid
 */
export const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return '-';
    
    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        
        // Check if date is valid
        if (isNaN(dateObj.getTime())) return '-';
        
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        
        return `${day}/${month}/${year}`;
    } catch (error) {
        return '-';
    }
};

