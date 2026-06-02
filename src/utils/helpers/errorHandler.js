/**
 * Error Handler Utilities
 */
/**
 * Format API validation errors (e.g. { leave_sub_type: ["Message 1"] }) into a single string for display.
 */
const formatValidationErrors = (errors) => {
    const messages = [];
    Object.entries(errors).forEach(([, value]) => {
        const list = Array.isArray(value) ? value : [value];
        list.forEach((msg) => {
            if (msg && typeof msg === 'string')
                messages.push(msg);
        });
    });
    return messages.join(' ');
};
/**
 * Get error message from API error.
 * Supports API responses with { success: false, errors: { field: ["message"] } }.
 */
export const getErrorMessage = (error) => {
    const apiErrors = error?.errors ?? error?.data?.errors ?? error?.response?.data?.errors;
    if (apiErrors && typeof apiErrors === 'object' && Object.keys(apiErrors).length > 0) {
        const formatted = formatValidationErrors(apiErrors);
        if (formatted)
            return formatted;
    }
    if (error?.message) {
        return error.message;
    }
    if (error?.data?.message) {
        return error.data.message;
    }
    if (error?.response?.data?.message) {
        return error.response.data.message;
    }
    return 'An error occurred. Please try again.';
};
/**
 * Get validation errors from API error
 */
export const getValidationErrors = (error) => {
    return error?.errors || error?.data?.errors || {};
};
