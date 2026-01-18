import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores';
import { MENU_ITEMS } from '@/config';
import { useLanguagePath } from '@/utils/hooks/useLanguagePath';
import { XIcon } from '@/globals/icons';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Sidebar Component
 */
const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const location = useLocation();
    const { lang } = useParams<{ lang: string }>();
    const { user } = useAuthStore();
    const { t } = useTranslation();
    const { getPath, getCurrentPathWithoutLang } = useLanguagePath();
    const isRTL = lang === 'ar';

    // Filter menu items based on user roles and permissions
    // User can have multiple roles (e.g., teacher and student)
    const visibleMenuItems = MENU_ITEMS.filter(item => {
        // If no restrictions, show to everyone
        if (!item.roles && !item.permissions) return true;
        
        // Check roles - user needs at least one of the specified roles
        if (item.roles && item.roles.length > 0) {
            const hasRole = item.roles.some(role => user?.roles?.includes(role));
            if (!hasRole) return false;
        }
        
        // Check permissions - user needs at least one of the specified permissions
        if (item.permissions && item.permissions.length > 0) {
            const hasPermission = item.permissions.some(permission => 
                user?.permissions?.includes(permission)
            );
            if (!hasPermission) return false;
        }
        
        return true;
    });

    const currentPath = getCurrentPathWithoutLang();

    const handleLinkClick = () => {
        // Close sidebar on mobile when a link is clicked
        if (window.innerWidth < 1024) {
            onClose();
        }
    };

    return (
        <>
            {/* Backdrop overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed lg:static top-0 ${isRTL ? 'right-0' : 'left-0'} 
                    w-64 bg-white shadow-sm min-h-screen z-50
                    ${isRTL ? 'border-l' : 'border-r'} border-gray-200
                    transform transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : isRTL ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}
            >
                {/* Close button for mobile */}
                <div className="lg:hidden flex justify-end p-4 border-b border-gray-200">
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Close menu"
                    >
                        <XIcon width={24} height={24} />
                    </button>
                </div>

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
                                        onClick={handleLinkClick}
                                        className={`block px-4 py-2 rounded-lg transition-colors ${
                                            isActive
                                                ? 'bg-primary-600 text-white'
                                                : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                    >
                                        {item.labelKey ? t(item.labelKey, item.label) : item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </aside>
        </>
    );
};

export default Sidebar;
