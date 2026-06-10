import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/shared/utils';
import sideLogo from '@/assets/images/tallem-side-logo.svg';
import { MenuIcon, XIcon, CalendarIcon, CheckIcon } from '@/shared/icons';
import { useDateFormatStore } from '@/app/stores/dateFormat.store';
/** Navbar height – used so sidebar starts below it (match pt-20 / 5rem in Layout) */
export const NAVBAR_HEIGHT_CLASS = 'h-20'; // 5rem
const DATE_FORMAT_VALUES = ['gregorian', 'hijri', 'hijri_indic'];
/**
 * Navbar Component
 * Full width; menu button opens/closes sidebar (overlay on small, expand/collapse on lg).
 */
const Navbar = ({ isSidebarOpen = false, onToggleSidebar }) => {
    const { t } = useTranslation();
    const { currentLocale, changeLanguage } = useLocale();
    const { dateFormat, setDateFormat } = useDateFormatStore();
    const [dateFormatOpen, setDateFormatOpen] = useState(false);
    const dateFormatRef = useRef(null);
    useEffect(() => {
        if (!dateFormatOpen)
            return;
        const handleClickOutside = (e) => {
            if (dateFormatRef.current && !dateFormatRef.current.contains(e.target)) {
                setDateFormatOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [dateFormatOpen]);
    const handleSelectDateFormat = (value) => {
        setDateFormat(value);
        setDateFormatOpen(false);
    };
    return (<nav className={`fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200 ${NAVBAR_HEIGHT_CLASS}`}>
            <div className="px-4 sm:px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3 sm:gap-4">
                    {/* Menu button: open/close sidebar – same place and styling on all screens */}
                    {onToggleSidebar && (<button type="button" onClick={onToggleSidebar} className="p-2 -m-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors" aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}>
                            {isSidebarOpen ? (<XIcon width={24} height={24}/>) : (<MenuIcon width={24} height={24}/>)}
                        </button>)}
                    <img src={sideLogo} alt="Tallem Logo" className="h-10 object-contain"/>
                </div>
                
                <div className="flex items-center gap-2">
                    {/* Date format: calendar icon opens dropdown with 3 options */}
                    <div className="relative" ref={dateFormatRef}>
                        <button type="button" onClick={() => setDateFormatOpen((prev) => !prev)} className={`p-2 rounded-lg transition-colors ${dateFormatOpen ? 'bg-primary-100 text-primary-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`} aria-label={t('dateFormat.label', 'Date format')} aria-expanded={dateFormatOpen} aria-haspopup="true">
                            <CalendarIcon width={22} height={22}/>
                        </button>
                        {dateFormatOpen && (<div className="absolute  end-0 mt-1 min-w-[12rem] py-1 bg-white rounded-lg shadow-lg border border-gray-200 z-[100]" role="menu">
                                {DATE_FORMAT_VALUES.map((value) => (<button key={value} type="button" role="menuitem" onClick={() => handleSelectDateFormat(value)} className={`w-full px-3 py-2 text-start text-sm flex items-center justify-between gap-2 hover:bg-gray-50 ${dateFormat === value ? 'bg-primary-50 text-primary-700' : 'text-gray-700'}`}>
                                        <span>{t(`dateFormat.${value}`, value)}</span>
                                        {dateFormat === value && (<CheckIcon width={16} height={16} className="shrink-0 text-primary-600"/>)}
                                    </button>))}
                            </div>)}
                    </div>
                    {/* Language Switcher - Smaller */}
                    <div className="flex items-center gap-0.5 bg-gray-100 p-0.5 rounded-md">
                        <button onClick={() => changeLanguage('en')} className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${currentLocale === 'en'
            ? 'bg-primary-600 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
                            EN
                        </button>
                        <button onClick={() => changeLanguage('ar')} className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${currentLocale === 'ar'
            ? 'bg-primary-600 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
                            AR
                        </button>
                    </div>
                </div>
            </div>
        </nav>);
};
export default Navbar;
