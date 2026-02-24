import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/globals/components';
import { ROUTE_PATHS } from '@/config';

/**
 * Unauthorized Page
 * Shown when user doesn't have permission to access a resource (403 error)
 */
const UnauthorizedPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { lang } = useParams<{ lang: string }>();

    const handleGoHome = () => {
        navigate(`/${lang || 'ar'}/${ROUTE_PATHS.DASHBOARD}`);
    };

    const handleGoBack = () => {
        navigate(-1);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="mb-6">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                        <svg
                            className="h-8 w-8 text-red-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {t('unauthorized.title', 'Access Denied')}
                    </h1>
                    <p className="text-gray-600 mb-2">
                        {t('unauthorized.message', 'You do not have permission to access this resource.')}
                    </p>
                    <p className="text-sm text-gray-500">
                        {t('unauthorized.statusCode', 'Error Code: 403 Forbidden')}
                    </p>
                </div>

                <div className="space-y-3">
                    <Button
                        type="button"
                        variant="primary"
                        onClick={handleGoHome}
                        className="w-full"
                    >
                        {t('unauthorized.goHome', 'Go to Dashboard')}
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleGoBack}
                        className="w-full"
                    >
                        {t('unauthorized.goBack', 'Go Back')}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default UnauthorizedPage;

