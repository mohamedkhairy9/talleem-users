import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocale, getDisplayDate } from '@/shared/utils';
import { useNavigate } from 'react-router-dom';
import sideLogo from '@/assets/images/tallem-side-logo.svg';
import { MenuIcon, XIcon, CalendarIcon, CheckIcon, BellIcon } from '@/shared/icons';
import { useDateFormatStore } from '@/app/stores/dateFormat.store';
import { useAuthStore } from '@/app/stores';
import {
    useMarkAllUserNotificationsAsRead,
    useMarkUserNotificationAsRead,
    useUserNotifications,
    isNotificationRead
} from '@/shared/notifications/hooks/useUserNotifications';
import { extractNotificationTargetData, resolveNotificationTarget } from '@/shared/notifications/utils/notification-targets';
import { toast } from 'react-toastify';

export const NAVBAR_HEIGHT_CLASS = 'h-20';

const DATE_FORMAT_VALUES = ['gregorian', 'hijri', 'hijri_indic'];

const getNotificationTitle = (notification, fallbackTitle) => {
    return (
        notification?.title ??
        notification?.subject ??
        notification?.name ??
        notification?.data?.title ??
        fallbackTitle
    );
};

const getNotificationMessage = (notification) => {
    return (
        notification?.message ??
        notification?.body ??
        notification?.content ??
        notification?.text ??
        notification?.description ??
        notification?.data?.message ??
        notification?.data?.body ??
        notification?.data?.content ??
        ''
    );
};

const getNotificationDate = (notification) => {
    return (
        notification?.sent_at ??
        notification?.created_at ??
        notification?.date ??
        notification?.updated_at ??
        notification?.read_at ??
        null
    );
};

const getNotificationLink = (notification) => {
    return (
        notification?.url ??
        notification?.link ??
        notification?.action_url ??
        notification?.data?.url ??
        notification?.data?.link ??
        null
    );
};

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

const renderNotificationValue = (value) => {
    if (value === null || value === undefined || value === '') {
        return '-';
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }

    if (Array.isArray(value)) {
        if (value.length === 0) {
            return '-';
        }

        return (
            <div className="space-y-2">
                {value.map((item, index) => (
                    <div key={`${index}-${typeof item}`} className="border-s border-slate-200 ps-3 text-sm text-gray-700">
                        {renderNotificationValue(item)}
                    </div>
                ))}
            </div>
        );
    }

    if (isObject(value)) {
        return (
            <div className="space-y-2">
                {Object.entries(value).map(([key, nestedValue]) => (
                    <div key={key} className="border-s border-slate-200 ps-3">
                        <div className="text-xs font-medium text-gray-500 mb-1">{key.replace(/_/g, ' ')}</div>
                        <div className="text-sm text-gray-800 break-words">{renderNotificationValue(nestedValue)}</div>
                    </div>
                ))}
            </div>
        );
    }

    return String(value);
};

const Navbar = ({ isSidebarOpen = false, onToggleSidebar }) => {
    const { t } = useTranslation();
    const { currentLocale, changeLanguage } = useLocale();
    const navigate = useNavigate();
    const userRoles = useAuthStore((state) => state.user?.roles ?? []);
    const { dateFormat, setDateFormat } = useDateFormatStore();
    const [dateFormatOpen, setDateFormatOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const dateFormatRef = useRef(null);
    const notificationsRef = useRef(null);

    const {
        list: notifications,
        unreadCount,
        isLoading: isNotificationsLoading,
        isError: isNotificationsError
    } = useUserNotifications();
    const markAsReadMutation = useMarkUserNotificationAsRead();
    const markAllAsReadMutation = useMarkAllUserNotificationsAsRead();

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dateFormatRef.current && !dateFormatRef.current.contains(e.target)) {
                setDateFormatOpen(false);
            }

            if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
                setNotificationsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectDateFormat = (value) => {
        setDateFormat(value);
        setDateFormatOpen(false);
    };

    const handleNotificationClick = (notification) => {
        if (!isNotificationRead(notification) && notification?.id != null) {
            markAsReadMutation.mutate(notification.id, {
                onError: (error) => {
                    toast.error(error?.message || t('notifications.markReadError'));
                }
            });
        }

        const target = resolveNotificationTarget({
            notification,
            lang: currentLocale || 'ar',
            userRoles
        });

        const notificationLink = target?.path || getNotificationLink(notification);
        if (notificationLink) {
            const targetData = extractNotificationTargetData(notification);
            setNotificationsOpen(false);

            if (/^https?:\/\//i.test(notificationLink)) {
                window.location.href = notificationLink;
                return;
            }

            navigate(notificationLink, {
                state: targetData ? { notificationTargetData: targetData, notificationId: notification?.id ?? null } : undefined
            });
            return;
        }

        setSelectedNotification(notification);
        setNotificationsOpen(false);
    };

    const handleMarkAllAsRead = () => {
        markAllAsReadMutation.mutate(undefined, {
            onError: (error) => {
                toast.error(error?.message || t('notifications.markAllReadError'));
            }
        });
    };

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200 ${NAVBAR_HEIGHT_CLASS}`}>
            <div className="px-4 sm:px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3 sm:gap-4">
                    {onToggleSidebar && (
                        <button
                            type="button"
                            onClick={onToggleSidebar}
                            className="p-2 -m-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                            aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
                        >
                            {isSidebarOpen ? <XIcon width={24} height={24} /> : <MenuIcon width={24} height={24} />}
                        </button>
                    )}
                    <img src={sideLogo} alt="Tallem Logo" className="h-10 object-contain" />
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative" ref={notificationsRef}>
                        <button
                            type="button"
                            onClick={() => setNotificationsOpen((prev) => !prev)}
                            className={`relative p-2 rounded-lg transition-colors ${notificationsOpen ? 'bg-primary-100 text-primary-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                            aria-label={t('notifications.title')}
                            aria-expanded={notificationsOpen}
                            aria-haspopup="true"
                        >
                            <BellIcon width={22} height={22} />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -end-1 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold leading-[1.1rem] text-center">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {notificationsOpen && (
                            <div className="absolute end-0 mt-1 w-[22rem] max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-lg border border-gray-200 z-[100] overflow-hidden">
                                <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100">
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900">
                                            {t('notifications.title')}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {unreadCount > 0
                                                ? t('notifications.unreadCount', { count: unreadCount })
                                                : t('notifications.allRead')}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleMarkAllAsRead}
                                        disabled={unreadCount === 0 || markAllAsReadMutation.isPending}
                                        className="text-xs font-medium text-primary-600 disabled:text-gray-300 disabled:cursor-not-allowed"
                                    >
                                        {markAllAsReadMutation.isPending
                                            ? t('notifications.markingAllRead')
                                            : t('notifications.markAllRead')}
                                    </button>
                                </div>

                                <div className="max-h-96 overflow-y-auto">
                                    {isNotificationsLoading && (
                                        <div className="px-4 py-6 text-sm text-gray-500 text-center">
                                            {t('notifications.loading')}
                                        </div>
                                    )}

                                    {!isNotificationsLoading && isNotificationsError && (
                                        <div className="px-4 py-6 text-sm text-red-500 text-center">
                                            {t('notifications.loadError')}
                                        </div>
                                    )}

                                    {!isNotificationsLoading && !isNotificationsError && notifications.length === 0 && (
                                        <div className="px-4 py-6 text-sm text-gray-500 text-center">
                                            {t('notifications.empty')}
                                        </div>
                                    )}

                                    {!isNotificationsLoading && !isNotificationsError && notifications.map((notification) => {
                                        const read = isNotificationRead(notification);
                                        const title = getNotificationTitle(notification, t('notifications.defaultTitle'));
                                        const message = getNotificationMessage(notification);
                                        const notificationDate = getNotificationDate(notification);

                                        return (
                                            <button
                                                key={notification?.id ?? `${title}-${notificationDate ?? message ?? 'notification'}`}
                                                type="button"
                                                onClick={() => handleNotificationClick(notification)}
                                                className={`w-full px-4 py-3 text-start border-b border-gray-100 last:border-b-0 transition-colors hover:bg-gray-50 ${read ? 'bg-white' : 'bg-primary-50/40'}`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <span className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${read ? 'bg-gray-200' : 'bg-primary-500'}`} />

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className={`text-sm font-medium ${read ? 'text-gray-800' : 'text-gray-900'}`}>
                                                                {title}
                                                            </div>
                                                            {notificationDate && (
                                                                <span className="text-[11px] text-gray-400 shrink-0">
                                                                    {getDisplayDate(notificationDate)}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {message && (
                                                            <div className="mt-1 text-xs text-gray-600 break-words line-clamp-3">
                                                                {message}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="relative" ref={dateFormatRef}>
                        <button
                            type="button"
                            onClick={() => setDateFormatOpen((prev) => !prev)}
                            className={`p-2 rounded-lg transition-colors ${dateFormatOpen ? 'bg-primary-100 text-primary-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                            aria-label={t('dateFormat.label', 'Date format')}
                            aria-expanded={dateFormatOpen}
                            aria-haspopup="true"
                        >
                            <CalendarIcon width={22} height={22} />
                        </button>
                        {dateFormatOpen && (
                            <div className="absolute end-0 mt-1 min-w-[12rem] py-1 bg-white rounded-lg shadow-lg border border-gray-200 z-[100]" role="menu">
                                {DATE_FORMAT_VALUES.map((value) => (
                                    <button
                                        key={value}
                                        type="button"
                                        role="menuitem"
                                        onClick={() => handleSelectDateFormat(value)}
                                        className={`w-full px-3 py-2 text-start text-sm flex items-center justify-between gap-2 hover:bg-gray-50 ${dateFormat === value ? 'bg-primary-50 text-primary-700' : 'text-gray-700'}`}
                                    >
                                        <span>{t(`dateFormat.${value}`, value)}</span>
                                        {dateFormat === value && <CheckIcon width={16} height={16} className="shrink-0 text-primary-600" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-0.5 bg-gray-100 p-0.5 rounded-md">
                        <button
                            onClick={() => changeLanguage('en')}
                            className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${currentLocale === 'en'
                                ? 'bg-primary-600 text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                        >
                            EN
                        </button>
                        <button
                            onClick={() => changeLanguage('ar')}
                            className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${currentLocale === 'ar'
                                ? 'bg-primary-600 text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                        >
                            AR
                        </button>
                    </div>
                </div>
            </div>

            {selectedNotification && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl overflow-hidden">
                        <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {getNotificationTitle(selectedNotification, t('notifications.defaultTitle'))}
                                </h3>
                                {getNotificationDate(selectedNotification) && (
                                    <p className="mt-1 text-sm text-gray-500">
                                        {getDisplayDate(getNotificationDate(selectedNotification))}
                                    </p>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedNotification(null)}
                                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                aria-label={t('common.close')}
                            >
                                <XIcon width={20} height={20} />
                            </button>
                        </div>

                        <div className="max-h-[70vh] overflow-y-auto px-5 py-4 space-y-4">
                            <div>
                                <div className="space-y-4 rounded-lg border border-gray-200 bg-white px-4 py-4">
                                    <div>
                                        <div className="mb-1 text-sm font-medium text-gray-700">
                                            {t('notifications.titleLabel', 'Title')}
                                        </div>
                                        <div className="text-sm text-gray-900 break-words">
                                            {getNotificationTitle(selectedNotification, t('notifications.defaultTitle'))}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="mb-1 text-sm font-medium text-gray-700">
                                            {t('notifications.message', 'Message')}
                                        </div>
                                        <div className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                                            {getNotificationMessage(selectedNotification) || '-'}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="mb-1 text-sm font-medium text-gray-700">
                                            {t('notifications.sentAt', 'Sent at')}
                                        </div>
                                        <div className="text-sm text-gray-800">
                                            {getNotificationDate(selectedNotification)
                                                ? getDisplayDate(getNotificationDate(selectedNotification))
                                                : '-'}
                                        </div>
                                    </div>

                                    {selectedNotification?.data && (
                                        <div>
                                            <div className="mb-1 text-sm font-medium text-gray-700">
                                                {t('notifications.details', 'Details')}
                                            </div>
                                            <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-3">
                                                {renderNotificationValue(selectedNotification.data)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
