import React from 'react';
import { useTranslation } from 'react-i18next';
import { InputProps } from '@/globals/types';

/**
 * Input Component
 * Global reusable input component
 */
const Input: React.FC<InputProps> = ({
    label,
    error,
    helperText,
    required = false,
    className = '',
    containerClassName = '',
    type,
    ...props
}) => {
    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    
    // Determine text direction based on input type and language
    // Email inputs are always LTR, password follows language direction
    const inputDir = type === 'email' ? 'ltr' : (isRTL ? 'rtl' : 'ltr');

    return (
        <div className={containerClassName}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <input
                type={type}
                dir={inputDir}
                className={`w-full px-4 py-3 border outline-none rounded-lg focus:border-accent transition-colors duration-200 ${
                    error ? 'border-red-300 focus:border-red-500' : 'border-gray-300'
                } ${className}`}
                {...props}
            />
            {error && (
                <p className="mt-1 h-4 text-xs text-red-600">{error}</p>
            )}
            {helperText && !error && (
                <p className="mt-1 text-sm text-gray-500">{helperText}</p>
            )}
        </div>
    );
};

export default Input;
