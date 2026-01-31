import React from 'react';
import { useLocale } from '@/utils';
import sideLogo from '@/assets/images/tallem-side-logo.svg';

interface NavbarProps {
    /** When true, sidebar is collapsed (narrow); navbar aligns with sidebar with no gap */
    isSidebarCollapsed?: boolean;
    /** Layout direction for LTR/RTL; navbar inset matches sidebar side */
    direction?: 'ltr' | 'rtl';
}

/**
 * Navbar Component
 * In LTR: navbar starts after sidebar (left-16/64). In RTL: navbar ends before sidebar (right-16/64).
 */
const Navbar: React.FC<NavbarProps> = ({ isSidebarCollapsed = false, direction = 'ltr' }) => {
    const { currentLocale, changeLanguage } = useLocale();
    const insetClasses =
        direction === 'rtl'
            ? isSidebarCollapsed
                ? 'left-0 lg:right-16'
                : 'left-0 lg:right-64'
            : isSidebarCollapsed
                ? 'right-0 lg:left-16'
                : 'right-0 lg:left-64';

    return (
        <nav className={`fixed top-0 z-50 bg-white shadow-sm border-b border-gray-200 transition-all duration-300 ${insetClasses}`}>
            <div className="px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <img 
                        src={sideLogo} 
                        alt="Tallem Logo" 
                        className="h-10 object-contain"
                    />
                </div>
                
                <div className="flex items-center gap-2">
                    {/* Language Switcher - Smaller */}
                    <div className="flex items-center gap-0.5 bg-gray-100 p-0.5 rounded-md">
                        <button
                            onClick={() => changeLanguage('en')}
                            className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                                currentLocale === 'en' 
                                    ? 'bg-primary-600 text-white shadow-sm' 
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                        >
                            EN
                        </button>
                        <button
                            onClick={() => changeLanguage('ar')}
                            className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                                currentLocale === 'ar' 
                                    ? 'bg-primary-600 text-white shadow-sm' 
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                        >
                            AR
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
