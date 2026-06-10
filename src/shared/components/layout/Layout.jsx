import React, { useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useDateFormatStore } from '@/app/stores';
/**
 * Main Layout Component
 * Wraps all protected pages with navbar and sidebar
 * Handles RTL/LTR direction based on language
 */
const Layout = () => {
    const { lang } = useParams();
    useDateFormatStore((s) => s.dateFormat); // re-render when date format changes so all dates update
    const direction = lang === 'ar' ? 'rtl' : 'ltr';
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const toggleSidebarCollapse = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };
    return (<div dir={direction} className="min-h-screen bg-gray-50">
            {/* Fixed Navbar - aligned with sidebar edge, no gap; supports LTR and RTL */}
            <Navbar isSidebarOpen={!isSidebarCollapsed} onToggleSidebar={toggleSidebarCollapse} direction={direction}/>
            
            {/* Content area: row has min-height so main content gets a defined height */}
            <div className="flex min-h-[calc(100vh-5rem)] flex-row relative">
                {/* Fixed Sidebar - start-0 so LTR=left, RTL=right */}
                <Sidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={toggleSidebarCollapse} direction={direction}/>
                
                {/* Main Content - on lg+ inset by sidebar; on small screens full width */}
                <main className={`flex flex-1 flex-col min-h-[calc(100vh-5rem)] pt-20 overflow-y-auto overflow-x-hidden relative z-10 bg-gray-50 transition-all duration-300 ${isSidebarCollapsed ? 'lg:ms-16' : 'lg:ms-64'}`}>
                    <div className="flex min-h-full flex-col p-6">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>);
};
export default Layout;
