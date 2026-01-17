import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { cookieService } from '@/utils/cookies';
import { Loader } from '@/globals/components';
import { ROUTE_PATHS } from '@/config';

interface ProtectedRouteProps {
    children: React.ReactNode;
    roles?: string[];
    permissions?: string[];
}

/**
 * Protected Route Component
 * Wraps routes that require authentication
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles = [], permissions = [] }) => {
    const { isAuthenticated, user, initializeAuth } = useAuthStore();
    const location = useLocation();
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        // Initialize auth from cookie on mount
        const token = initializeAuth();
        if (token) {
            // Token exists, check if user data is loaded
            if (!user) {
                // User data not loaded, you might want to fetch it here
                // or it will be fetched by useUserQuery in the component
            }
        }
        setLoading(false);
    }, [initializeAuth, user]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader size="lg" />
            </div>
        );
    }

    if (!isAuthenticated || !cookieService.hasToken()) {
        return <Navigate to={ROUTE_PATHS.LOGIN} state={{ from: location }} replace />;
    }

    // Check roles if specified
    if (roles.length > 0) {
        const hasRequiredRole = roles.some(role => 
            user?.roles?.includes(role)
        );
        if (!hasRequiredRole) {
            return <Navigate to={ROUTE_PATHS.UNAUTHORIZED} replace />;
        }
    }

    // Check permissions if specified
    if (permissions.length > 0) {
        const hasRequiredPermission = permissions.some(permission =>
            user?.permissions?.includes(permission)
        );
        if (!hasRequiredPermission) {
            return <Navigate to={ROUTE_PATHS.UNAUTHORIZED} replace />;
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;
