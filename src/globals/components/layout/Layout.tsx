import React, { useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

/**
 * Main Layout Component
 * Wraps all protected pages with navbar and sidebar
 * Handles RTL/LTR direction based on language
 */
const Layout: React.FC = () => {
    const { lang } = useParams<{ lang: string }>();
    const direction = lang === 'ar' ? 'rtl' : 'ltr';
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const toggleSidebarCollapse = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    return (
        <div dir={direction} className="min-h-screen bg-gray-50">
            {/* Fixed Navbar - aligned with sidebar edge, no gap; supports LTR and RTL */}
            <Navbar
                isSidebarCollapsed={isSidebarCollapsed}
                direction={direction}
            />
            
            {/* Content area with fixed sidebar */}
            <div className="flex flex-row relative">
                {/* Fixed Sidebar - start-0 so LTR=left, RTL=right */}
                <Sidebar
                    isCollapsed={isSidebarCollapsed}
                    onToggleCollapse={toggleSidebarCollapse}
                    direction={direction}
                />
                
                {/* Scrollable Main Content - margin-inline-start matches sidebar (LTR: left, RTL: right) */}
                <main className={`flex-1 pt-20 min-h-screen overflow-y-auto relative z-10 transition-all duration-300 ${
                    isSidebarCollapsed ? 'lg:ms-16' : 'lg:ms-64'
                }`}>
                    <div className="p-6">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
