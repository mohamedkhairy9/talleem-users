import React from 'react';
import { useLocale } from '@/utils';
import sideLogo from '@/assets/images/tallem-side-logo.svg';
import { MenuIcon, XIcon } from '@/globals/icons';

/** Navbar height – used so sidebar starts below it (match pt-20 / 5rem in Layout) */
export const NAVBAR_HEIGHT_CLASS = 'h-20'; // 5rem

interface NavbarProps {
    /** When true, sidebar overlay is open / sidebar is collapsed (for button icon) */
    isSidebarOpen?: boolean;
    /** Toggle sidebar */
    onToggleSidebar?: () => void;
    /** Layout direction for LTR/RTL */
    direction?: 'ltr' | 'rtl';
}

/**
 * Navbar Component
 * Full width; menu button opens/closes sidebar (overlay on small, expand/collapse on lg).
 */
const Navbar: React.FC<NavbarProps> = ({
    isSidebarOpen = false,
    onToggleSidebar,
    direction = 'ltr'
}) => {
    const { currentLocale, changeLanguage } = useLocale();

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200 ${NAVBAR_HEIGHT_CLASS}`}>
            <div className="px-4 sm:px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3 sm:gap-4">
                    {/* Menu button: open/close sidebar – same place and styling on all screens */}
                    {onToggleSidebar && (
                        <button
                            type="button"
                            onClick={onToggleSidebar}
                            className="p-2 -m-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                            aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
                        >
                            {isSidebarOpen ? (
                                <XIcon width={24} height={24} />
                            ) : (
                                <MenuIcon width={24} height={24} />
                            )}
                        </button>
                    )}
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
