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
    MenuIcon,
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
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    /** Layout direction for LTR/RTL; affects hide transform on mobile */
    direction?: 'ltr' | 'rtl';
}

/**
 * Sidebar Component
 */
const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggleCollapse, direction = 'ltr' }) => {
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

    const rawCurrentPath = getCurrentPathWithoutLang();
    /** Normalize for comparison: no leading/trailing slashes (e.g. "/halaqas" → "halaqas") */
    const currentPath = rawCurrentPath.replace(/^\/+|\/+$/g, '') || '';

    const handleLinkClick = () => {
        // Collapse sidebar on mobile when a link is clicked
        if (window.innerWidth < 1024) {
            onToggleCollapse();
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
        return <IconComponent width={isCollapsed ? 24 : 20} height={isCollapsed ? 24 : 20} className="shrink-0" />;
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

    /** Normalize menu path for comparison (strip slashes, treat empty as '') */
    const normalizeMenuPath = (path: string): string => (path ?? '').replace(/^\/+|\/+$/g, '') || '';

    // Check if a path matches current path (including subitems)
    const isPathActive = (itemPath: string, subItems?: MenuItem[]): boolean => {
        const normalizedItem = normalizeMenuPath(itemPath);
        if (currentPath === normalizedItem) return true;
        if (subItems) {
            return subItems.some(subItem => currentPath === normalizeMenuPath(subItem.path));
        }
        return false;
    };

    // Auto-expand parent when current page is a sub-item (so active sub-link is visible)
    React.useEffect(() => {
        visibleMenuItems.forEach(item => {
            if (item.subItems?.length && !expandedItems.has(item.path)) {
                const hasActiveChild = item.subItems.some(sub =>
                    currentPath === normalizeMenuPath(sub.path)
                );
                if (hasActiveChild) {
                    setExpandedItems(prev => new Set(prev).add(item.path));
                }
            }
        });
    }, [currentPath]);

    return (
        <>
            {/* Light backdrop on mobile when sidebar is open - click to close; sidebar draws above (z-[46]) */}
            {!isCollapsed && (
                <div
                    className="fixed inset-0 z-[45] bg-black/20 lg:hidden"
                    onClick={onToggleCollapse}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar: overlay on mobile above backdrop (z-[46]), fixed beside content on lg+ */}
            <aside
                className={`
                    fixed start-0 top-0 z-[46]
                    ${isCollapsed ? 'w-16 lg:w-16' : 'w-64 lg:w-64'} bg-white shadow-xl h-screen
                    border-e border-gray-200
                    transform transition-all duration-300 ease-in-out
                    ${isCollapsed
                        ? direction === 'rtl'
                            ? 'translate-x-full lg:translate-x-0'
                            : '-translate-x-full lg:translate-x-0'
                        : 'translate-x-0'}
                    flex flex-col
                `}
            >
                {/* Floating toggle button on the sidebar */}
                <button
                    onClick={onToggleCollapse}
                    className="absolute top-3 end-3 z-10 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors shadow-sm bg-white border border-gray-200"
                    aria-label={isCollapsed ? "Expand menu" : "Collapse menu"}
                >
                    {isCollapsed ? (
                        <MenuIcon width={20} height={20} />
                    ) : (
                        <XIcon width={20} height={20} />
                    )}
                </button>

                <nav className={`${isCollapsed ? 'p-2 pt-14' : 'p-4 pt-14'} flex-1 overflow-y-auto`}>
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
                                                    const isSubActive =
                                                        currentPath === normalizeMenuPath(subItem.path);
                                                    
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
                    <div className="p-2 border-t border-gray-200 lg:block hidden">
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
