import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { useLogoutMutation } from '@/features/auth';
import { useLocale } from '@/utils';
import { MENU_ITEMS } from '@/config';
import { useLanguagePath } from '@/utils/hooks/useLanguagePath';
import { Button } from '@/globals/components';
import { MenuItem } from '@/globals/types';
import {
    XIcon,
    HomeIcon,
    BookIcon,
    CalendarIcon,
    StarIcon,
    AwardIcon,
    AlertTriangleIcon,
    ArrowRightLeftIcon,
    ClipboardCheckIcon,
    BookOpenIcon,
    SettingsIcon,
    TeacherIcon,
    UsersIcon,
    CircleIcon,
    PlusIcon,
    ChevronDownIcon,
    ChevronRightIcon
} from '@/globals/icons';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

/**
 * Sidebar Component
 */
const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isCollapsed = false, onToggleCollapse }) => {
    const { user } = useAuthStore();
    const logout = useLogoutMutation();
    const { currentLocale, t } = useLocale();
    const { getPath, getCurrentPathWithoutLang } = useLanguagePath();
    const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set());

    const handleLogout = () => {
        logout.mutate();
    };

    // Get user display name (handles bilingual name structure)
    const getUserDisplayName = (): string => {
        if (!user) return t('common.user', 'User');
        
        if (typeof user.name === 'object' && user.name !== null) {
            // Bilingual name object
            return currentLocale === 'ar' ? user.name.ar : user.name.en;
        }
        
        // String name or fallback
        return user.name || user.email || t('common.user', 'User');
    };

    // Filter menu items based on user roles and permissions
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

    // Icon mapping - maps icon name to component
    const iconMap: Record<string, React.ComponentType<any>> = {
        HomeIcon,
        BookIcon,
        CalendarIcon,
        StarIcon,
        AwardIcon,
        AlertTriangleIcon,
        ArrowRightLeftIcon,
        ClipboardCheckIcon,
        BookOpenIcon,
        SettingsIcon,
        TeacherIcon,
        UsersIcon,
        CircleIcon,
        PlusIcon
    };

    // Get icon component by name
    const getIcon = (iconName?: string) => {
        if (!iconName) return null;
        const IconComponent = iconMap[iconName];
        if (!IconComponent) return null;
        return <IconComponent width={isCollapsed ? 24 : 20} height={isCollapsed ? 24 : 20} className="flex-shrink-0" />;
    };

    // Toggle expandable menu item
    const toggleExpand = (path: string) => {
        setExpandedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(path)) {
                newSet.delete(path);
            } else {
                newSet.add(path);
            }
            return newSet;
        });
    };

    // Check if a path matches current path (including subitems)
    const isPathActive = (itemPath: string, subItems?: MenuItem[]): boolean => {
        if (currentPath === itemPath) return true;
        if (subItems) {
            return subItems.some(subItem => {
                const normalizedSubPath = subItem.path === '' ? '' : subItem.path;
                return currentPath === normalizedSubPath;
            });
        }
        return false;
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
                    fixed start-0 top-20 lg:top-20
                    ${isCollapsed ? 'w-16' : 'w-64'} bg-white shadow-sm h-[calc(100vh-5rem)] lg:h-[calc(100vh-5rem)] z-30
                    border-e border-gray-200
                    transform transition-all duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : 'sidebar-hidden lg:translate-x-0'}
                    flex flex-col
                `}
            >
                {/* Close button for mobile / Collapse button for desktop */}
                <div className="flex justify-end p-2 border-b border-gray-200">
                    <button
                        onClick={() => {
                            if (window.innerWidth >= 1024) {
                                onToggleCollapse?.();
                            } else {
                                onClose();
                            }
                        }}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label={window.innerWidth >= 1024 ? (isCollapsed ? "Expand menu" : "Collapse menu") : "Close menu"}
                    >
                        <XIcon width={20} height={20} />
                    </button>
                </div>

                <nav className={`${isCollapsed ? 'p-2' : 'p-4'} flex-1 overflow-y-auto`}>
                    <ul className="space-y-1 lg:space-y-0.5">
                        {visibleMenuItems.map(item => {
                            const itemPath = getPath(item.path);
                            const normalizedItemPath = item.path === '' ? '' : item.path;
                            const hasSubItems = item.subItems && item.subItems.length > 0;
                            const isExpanded = expandedItems.has(item.path);
                            const isActive = isPathActive(normalizedItemPath, item.subItems);
                            
                            if (hasSubItems) {
                                return (
                                    <li key={item.path}>
                                        <button
                                            onClick={() => toggleExpand(item.path)}
                                            className={`w-full flex items-center gap-3 ${isCollapsed ? 'px-2 py-2 justify-center' : 'px-3 py-2'} rounded-lg transition-colors text-sm lg:text-xs ${
                                                isActive
                                                    ? 'bg-primary-600 text-white'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            {getIcon(item.icon)}
                                            {!isCollapsed && (
                                                <>
                                                    <span className="flex-1 text-start">{item.labelKey ? t(item.labelKey, item.label || '') : item.label}</span>
                                                    {isExpanded ? (
                                                        <ChevronDownIcon width={16} height={16} />
                                                    ) : (
                                                        <ChevronRightIcon width={16} height={16} />
                                                    )}
                                                </>
                                            )}
                                        </button>
                                        {!isCollapsed && isExpanded && item.subItems && (
                                            <ul className="ms-4 mt-1 space-y-1">
                                                {item.subItems.map(subItem => {
                                                    const subItemPath = getPath(subItem.path);
                                                    const normalizedSubPath = subItem.path === '' ? '' : subItem.path;
                                                    const isSubActive = currentPath === normalizedSubPath;
                                                    
                                                    return (
                                                        <li key={subItem.path}>
                                                            <Link
                                                                to={subItemPath}
                                                                onClick={handleLinkClick}
                                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm lg:text-xs ${
                                                                    isSubActive
                                                                        ? 'bg-primary-100 text-primary-700 font-medium'
                                                                        : 'text-gray-600 hover:bg-gray-50'
                                                                }`}
                                                            >
                                                                {getIcon(subItem.icon)}
                                                                <span>{subItem.labelKey ? t(subItem.labelKey, subItem.label || '') : subItem.label}</span>
                                                            </Link>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </li>
                                );
                            }
                            
                            return (
                                <li key={item.path}>
                                    <Link
                                        to={itemPath}
                                        onClick={handleLinkClick}
                                        className={`flex items-center gap-3 ${isCollapsed ? 'px-2 py-2 justify-center' : 'px-3 py-2'} rounded-lg transition-colors text-sm lg:text-xs ${
                                            isActive
                                                ? 'bg-primary-600 text-white'
                                                : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                        title={isCollapsed ? (item.labelKey ? t(item.labelKey, item.label || '') : item.label) : undefined}
                                    >
                                        {getIcon(item.icon)}
                                        {!isCollapsed && (
                                            <span>{item.labelKey ? t(item.labelKey, item.label || '') : item.label}</span>
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* User Info and Logout Button at Bottom */}
                {!isCollapsed && (
                    <div className="p-4 border-t border-gray-200 space-y-3">
                        <div className="px-4 py-2">
                            <p className="text-xs text-gray-500 mb-1">{t('common.user', 'User')}</p>
                            <p className="text-sm font-medium text-gray-800 truncate">
                                {getUserDisplayName()}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleLogout}
                            loading={logout.isPending}
                            className="w-full"
                        >
                            {t('navbar.logout', 'Logout')}
                        </Button>
                    </div>
                )}
                {isCollapsed && (
                    <div className="p-2 border-t border-gray-200">
                        <button
                            onClick={handleLogout}
                            disabled={logout.isPending}
                            className="w-full p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
                            title={t('navbar.logout', 'Logout')}
                        >
                            {logout.isPending ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                            ) : (
                                <XIcon width={20} height={20} />
                            )}
                        </button>
                    </div>
                )}
            </aside>
        </>
    );
};

export default Sidebar;
