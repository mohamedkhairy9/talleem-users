import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/app/stores';
import { ROUTE_PATHS } from '@/config';
/**
 * Role-Based Index Route Component
 * Redirects to the appropriate index page based on user role
 */
const RoleBasedIndexRoute = () => {
    const { user } = useAuthStore();
    const { lang } = useParams();
    const currentLang = lang || 'ar';
    // Determine index route based on user role
    if (user?.roles?.includes('entity_manager')) {
        // Entity managers: redirect to halaqas (their index page)
        return <Navigate to={`/${currentLang}/${ROUTE_PATHS.HALAQAS}`} replace/>;
    }
    if (user?.roles?.includes('teacher')) {
        // Teachers: redirect to calendar (their home page)
        return <Navigate to={`/${currentLang}/${ROUTE_PATHS.TEACHER_CALENDAR}`} replace/>;
    }
    // For other roles: redirect to dashboard
    return <Navigate to={`/${currentLang}/${ROUTE_PATHS.DASHBOARD}`} replace/>;
};
export default RoleBasedIndexRoute;
