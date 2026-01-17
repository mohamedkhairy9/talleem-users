import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { routes } from './routes';
import LoginPage from '@/pages/LoginPage';
import { Layout } from '@/globals/components';
import { ROUTE_PATHS } from '@/config';

/**
 * Main Routes Component
 */
const AppRoutes: React.FC = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path={ROUTE_PATHS.LOGIN} element={<LoginPage />} />
            
            {/* Protected Routes */}
            <Route
                path={ROUTE_PATHS.DASHBOARD}
                element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }
            >
                {routes.map((route, index) => (
                    <Route
                        key={route.path || index}
                        index={route.index}
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

            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to={ROUTE_PATHS.DASHBOARD} replace />} />
        </Routes>
    );
};

export default AppRoutes;
