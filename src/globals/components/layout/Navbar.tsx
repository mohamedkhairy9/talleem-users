import React from 'react';
import { useAuthStore } from '@/stores';
import { useLogoutMutation } from '@/features/auth';
import { useLocale } from '@/utils';
import { Button } from '@/globals/components';

/**
 * Navbar Component
 */
const Navbar: React.FC = () => {
    const { user } = useAuthStore();
    const logout = useLogoutMutation();
    const { currentLocale, changeLanguage } = useLocale();

    const handleLogout = () => {
        logout.mutate();
    };

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-gray-900">Tallem Users Dashboard</h1>
                </div>
                
                <div className="flex items-center gap-4">
                    {/* Language Switcher */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => changeLanguage('en')}
                            className={`px-3 py-1 rounded ${
                                currentLocale === 'en' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            EN
                        </button>
                        <button
                            onClick={() => changeLanguage('ar')}
                            className={`px-3 py-1 rounded ${
                                currentLocale === 'ar' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            AR
                        </button>
                    </div>

                    {/* User Info */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-700">
                            {user?.name || user?.email || 'User'}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleLogout}
                            loading={logout.isPending}
                        >
                            Logout
                        </Button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
