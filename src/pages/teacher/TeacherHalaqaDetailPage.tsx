import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/globals/components';
import type { PageHeaderBadge } from '@/globals/components';
import { AlertTriangleIcon, CalendarIcon, CircleIcon } from '@/globals/icons';
import { useTeacherHalaqaStudents } from '@/features/teacher/halaqas/hooks/useTeacherHalaqaStudents';
import TeacherHalaqaStudents from '@/features/teacher/halaqas/components/TeacherHalaqaStudents';
import type { BilingualName } from '@/features/teacher/halaqas/types/list.types';
import { formatDate } from '@/utils';
import HalaqaBasicInfo from '@/features/entity-manager/halaqas/components/HalaqaBasicInfo';
import HalaqaQuickStats from '@/features/entity-manager/halaqas/components/HalaqaQuickStats';
import HalaqaAdditionalInfo from '@/features/entity-manager/halaqas/components/HalaqaAdditionalInfo';
import HalaqaActivities from '@/features/entity-manager/halaqas/components/HalaqaActivities';
import HalaqaDatesSchedule from '@/features/entity-manager/halaqas/components/HalaqaDatesSchedule';

/**
 * Teacher Halaqa Detail Page
 * Displays detailed information about a specific halaqa for teachers
 */
const TeacherHalaqaDetailPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { id, lang } = useParams<{ id: string; lang: string }>();
    const navigate = useNavigate();
    const currentLang = i18n.language || lang || 'en';

    const { halaqa, students, date, time, isLoading, error, attendanceTypes } = useTeacherHalaqaStudents(id);

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

    // Prepare badges for header
    const headerBadges: PageHeaderBadge[] = useMemo(() => {
        if (!halaqa) return [];
        const badges: PageHeaderBadge[] = [];
        if (halaqa.memorization_program_entity_type?.name) {
            badges.push({
                key: 'entity-type',
                label: getLocalizedText(halaqa.memorization_program_entity_type.name),
                icon: <CircleIcon width={16} height={16} />
            });
        }
        if (halaqa.period) {
            badges.push({
                key: 'period',
                label: String(t(`halaqa.period.${halaqa.period}`, halaqa.period)),
                icon: <CalendarIcon width={16} height={16} />
            });
        }
        return badges;
    }, [halaqa?.memorization_program_entity_type?.name, halaqa?.period, currentLang, t, getLocalizedText]);

    // Extract error message from error object
    const errorMessage = error
        ? (error as any)?.message || (error as any)?.data?.message || t('halaqa.loadError', 'Error loading halaqa. Please try again.')
        : null;

    // Check if error is related to time restrictions
    const isTimeRestrictionError = errorMessage && (
        errorMessage.toLowerCase().includes('cannot record') ||
        errorMessage.toLowerCase().includes('time window') ||
        errorMessage.toLowerCase().includes('allowed time') ||
        (error as any)?.data?.can_record === false
    );

    // Determine error title based on error type
    const errorTitle = isTimeRestrictionError
        ? t('halaqa.timeRestriction', 'Access Restricted')
        : t('halaqa.notFound', 'Halaqa not found');

    // Determine error description
    const errorDescription = isTimeRestrictionError
        ? errorMessage || t('halaqa.timeRestrictionDescription', 'This halaqa is only available during its scheduled time window.')
        : errorMessage || t('halaqa.notFoundDescription', 'The halaqa you are looking for does not exist or has been removed.');

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
                    <p className="text-gray-600 text-sm">{t('common.loading', 'Loading...')}</p>
                </div>
            </div>
        );
    }

    if (error || !halaqa) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                <div className="text-center">
                    <AlertTriangleIcon width={64} height={64} className="mx-auto text-red-500 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{errorTitle}</h2>
                    <p className="text-gray-600">{errorDescription}</p>
                </div>
            </div>
        );
    }

    // Calculate stats
    const studentCount = halaqa.current_students_count ?? students.length ?? 0;
    const maxStudents = halaqa.max_students ?? 0;

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <PageHeader
                    title={getLocalizedText(halaqa.name)}
                    breadcrumb={{
                        label: t('halaqa.backToHalaqas', 'Back to My Halaqas'),
                        onClick: handleBack
                    }}
                    badges={headerBadges}
                />
                <HalaqaQuickStats
                    studentCount={studentCount}
                    maxStudents={maxStudents}
                    plansCount={halaqa.plans?.length ?? 0}
                    durationInDays={halaqa.duration_in_days}
                    activitiesCount={halaqa.activities?.length ?? 0}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Information */}
                <div className="lg:col-span-2 space-y-6">
                    <HalaqaBasicInfo
                        name={getLocalizedText(halaqa.name)}
                        teacher={halaqa.teacher?.name}
                        entityType={halaqa.memorization_program_entity_type?.name}
                        period={halaqa.period}
                        teachingMethod={halaqa.teaching_method}
                        platform={halaqa.platform?.name}
                        getLocalizedText={getLocalizedText}
                    />

                    {students && students.length > 0 && (
                        <TeacherHalaqaStudents
                            students={students}
                            isLoading={isLoading}
                            error={error}
                            getLocalizedText={getLocalizedText}
                            halaqaId={id}
                            attendanceTypes={attendanceTypes}
                        />
                    )}
                </div>

                {/* Right Column - Additional Info */}
                <div className="space-y-6">
                    <HalaqaAdditionalInfo
                        durationInDays={halaqa.duration_in_days}
                        weeklyHoliday={halaqa.weekly_holiday}
                        evaluationSystem={halaqa.evaluation_system}
                        totalMark={halaqa.total_mark}
                    />

                    {halaqa.activities && halaqa.activities.length > 0 && (
                        <HalaqaActivities activities={halaqa.activities} />
                    )}

                    <HalaqaDatesSchedule
                        startDate={halaqa.start_date}
                        endDate={halaqa.end_date}
                        sessionTime={halaqa.session_time}
                    />

                    {/* Session Info */}
                    {date && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <CalendarIcon width={20} height={20} className="text-blue-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    {t('halaqa.sessionInfo', 'Session Information')}
                                </h2>
                            </div>
                            <dl className="space-y-3">
                                <div>
                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                        {t('halaqa.date', 'Date')}
                                    </dt>
                                    <dd className="mt-1 text-base font-medium text-gray-900">{formatDate(date)}</dd>
                                </div>
                                {time && (
                                    <div>
                                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                            {t('halaqa.time', 'Time')}
                                        </dt>
                                        <dd className="mt-1 text-base font-medium text-gray-900">{time}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeacherHalaqaDetailPage;

