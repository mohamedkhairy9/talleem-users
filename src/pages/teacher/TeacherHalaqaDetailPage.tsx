import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader, Button } from '@/globals/components';
import type { PageHeaderBadge } from '@/globals/components';
import { AlertTriangleIcon, CalendarIcon, CircleIcon, XIcon } from '@/globals/icons';
import { useTeacherHalaqaStudents } from '@/features/teacher/halaqas/hooks/useTeacherHalaqaStudents';
import { teacherHalaqasService } from '@/features/teacher/halaqas/services/halaqas.service';
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
    const currentLang = i18n.language || lang || 'ar';

    const { halaqa, students, date, time, isLoading, error, attendanceTypes } = useTeacherHalaqaStudents(id);
    const queryClient = useQueryClient();
    const [showTeacherAbsenceModal, setShowTeacherAbsenceModal] = useState(false);
    const [selectedReason, setSelectedReason] = useState<'teacher_absence' | 'force_majeure' | null>(null);

    // Mutation for submitting bulk attendance
    const bulkAttendanceMutation = useMutation({
        mutationFn: (data: {
            special_reason: 'teacher_absence' | 'force_majeure';
            student_attendances: Array<{ student_id: number; is_present: boolean }>;
        }) => {
            return teacherHalaqasService.submitBulkAttendance(id!, data);
        },
        onSuccess: () => {
            // Invalidate and refetch students data
            queryClient.invalidateQueries({ queryKey: ['teacher-halaqa-students', id] });
            setShowTeacherAbsenceModal(false);
            setSelectedReason(null);
        }
    });

    const handleOpenTeacherAbsenceModal = () => {
        setShowTeacherAbsenceModal(true);
        setSelectedReason(null);
    };

    const handleCloseTeacherAbsenceModal = () => {
        setShowTeacherAbsenceModal(false);
        setSelectedReason(null);
    };

    const handleSubmitTeacherAbsence = () => {
        if (!selectedReason || !students || students.length === 0) return;

        // Collect all students' attendance status
        // If is_present is null, default to true (present)
        // If is_present is already set, use that value
        const studentAttendances = students.map((student) => ({
            student_id: student.id,
            is_present: student.is_present !== null ? student.is_present : true
        }));

        bulkAttendanceMutation.mutate({
            special_reason: selectedReason,
            student_attendances: studentAttendances
        });
    };

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
                        <div className="space-y-4">
                            {/* Teacher Absence Button */}
                            <div className="flex justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleOpenTeacherAbsenceModal}
                                    className="flex items-center gap-2"
                                >
                                    <AlertTriangleIcon width={16} height={16} />
                                    {t('attendance.teacherAbsence', 'Teacher Absence / Force Majeure')}
                                </Button>
                            </div>

                            <TeacherHalaqaStudents
                                students={students}
                                isLoading={isLoading}
                                error={error}
                                getLocalizedText={getLocalizedText}
                                halaqaId={id}
                                attendanceTypes={attendanceTypes}
                            />
                        </div>
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

            {/* Teacher Absence Modal */}
            {showTeacherAbsenceModal && (
                <div className="fixed inset-0 z-[60] overflow-y-auto">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black transition-opacity"
                        style={{ opacity: 0.5 }}
                        onClick={handleCloseTeacherAbsenceModal}
                        aria-hidden="true"
                    />

                    {/* Modal */}
                    <div className="relative flex min-h-full items-center justify-center p-4 pt-20 md:pt-24">
                        <div className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white shadow-xl transition-all z-10">
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {t('attendance.teacherAbsence', 'Teacher Absence / Force Majeure')}
                                </h3>
                                <button
                                    type="button"
                                    onClick={handleCloseTeacherAbsenceModal}
                                    className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                                    aria-label="Close"
                                >
                                    <XIcon width={20} height={20} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="px-6 py-4">
                                <p className="text-sm text-gray-600 mb-4">
                                    {t('attendance.selectReason', 'Please select the reason for marking all students as present:')}
                                </p>
                                
                                <div className="space-y-3">
                                    <label className="block">
                                        <input
                                            type="radio"
                                            name="absence-reason"
                                            value="teacher_absence"
                                            checked={selectedReason === 'teacher_absence'}
                                            onChange={(e) => setSelectedReason(e.target.value as 'teacher_absence')}
                                            className="sr-only"
                                        />
                                        <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                            selectedReason === 'teacher_absence'
                                                ? 'border-primary-500 bg-primary-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                    selectedReason === 'teacher_absence'
                                                        ? 'border-primary-500 bg-primary-500'
                                                        : 'border-gray-300'
                                                }`}>
                                                    {selectedReason === 'teacher_absence' && (
                                                        <div className="w-2 h-2 rounded-full bg-white"></div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">
                                                        {t('attendance.teacherAbsence', 'Teacher Absence')}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {t('attendance.teacherAbsenceDesc', 'Mark all students as present due to teacher absence')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </label>

                                    <label className="block">
                                        <input
                                            type="radio"
                                            name="absence-reason"
                                            value="force_majeure"
                                            checked={selectedReason === 'force_majeure'}
                                            onChange={(e) => setSelectedReason(e.target.value as 'force_majeure')}
                                            className="sr-only"
                                        />
                                        <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                            selectedReason === 'force_majeure'
                                                ? 'border-primary-500 bg-primary-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                    selectedReason === 'force_majeure'
                                                        ? 'border-primary-500 bg-primary-500'
                                                        : 'border-gray-300'
                                                }`}>
                                                    {selectedReason === 'force_majeure' && (
                                                        <div className="w-2 h-2 rounded-full bg-white"></div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">
                                                        {t('attendance.forceMajeure', 'Force Majeure')}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {t('attendance.forceMajeureDesc', 'Mark all students as present due to force majeure')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </label>
                                </div>

                                {students && students.length > 0 && (
                                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-600">
                                            {t('attendance.studentsCount', 'This will mark {{count}} student(s) as present', { count: students.length })}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
                                <Button
                                    variant="outline"
                                    onClick={handleCloseTeacherAbsenceModal}
                                    disabled={bulkAttendanceMutation.isPending}
                                >
                                    {t('common.cancel', 'Cancel')}
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleSubmitTeacherAbsence}
                                    loading={bulkAttendanceMutation.isPending}
                                    disabled={!selectedReason}
                                >
                                    {t('attendance.submit', 'Submit')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherHalaqaDetailPage;

