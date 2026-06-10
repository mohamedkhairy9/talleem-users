import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EyeIcon, EyeOffIcon } from '@/shared/icons';
/**
 * Input Component
 * Global reusable input component
 */
const Input = ({ label, error, helperText, required = false, className = '', containerClassName = '', type, ...props }) => {
    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const [showPassword, setShowPassword] = useState(false);
    // Follow page direction (RTL in Arabic) for all inputs including email
    const inputDir = isRTL ? 'rtl' : 'ltr';
    // For password inputs, toggle between 'password' and 'text'
    const inputType = type === 'password' ? (showPassword ? 'text' : 'password') : type;
    const isPassword = type === 'password';
    return (<div className={containerClassName}>
            {label && (<label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                    {required && <span className="text-red-500 ms-1">*</span>}
                </label>)}
            <div className="relative">
                <input type={inputType} dir={inputDir} className={`w-full bg-white px-4 py-3 border outline-none rounded-sm focus:border-accent transition-colors duration-200 ${error ? 'border-red-300 focus:border-red-500' : 'border-gray-300'} ${isPassword ? 'pe-12' : ''} ${className}`} {...props}/>
                {isPassword && (<button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-1/2 -translate-y-1/2 end-3 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors duration-200" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                        {showPassword ? (<EyeOffIcon width={20} height={20}/>) : (<EyeIcon width={20} height={20}/>)}
                    </button>)}
            </div>
            {error && (<p className="mt-1 h-4 text-xs text-red-600">{error}</p>)}
            {helperText && !error && (<p className="mt-1 text-sm text-gray-500">{helperText}</p>)}
        </div>);
};
export default Input;
