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

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    return (
        <div dir={direction} className="min-h-screen bg-gray-50">
            <Navbar onMenuClick={toggleSidebar} />
            <div className="flex flex-row">
                <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
                <main className="flex-1 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
