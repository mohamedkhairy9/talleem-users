import React from 'react';
import { useAuthStore } from '@/stores';
import { useLogoutMutation } from '@/features/auth';
import { useLocale } from '@/utils';
import { Button } from '@/globals/components';
import { MenuIcon } from '@/globals/icons';
import sideLogo from '@/assets/images/tallem-side-logo.svg';

interface NavbarProps {
    onMenuClick: () => void;
}

/**
 * Navbar Component
 */
const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
    const { user } = useAuthStore();
    const logout = useLogoutMutation();
    const { currentLocale, changeLanguage, t } = useLocale();

    const handleLogout = () => {
        logout.mutate();
    };

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Toggle menu"
                    >
                        <MenuIcon width={24} height={24} />
                    </button>
                    <img 
                        src={sideLogo} 
                        alt="Tallem Logo" 
                        className="h-10 object-contain"
                    />
                </div>
                
                <div className="flex items-center gap-4">
                    {/* Language Switcher */}
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => changeLanguage('en')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                                currentLocale === 'en' 
                                    ? 'bg-primary-600 text-white shadow-sm' 
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                        >
                            EN
                        </button>
                        <button
                            onClick={() => changeLanguage('ar')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                                currentLocale === 'ar' 
                                    ? 'bg-primary-600 text-white shadow-sm' 
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                        >
                            AR
                        </button>
                    </div>

                    {/* User Info */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-700">
                            {user?.name || user?.email || t('common.user', 'User')}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleLogout}
                            loading={logout.isPending}
                        >
                            {t('navbar.logout', 'Logout')}
                        </Button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
