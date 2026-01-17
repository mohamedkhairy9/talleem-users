import { ApiError } from '@/globals/types';

/**
 * Error Handler Utilities
 */

/**
 * Get error message from API error
 */
export const getErrorMessage = (error: ApiError | Error | any): string => {
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
export const getValidationErrors = (error: ApiError | any): Record<string, string[]> => {
    return error?.errors || error?.data?.errors || {};
};
