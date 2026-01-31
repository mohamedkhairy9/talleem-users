import React from 'react';
import { useLocale } from '@/utils';
import sideLogo from '@/assets/images/tallem-side-logo.svg';
import { MenuIcon } from '@/globals/icons';

interface NavbarProps {
    /** When true, sidebar is collapsed (narrow); navbar aligns with sidebar with no gap */
    isSidebarCollapsed?: boolean;
    /** Called when user taps the menu button on small screens to open/close sidebar */
    onToggleSidebar?: () => void;
    /** Layout direction for LTR/RTL; navbar inset matches sidebar side */
    direction?: 'ltr' | 'rtl';
}

/**
 * Navbar Component
 * Full width on small screens with a menu button (lg:hidden) to open the sidebar overlay.
 */
const Navbar: React.FC<NavbarProps> = ({
    isSidebarCollapsed = false,
    onToggleSidebar,
    direction = 'ltr'
}) => {
    const { currentLocale, changeLanguage } = useLocale();
    // Full width on small screens (left-0 right-0); on lg+ inset by sidebar
    const insetClasses =
        direction === 'rtl'
            ? 'left-0 right-0 lg:left-0'
            : 'left-0 right-0 lg:right-0';
    const sidebarOffset =
        direction === 'rtl'
            ? isSidebarCollapsed
                ? 'lg:right-16'
                : 'lg:right-64'
            : isSidebarCollapsed
                ? 'lg:left-16'
                : 'lg:left-64';

    return (
        <nav className={`fixed top-0 z-50 bg-white shadow-sm border-b border-gray-200 transition-all duration-300 ${insetClasses} ${sidebarOffset}`}>
            <div className="px-4 sm:px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3 sm:gap-4">
                    {/* Menu button: visible only on small screens to open sidebar overlay */}
                    {onToggleSidebar && (
                        <button
                            type="button"
                            onClick={onToggleSidebar}
                            className="lg:hidden p-2 -m-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                            aria-label="Open menu"
                        >
                            <MenuIcon width={24} height={24} />
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
