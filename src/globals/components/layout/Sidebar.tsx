import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { MENU_ITEMS } from '@/config';
import { useLanguagePath } from '@/utils/hooks/useLanguagePath';

/**
 * Sidebar Component
 */
const Sidebar: React.FC = () => {
    const location = useLocation();
    const { user } = useAuthStore();
    const { getPath, getCurrentPathWithoutLang } = useLanguagePath();

    // Filter menu items based on user roles
    const visibleMenuItems = MENU_ITEMS.filter(item => {
        if (!item.roles) return true;
        return item.roles.some(role => user?.roles?.includes(role));
    });

    const currentPath = getCurrentPathWithoutLang();

    return (
        <aside className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
            <nav className="p-4">
                <ul className="space-y-2">
                    {visibleMenuItems.map(item => {
                        const itemPath = getPath(item.path);
                        const normalizedItemPath = item.path === '' ? '' : item.path;
                        const isActive = currentPath === normalizedItemPath;
                        
                        return (
                            <li key={item.path}>
                                <Link
                                    to={itemPath}
                                    className={`block px-4 py-2 rounded-lg transition-colors ${
                                        isActive
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;
