import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { MENU_ITEMS } from '@/config';

/**
 * Sidebar Component
 */
const Sidebar: React.FC = () => {
    const location = useLocation();
    const { user } = useAuthStore();

    // Filter menu items based on user roles
    const visibleMenuItems = MENU_ITEMS.filter(item => {
        if (!item.roles) return true;
        return item.roles.some(role => user?.roles?.includes(role));
    });

    return (
        <aside className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
            <nav className="p-4">
                <ul className="space-y-2">
                    {visibleMenuItems.map(item => (
                        <li key={item.path}>
                            <Link
                                to={item.path}
                                className={`block px-4 py-2 rounded-lg transition-colors ${
                                    location.pathname === item.path
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                {item.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;
