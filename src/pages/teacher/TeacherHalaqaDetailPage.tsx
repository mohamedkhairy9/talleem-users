import React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/globals/components';
import { AlertTriangleIcon } from '@/globals/icons';
import { useTeacherHalaqaStudents } from '@/features/teacher/halaqas/hooks/useTeacherHalaqaStudents';
import TeacherHalaqaStudents from '@/features/teacher/halaqas/components/TeacherHalaqaStudents';
import type { BilingualName } from '@/features/teacher/halaqas/types/list.types';
import { formatDate } from '@/utils';

/**
 * Teacher Halaqa Detail Page
 * Displays detailed information about a specific halaqa for teachers
 */
const TeacherHalaqaDetailPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { id, lang } = useParams<{ id: string; lang: string }>();
    const navigate = useNavigate();
    const currentLang = i18n.language || lang || 'en';

    const { halaqa, students, date, time, isLoading, error } = useTeacherHalaqaStudents(id);

    const getLocalizedText = (obj: BilingualName | string | null | undefined): string => {
        if (typeof obj === 'string') return obj;
        if (!obj) return t('common.not_available', 'N/A');
        if (currentLang === 'ar' && obj.ar) return obj.ar;
        if (obj.en) return obj.en;
        return t('common.not_available', 'N/A');
    };

    const handleBack = () => {
        navigate(`/${lang || currentLang}/halaqaty`);
    };

    // Extract error message from error object
    const errorMessage = error
        ? (error as any)?.message || (error as any)?.data?.message || t('halaqa.loadError', 'Error loading halaqa. Please try again.')
        : null;

    if (error) {
        return (
            <div className="flex min-h-full flex-col space-y-6">
                <PageHeader
                    title={t('halaqa.detail', 'Halaqa Details')}
                    subtitle={errorMessage || t('halaqa.loadError', 'Error loading halaqa. Please try again.')}
                    breadcrumb={{
                        label: t('halaqa.backToHalaqas', 'Back to My Halaqas'),
                        onClick: handleBack
                    }}
                />
                <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <AlertTriangleIcon width={20} height={20} className="text-red-600" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-red-900 mb-1">
                                {t('common.error', 'An error occurred')}
                            </h3>
                            <p className="text-sm text-red-700">
                                {errorMessage}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-full flex-col space-y-6">
            <PageHeader
                title={getLocalizedText(halaqa?.name) || t('halaqa.detail', 'Halaqa Details')}
                subtitle={t('halaqa.detailDescription', 'View halaqa details and students')}
                breadcrumb={{
                    label: t('halaqa.backToHalaqas', 'Back to My Halaqas'),
                    onClick: handleBack
                }}
            />

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />
                        <p className="text-sm text-gray-600">{t('common.loading', 'Loading...')}</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Main Information */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Info Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                {t('halaqa.basicInfo', 'Basic Information')}
                            </h2>
                            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">
                                        {t('halaqa.period', 'Period')}
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {halaqa?.period
                                            ? t(`halaqa.period.${halaqa.period}`, halaqa.period)
                                            : '-'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">
                                        {t('halaqa.startDate', 'Start Date')}
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {formatDate(halaqa?.start_date)}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">
                                        {t('halaqa.endDate', 'End Date')}
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {formatDate(halaqa?.end_date)}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">
                                        {t('halaqa.sessionTime', 'Session Time')}
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {halaqa?.session_time || '-'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">
                                        {t('halaqa.teachingMethod', 'Teaching Method')}
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {halaqa?.teaching_method
                                            ? (() => {
                                                  const keyMap: Record<string, string> = {
                                                      in_person: 'inPerson',
                                                      remote: 'remote',
                                                      hybrid: 'hybrid'
                                                  };
                                                  const key = keyMap[halaqa.teaching_method] ?? halaqa.teaching_method;
                                                  return t(`halaqa.teachingMethod.${key}`, halaqa.teaching_method);
                                              })()
                                            : '-'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">
                                        {t('halaqa.platform', 'Platform')}
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {getLocalizedText(halaqa?.platform?.name)}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {/* Students Section */}
                        <TeacherHalaqaStudents
                            students={students}
                            isLoading={isLoading}
                            error={error}
                            getLocalizedText={getLocalizedText}
                        />
                    </div>

                    {/* Right Column - Additional Info */}
                    <div className="space-y-6">
                        {/* Activities */}
                        {halaqa?.activities && halaqa.activities.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                    {t('halaqa.activities', 'Activities')}
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {halaqa.activities.map((activity) => (
                                        <span
                                            key={activity}
                                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                                        >
                                            {t(`halaqa.activity.${activity}`, activity)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Session Info */}
                        {date && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                    {t('halaqa.sessionInfo', 'Session Information')}
                                </h2>
                                <dl className="space-y-3">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">
                                            {t('halaqa.date', 'Date')}
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900">{formatDate(date)}</dd>
                                    </div>
                                    {time && (
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">
                                                {t('halaqa.time', 'Time')}
                                            </dt>
                                            <dd className="mt-1 text-sm text-gray-900">{time}</dd>
                                        </div>
                                    )}
                                </dl>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherHalaqaDetailPage;

