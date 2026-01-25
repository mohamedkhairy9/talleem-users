import React from 'react';
import { useLocale } from '@/utils';
import { MenuIcon, XIcon } from '@/globals/icons';
import sideLogo from '@/assets/images/tallem-side-logo.svg';

interface NavbarProps {
    onMenuClick: () => void;
    isSidebarOpen: boolean;
}

/**
 * Navbar Component
 */
const Navbar: React.FC<NavbarProps> = ({ onMenuClick, isSidebarOpen }) => {
    const { currentLocale, changeLanguage } = useLocale();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200">
            <div className="px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
                    >
                        {isSidebarOpen ? (
                            <XIcon width={24} height={24} />
                        ) : (
                            <MenuIcon width={24} height={24} />
                        )}
                    </button>
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
