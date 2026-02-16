import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UsersIcon, UserIcon, CircleIcon, AlertTriangleIcon, XIcon } from '@/globals/icons';
import type { HalaqaStudent, BilingualName } from '../types/students.types';
import { useStudentPlan } from '../hooks/useStudentPlan';
import { formatDate } from '@/utils';
import { Button } from '@/globals/components';

interface TeacherHalaqaStudentsProps {
    students: HalaqaStudent[];
    isLoading?: boolean;
    error?: any;
    getLocalizedText: (obj: BilingualName | string | null | undefined) => string;
    halaqaId: number | string | undefined;
}

const TeacherHalaqaStudents: React.FC<TeacherHalaqaStudentsProps> = ({
    students,
    isLoading,
    error,
    getLocalizedText,
    halaqaId
}) => {
    const { t, i18n } = useTranslation();
    const [selectedPlan, setSelectedPlan] = useState<{
        studentId: number;
        activity: string;
    } | null>(null);

    const { data: planData, isLoading: isLoadingPlan, error: planError } = useStudentPlan(
        halaqaId,
        selectedPlan?.studentId,
        selectedPlan?.activity,
        !!selectedPlan
    );

    const handleActivityClick = (studentId: number, activity: string) => {
        setSelectedPlan({ studentId, activity });
    };

    const handleCloseModal = () => {
        setSelectedPlan(null);
    };

    const currentLang = i18n.language || 'en';

    // Extract error message
    const errorMessage = error
        ? (error as any)?.message || (error as any)?.data?.message || t('halaqa.loadError', 'Error loading students')
        : null;

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-center py-8">
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />
                        <p className="text-sm text-gray-600">{t('common.loading', 'Loading...')}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
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
        );
    }

    if (!students || students.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="text-center py-8 text-gray-500">
                    {t('halaqa.noStudents', 'No students found')}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-green-100 rounded-lg">
                    <UsersIcon width={20} height={20} className="text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                    {t('halaqa.students', 'Students')}
                    <span className="ml-2 text-sm font-normal text-gray-500">({students.length})</span>
                </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {students.map((student) => (
                    <div
                        key={student.id}
                        className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                <UserIcon width={20} height={20} className="text-primary-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold text-gray-900 truncate mb-2">
                                        {getLocalizedText(student.name) || `Student #${student.id}`}
                                    </p>

                                    {/* Status Badges */}
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        {/* Attendance Status */}
                                        {student.is_present !== null && (
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${student.is_present
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                }`}>
                                                <CircleIcon width={12} height={12} className="fill-current" />
                                                {student.is_present ? t('halaqa.present', 'Present') : t('halaqa.absent', 'Absent')}
                                            </span>
                                        )}
                                        {/* Can Memorize Badge */}
                                        {student.can_memorize && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                {t('halaqa.canMemorize', 'Can Memorize')}
                                            </span>
                                        )}
                                    </div>

                                </div>
                                {/* Activity Buttons */}
                                {student.activities && student.activities.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {student.activities.map((activity) => (
                                            <Button
                                                key={activity}
                                                type="button"
                                                onClick={() => handleActivityClick(student.id, activity)}
                                                size="sm"
                                                variant="outline"
                                            >
                                                {t(`halaqa.activity.${activity}`, activity)}
                                            </Button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Plan Details Modal */}
            {selectedPlan && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black transition-opacity"
                        style={{ opacity: 0.5 }}
                        onClick={handleCloseModal}
                        aria-hidden="true"
                    />

                    {/* Modal */}
                    <div className="relative flex min-h-full items-center justify-center p-4">
                        <div className="relative w-full max-w-2xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all z-10">
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {t('plan.details', 'Plan Details')} - {t(`halaqa.activity.${selectedPlan.activity}`, selectedPlan.activity)}
                                </h3>
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                                    aria-label="Close"
                                >
                                    <XIcon width={20} height={20} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                                {isLoadingPlan ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />
                                            <p className="text-sm text-gray-600">{t('common.loading', 'Loading...')}</p>
                                        </div>
                                    </div>
                                ) : planError ? (
                                    <div className="flex items-start gap-3 py-4">
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
                                                {(planError as any)?.message || t('plan.loadError', 'Error loading plan')}
                                            </p>
                                        </div>
                                    </div>
                                ) : planData ? (
                                    <div className="space-y-6">
                                        {/* Plan Info */}
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="text-sm font-semibold text-gray-900 mb-3">
                                                {t('plan.planInfo', 'Plan Information')}
                                            </h4>
                                            <dl className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <dt className="text-xs font-medium text-gray-500">
                                                        {t('plan.activity', 'Activity')}
                                                    </dt>
                                                    <dd className="mt-1 text-sm text-gray-900">
                                                        {t(`halaqa.activity.${planData.plan.activity}`, planData.plan.activity)}
                                                    </dd>
                                                </div>
                                                <div>
                                                    <dt className="text-xs font-medium text-gray-500">
                                                        {t('plan.dailyAmount', 'Daily Amount')}
                                                    </dt>
                                                    <dd className="mt-1 text-sm text-gray-900">
                                                        {planData.plan.daily_amount} {t(`plan.unit.${planData.plan.unit}`, planData.plan.unit)}
                                                    </dd>
                                                </div>
                                                <div>
                                                    <dt className="text-xs font-medium text-gray-500">
                                                        {t('plan.unit', 'Unit')}
                                                    </dt>
                                                    <dd className="mt-1 text-sm text-gray-900">
                                                        {t(`plan.unit.${planData.plan.unit}`, planData.plan.unit)}
                                                    </dd>
                                                </div>
                                                <div>
                                                    <dt className="text-xs font-medium text-gray-500">
                                                        {t('plan.direction', 'Direction')}
                                                    </dt>
                                                    <dd className="mt-1 text-sm text-gray-900">
                                                        {t(`plan.direction.${planData.plan.direction}`, planData.plan.direction)}
                                                    </dd>
                                                </div>
                                            </dl>
                                        </div>

                                        {/* Today's Schedule */}
                                        {planData.today_schedule && (
                                            <div className="bg-primary-50 rounded-lg p-4">
                                                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                                                    {t('plan.todaySchedule', "Today's Schedule")}
                                                </h4>
                                                <dl className="space-y-2">
                                                    <div>
                                                        <dt className="text-xs font-medium text-gray-500">
                                                            {t('plan.date', 'Date')}
                                                        </dt>
                                                        <dd className="mt-1 text-sm text-gray-900">
                                                            {formatDate(planData.today_schedule.date)} ({currentLang === 'ar' ? planData.today_schedule.day_name_ar : planData.today_schedule.day_name_en})
                                                        </dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-xs font-medium text-gray-500">
                                                            {t('plan.dayNumber', 'Day Number')}
                                                        </dt>
                                                        <dd className="mt-1 text-sm text-gray-900">
                                                            {planData.today_schedule.day_number}
                                                        </dd>
                                                    </div>
                                                    {planData.today_schedule.juz_numbers && planData.today_schedule.juz_numbers.length > 0 && (
                                                        <div>
                                                            <dt className="text-xs font-medium text-gray-500">
                                                                {t('plan.juzNumbers', 'Juz Numbers')}
                                                            </dt>
                                                            <dd className="mt-1 text-sm text-gray-900">
                                                                {planData.today_schedule.juz_numbers.join(', ')}
                                                            </dd>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <dt className="text-xs font-medium text-gray-500">
                                                            {t('plan.verses', 'Verses')}
                                                        </dt>
                                                        <dd className="mt-1 text-sm text-gray-900">
                                                            {t('plan.verseRange', 'From verse {{from}} to verse {{to}}', {
                                                                from: planData.today_schedule.from_verse_id,
                                                                to: planData.today_schedule.to_verse_id
                                                            })}
                                                        </dd>
                                                    </div>
                                                    {planData.today_schedule.text && (
                                                        <div>
                                                            <dt className="text-xs font-medium text-gray-500 mb-2">
                                                                {t('plan.text', 'Text')}
                                                            </dt>
                                                            <dd className="mt-1 text-sm text-gray-900 bg-white p-3 rounded border border-gray-200 text-right">
                                                                {planData.today_schedule.text}
                                                            </dd>
                                                        </div>
                                                    )}
                                                </dl>
                                            </div>
                                        )}

                                        {/* Evaluation System */}
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <dl className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <dt className="text-xs font-medium text-gray-500">
                                                        {t('plan.evaluationSystem', 'Evaluation System')}
                                                    </dt>
                                                    <dd className="mt-1 text-sm text-gray-900">
                                                        {planData.evaluation_system}
                                                    </dd>
                                                </div>
                                                <div>
                                                    <dt className="text-xs font-medium text-gray-500">
                                                        {t('plan.totalMark', 'Total Mark')}
                                                    </dt>
                                                    <dd className="mt-1 text-sm text-gray-900">
                                                        {planData.total_mark}
                                                    </dd>
                                                </div>
                                            </dl>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherHalaqaStudents;

