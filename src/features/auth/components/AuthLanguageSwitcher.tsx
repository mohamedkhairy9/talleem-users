import React from 'react';
import { useLocale } from '@/utils';

/**
 * Language switcher for auth pages (login, register)
 */
const AuthLanguageSwitcher: React.FC = () => {
    const { currentLocale, changeLanguage } = useLocale();

    return (
        <div className="flex items-center gap-0.5 bg-white/20 p-0.5 rounded-md">
            <button
                type="button"
                onClick={() => changeLanguage('en')}
                className={`px-2.5 py-1.5 rounded text-sm font-medium transition-all duration-200 ${
                    currentLocale === 'en'
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'text-white/90 hover:bg-white/30'
                }`}
            >
                EN
            </button>
            <button
                type="button"
                onClick={() => changeLanguage('ar')}
                className={`px-2.5 py-1.5 rounded text-sm font-medium transition-all duration-200 ${
                    currentLocale === 'ar'
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'text-white/90 hover:bg-white/30'
                }`}
            >
                AR
            </button>
        </div>
    );
};

export default AuthLanguageSwitcher;
