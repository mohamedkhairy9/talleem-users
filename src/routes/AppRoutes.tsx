import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { routes } from './routes';
import LoginPage from '@/pages/LoginPage';
import RegistrationPage from '@/pages/RegistrationPage';
import UnauthorizedPage from '@/pages/UnauthorizedPage';
import { Layout } from '@/globals/components';
import { ROUTE_PATHS } from '@/config';
import LanguageRouteWrapper from '@/utils/components/LanguageRouteWrapper';

/**
 * Main Routes Component
 * Routes are organized with language prefix: /:lang/...
 */
const AppRoutes: React.FC = () => {
    return (
        <Routes>
            {/* Default redirect - redirect root to default language */}
            <Route path="/" element={<Navigate to="/en" replace />} />
            
            {/* Redirect old /login to /en/login for backward compatibility */}
            <Route path="/login" element={<Navigate to="/en/login" replace />} />
            
            {/* Language-based routes */}
            <Route path="/:lang" element={<LanguageRouteWrapper />}>
                {/* Public routes */}
                <Route path={ROUTE_PATHS.LOGIN} element={<LoginPage />} />
                <Route path={ROUTE_PATHS.REGISTER} element={<RegistrationPage />} />
                <Route path={ROUTE_PATHS.UNAUTHORIZED} element={<UnauthorizedPage />} />
                
                {/* Protected routes */}
                <Route
                    element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    }
                >
                    {/* Dashboard index route */}
                    {routes
                        .filter(route => route.index)
                        .map((route, index) => (
                            <Route
                                key={index}
                                index
                                element={route.element}
                            />
                        ))}
                    
                    {/* Other routes */}
                    {routes
                        .filter(route => !route.index)
                        .map((route, index) => (
                            <Route
                                key={route.path || index}
                                path={route.path}
                                element={
                                    route.roles || route.permissions ? (
                                        <ProtectedRoute roles={route.roles} permissions={route.permissions}>
                                            {route.element}
                                        </ProtectedRoute>
                                    ) : (
                                        route.element
                                    )
                                }
                            />
                        ))}
                </Route>
            </Route>

            {/* Catch all - redirect to default language dashboard */}
            <Route path="*" element={<Navigate to="/en" replace />} />
        </Routes>
    );
};

export default AppRoutes;
