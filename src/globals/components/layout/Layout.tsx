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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    const toggleSidebarCollapse = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    return (
        <div dir={direction} className="min-h-screen bg-gray-50">
            {/* Fixed Navbar */}
            <Navbar onMenuClick={toggleSidebar} isSidebarOpen={isSidebarOpen} />
            
            {/* Content area with fixed sidebar */}
            <div className="flex flex-row relative">
                {/* Fixed Sidebar */}
                <Sidebar 
                    isOpen={isSidebarOpen} 
                    onClose={closeSidebar}
                    isCollapsed={isSidebarCollapsed}
                    onToggleCollapse={toggleSidebarCollapse}
                />
                
                {/* Scrollable Main Content */}
                <main className={`flex-1 pt-20 lg:pt-20 min-h-screen overflow-y-auto relative z-10 transition-all duration-300 ${
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
