import React, { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import LoginForm from '@/features/auth/components/LoginForm';
import { useTranslation } from 'react-i18next';

import logo from '@/assets/images/logo.svg';
import bgLayer from '@/assets/images/bg-layer.png';
import AuthLanguageSwitcher from '@/features/auth/components/AuthLanguageSwitcher';

/**
 * Login Page
 * Public login page with Tallem UI design
 */
const LoginPage: React.FC = () => {
    const { isAuthenticated } = useAuthStore();
    const { t } = useTranslation();
    const { lang } = useParams<{ lang: string }>();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger animations after component mounts
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    // Redirect if already authenticated
    if (isAuthenticated) {
        const currentLang = lang || 'en';
        return <Navigate to={`/${currentLang}`} replace />;
    }

    return (
        <div dir="ltr" className="min-h-screen bg-gradient-to-tr from-primary to-primary-900 relative overflow-hidden">
            {/* Background Pattern */}
            <div
                className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: `url(${bgLayer})`,
                    backgroundSize: 'cover'
                }}
            />

            <div className="relative z-10 min-h-screen flex">
                {/* Language Switcher - Top Right */}
                <div className="absolute top-4 right-4">
                    <AuthLanguageSwitcher />
                </div>
                {/* Left Section - Login Form */}
                <div className="flex-1 flex items-center lg:items-end justify-center px-8 py-8 lg:py-0">
                    <div
                        className={`w-full max-w-md transition-all duration-1000 ease-out transform ${
                            isVisible
                                ? 'translate-y-0 opacity-100'
                                : 'translate-y-full opacity-0'
                        }`}
                    >
                        {/* Logo for small screens */}
                        <div className="lg:hidden mb-6 flex justify-center">
                            <img
                                src={logo}
                                alt="Tallem Logo"
                                className="h-20 object-contain"
                            />
                        </div>

                        <div className="bg-white rounded-2xl rounded-b-none shadow-2xl p-8">
                            <div className="text-center mb-8">
                                <h3 className="text-lg text-gray-500 mb-2 font-medium">
                                    {t('auth.start_journey', 'Start Your Journey')}
                                </h3>
                                <h1 className="text-3xl font-bold text-primary mb-2 relative">
                                    {t('auth.login', 'Login')}
                                </h1>
                            </div>

                            <LoginForm />
                        </div>
                    </div>
                </div>

                {/* Right Section - Decorative Content */}
                <div className="hidden lg:flex flex-1 justify-center px-8">
                    <div
                        className={`text-center text-white transition-all duration-1000 ease-out transform ${
                            isVisible
                                ? 'translate-y-0 opacity-100'
                                : '-translate-y-full opacity-0'
                        }`}
                    >
                        {/* Logo */}
                        <div className="mb-8">
                            <img
                                src={logo}
                                alt="Tallem Logo"
                                className="mx-auto object-contain"
                            />
                        </div>

                        {/* Text Content */}
                        <div className="max-w-md mx-auto">
                            <h3 className="text-2xl font-bold mb-4">
                                خيركم من تعلم القرآن وعلمه
                            </h3>
                            <p className="text-lg font-light leading-relaxed">
                                منصتك لتعلم التلاوة الصحيحة، وحفظ كتاب الله خطوة
                                بخطوة، بإشراف نخبة من المعلمين المتخصصين، لتتابع
                                تقدمك وتعيش معاني القرآن في حياتك اليومية
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
