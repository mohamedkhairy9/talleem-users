import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { UsersIcon, UserIcon, AlertTriangleIcon, XIcon, CheckIcon, BookIcon, ClipboardCheckIcon } from '@/globals/icons';
import type { HalaqaStudent, BilingualName, AttendanceType } from '../types/students.types';
import { useStudentPlan } from '../hooks/useStudentPlan';
import { teacherHalaqasService } from '../services/halaqas.service';
import { formatDate } from '@/utils';
import { Button } from '@/globals/components';

interface TeacherHalaqaStudentsProps {
    students: HalaqaStudent[];
    isLoading?: boolean;
    error?: any;
    getLocalizedText: (obj: BilingualName | string | null | undefined) => string;
    halaqaId: number | string | undefined;
    attendanceTypes?: AttendanceType[];
}

const TeacherHalaqaStudents: React.FC<TeacherHalaqaStudentsProps> = ({
    students,
    isLoading,
    error,
    getLocalizedText,
    halaqaId,
    attendanceTypes = []
}) => {
    const { t, i18n } = useTranslation();
    const queryClient = useQueryClient();
    const [selectedPlan, setSelectedPlan] = useState<{
        studentId: number;
        activity: string;
    } | null>(null);
    
    const [attendanceModal, setAttendanceModal] = useState<{
        studentId: number;
        studentName: string;
        isPresent: boolean;
    } | null>(null);
    const [selectedAttendanceType, setSelectedAttendanceType] = useState<number | null>(null);

    const [gradeModal, setGradeModal] = useState<{
        studentId: number;
        studentName: string;
        activity: string;
    } | null>(null);
    const [gradeForm, setGradeForm] = useState({
        is_complete: true,
        grade: '',
        actual_end_verse_id: '',
        notes: ''
    });

    // Fetch plan data for grade submission
    const { data: gradePlanData, isLoading: isLoadingGradePlan } = useStudentPlan(
        halaqaId,
        gradeModal?.studentId,
        gradeModal?.activity,
        !!gradeModal
    );

    // Fetch attendance types if not provided or empty
    const { data: attendanceTypesData } = useQuery({
        queryKey: ['attendance-types'],
        queryFn: () => teacherHalaqasService.getAttendanceTypes(),
        enabled: !attendanceTypes || attendanceTypes.length === 0,
        staleTime: 5 * 60 * 1000
    });

    // Use attendance types from props, or from API if not available
    const availableAttendanceTypes = useMemo(() => {
        if (attendanceTypes && attendanceTypes.length > 0) {
            return attendanceTypes;
        }
        return attendanceTypesData?.data ?? [];
    }, [attendanceTypes, attendanceTypesData]);

    const { data: planData, isLoading: isLoadingPlan, error: planError } = useStudentPlan(
        halaqaId,
        selectedPlan?.studentId,
        selectedPlan?.activity,
        !!selectedPlan
    );

    // Mutation for submitting attendance
    const attendanceMutation = useMutation({
        mutationFn: (data: { student_id: number; is_present: boolean; attendance_type_id?: number }) => {
            return teacherHalaqasService.submitAttendance(halaqaId!, data);
        },
        onSuccess: () => {
            // Invalidate and refetch students data
            queryClient.invalidateQueries({ queryKey: ['teacher-halaqa-students', halaqaId] });
            setAttendanceModal(null);
            setSelectedAttendanceType(null);
        }
    });

    // Mutation for submitting grade/memorization
    const gradeMutation = useMutation({
        mutationFn: (data: {
            student_id: number;
            activity: string;
            halaqa_plan_id: number;
            is_complete: boolean;
            grade: number;
            actual_end_verse_id: number;
            notes?: string;
        }) => {
            return teacherHalaqasService.submitMemorization(halaqaId!, data);
        },
        onSuccess: () => {
            // Invalidate and refetch students data
            queryClient.invalidateQueries({ queryKey: ['teacher-halaqa-students', halaqaId] });
            setGradeModal(null);
            setGradeForm({
                is_complete: true,
                grade: '',
                actual_end_verse_id: '',
                notes: ''
            });
        }
    });

    const handleActivityClick = (studentId: number, activity: string) => {
        setSelectedPlan({ studentId, activity });
    };

    const handleCloseModal = () => {
        setSelectedPlan(null);
    };

    const handleMarkAttendance = (studentId: number, studentName: string, isPresent: boolean) => {
        if (isPresent) {
            // Mark as present - no need for attendance type
            attendanceMutation.mutate({
                student_id: studentId,
                is_present: true
            });
        } else {
            // Mark as absent - need to show modal to select attendance type
            setAttendanceModal({ studentId, studentName, isPresent: false });
            setSelectedAttendanceType(null);
        }
    };

    const handleCloseAttendanceModal = () => {
        setAttendanceModal(null);
        setSelectedAttendanceType(null);
    };

    const handleSubmitAttendance = () => {
        if (!attendanceModal) return;
        
        if (!attendanceModal.isPresent && !selectedAttendanceType) {
            // Show error or validation message
            return;
        }

        attendanceMutation.mutate({
            student_id: attendanceModal.studentId,
            is_present: attendanceModal.isPresent,
            attendance_type_id: attendanceModal.isPresent ? undefined : selectedAttendanceType!
        });
    };

    const handleOpenGradeModal = (studentId: number, studentName: string, activity: string) => {
        setGradeModal({ studentId, studentName, activity });
        setGradeForm({
            is_complete: true,
            grade: '',
            actual_end_verse_id: '',
            notes: ''
        });
    };

    const handleCloseGradeModal = () => {
        setGradeModal(null);
        setGradeForm({
            is_complete: true,
            grade: '',
            actual_end_verse_id: '',
            notes: ''
        });
    };

    const handleSubmitGrade = () => {
        if (!gradeModal || !gradePlanData?.plan) return;

        const grade = Number(gradeForm.grade);
        const actualEndVerseId = Number(gradeForm.actual_end_verse_id);

        if (!grade || !actualEndVerseId) {
            // Show validation error
            return;
        }

        gradeMutation.mutate({
            student_id: gradeModal.studentId,
            activity: gradeModal.activity,
            halaqa_plan_id: gradePlanData.plan.id,
            is_complete: gradeForm.is_complete,
            grade: grade,
            actual_end_verse_id: actualEndVerseId,
            notes: gradeForm.notes || undefined
        });
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {students.map((student) => (
                    <div
                        key={student.id}
                        className="group p-5 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all duration-200"
                    >
                        <div className="flex items-start gap-4">
                            {/* Avatar */}
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-50 rounded-full flex items-center justify-center ring-2 ring-primary-50 group-hover:ring-primary-100 transition-all">
                                <UserIcon width={24} height={24} className="text-primary-600" />
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                {/* Name and Status Row */}
                                <div className="flex items-start justify-between gap-2 mb-3">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-semibold text-gray-900 truncate">
                                            {getLocalizedText(student.name) || `Student #${student.id}`}
                                        </h3>
                                    </div>
                                    
                                    {/* Status Badges */}
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        {/* Attendance Status */}
                                        {student.is_present !== null && (
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${
                                                student.is_present
                                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                                    : 'bg-red-50 text-red-700 border border-red-200'
                                            }`}>
                                                {student.is_present ? (
                                                    <CheckIcon width={12} height={12} className="text-green-600" />
                                                ) : (
                                                    <XIcon width={12} height={12} className="text-red-600" />
                                                )}
                                                {student.is_present ? t('halaqa.present', 'Present') : t('halaqa.absent', 'Absent')}
                                            </span>
                                        )}
                                        {/* Can Memorize Badge */}
                                        {student.can_memorize && (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shadow-sm">
                                                {t('halaqa.canMemorize', 'Can Memorize')}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions Section */}
                                <div className="space-y-3">
                                    {/* Attendance Actions - Show when is_present is null */}
                                    {student.is_present === null && (
                                        <div className="pb-3 border-b border-gray-100">
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                                {t('attendance.attendance', 'Attendance')}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    type="button"
                                                    onClick={() => handleMarkAttendance(student.id, getLocalizedText(student.name) || `Student #${student.id}`, true)}
                                                    size="sm"
                                                    variant="success"
                                                    loading={attendanceMutation.isPending && attendanceModal?.studentId === student.id && attendanceModal?.isPresent === true}
                                                    className="flex items-center gap-1.5"
                                                >
                                                    <CheckIcon width={14} height={14} />
                                                    {t('attendance.markPresent', 'Mark Present')}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    onClick={() => handleMarkAttendance(student.id, getLocalizedText(student.name) || `Student #${student.id}`, false)}
                                                    size="sm"
                                                    variant="danger"
                                                    loading={attendanceMutation.isPending && attendanceModal?.studentId === student.id && attendanceModal?.isPresent === false}
                                                    className="flex items-center gap-1.5"
                                                >
                                                    <XIcon width={14} height={14} />
                                                    {t('attendance.markAbsent', 'Mark Absent')}
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Grade Submission - Show for present students */}
                                    {student.is_present === true && student.activities && student.activities.length > 0 && (
                                        <div className="pb-3 border-b border-gray-100">
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                                                <ClipboardCheckIcon width={12} height={12} />
                                                {t('grade.submitGrade', 'Submit Grade')}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {student.activities.map((activity) => (
                                                    <Button
                                                        key={activity}
                                                        type="button"
                                                        onClick={() => handleOpenGradeModal(student.id, getLocalizedText(student.name) || `Student #${student.id}`, activity)}
                                                        size="sm"
                                                        variant="primary"
                                                        className="flex items-center gap-1.5"
                                                    >
                                                        <ClipboardCheckIcon width={14} height={14} />
                                                        {t(`halaqa.activity.${activity}`, activity)}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Activity Actions */}
                                    {student.activities && student.activities.length > 0 && (
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                                                <BookIcon width={12} height={12} />
                                                {t('halaqa.activities', 'Activities')}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {student.activities.map((activity) => (
                                                    <Button
                                                        key={activity}
                                                        type="button"
                                                        onClick={() => handleActivityClick(student.id, activity)}
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex items-center gap-1.5 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 transition-colors"
                                                    >
                                                        <BookIcon width={14} height={14} />
                                                        {t(`halaqa.activity.${activity}`, activity)}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Plan Details Modal */}
            {selectedPlan && (
                <div className="fixed inset-0 z-[60] overflow-y-auto">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black transition-opacity"
                        style={{ opacity: 0.5 }}
                        onClick={handleCloseModal}
                        aria-hidden="true"
                    />

                    {/* Modal */}
                    <div className="relative flex min-h-full items-center justify-center p-4 pt-20 md:pt-24">
                        <div className="relative w-full max-w-2xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all z-10 max-h-[calc(100vh-5rem)] md:max-h-[calc(100vh-6rem)]">
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
                            <div className="px-6 py-4 max-h-[calc(100vh-12rem)] md:max-h-[calc(100vh-14rem)] overflow-y-auto">
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

            {/* Attendance Modal */}
            {attendanceModal && (
                <div className="fixed inset-0 z-[60] overflow-y-auto">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black transition-opacity"
                        style={{ opacity: 0.5 }}
                        onClick={handleCloseAttendanceModal}
                        aria-hidden="true"
                    />

                    {/* Modal */}
                    <div className="relative flex min-h-full items-center justify-center p-4 pt-20 md:pt-24">
                        <div className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white shadow-xl transition-all z-10">
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {t('attendance.markAbsent', 'Mark Absent')}
                                </h3>
                                <button
                                    type="button"
                                    onClick={handleCloseAttendanceModal}
                                    className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                                    aria-label="Close"
                                >
                                    <XIcon width={20} height={20} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="px-6 py-4">
                                <p className="text-sm text-gray-600 mb-4">
                                    {t('attendance.selectType', 'Select attendance type for')} <span className="font-semibold text-gray-900">{attendanceModal.studentName}</span>
                                </p>
                                
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-gray-700">
                                        {t('attendance.attendanceType', 'Attendance Type')} <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={selectedAttendanceType || ''}
                                        onChange={(e) => setSelectedAttendanceType(Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    >
                                        <option value="">{t('attendance.selectType', 'Select attendance type')}</option>
                                        {availableAttendanceTypes.map((type) => (
                                            <option key={type.id} value={type.id}>
                                                {getLocalizedText(type.name)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
                                <Button
                                    variant="outline"
                                    onClick={handleCloseAttendanceModal}
                                    disabled={attendanceMutation.isPending}
                                >
                                    {t('common.cancel', 'Cancel')}
                                </Button>
                                <Button
                                    variant="danger"
                                    onClick={handleSubmitAttendance}
                                    loading={attendanceMutation.isPending}
                                    disabled={!selectedAttendanceType}
                                >
                                    {t('attendance.submit', 'Submit')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Grade Submission Modal */}
            {gradeModal && (
                <div className="fixed inset-0 z-[60] overflow-y-auto">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black transition-opacity"
                        style={{ opacity: 0.5 }}
                        onClick={handleCloseGradeModal}
                        aria-hidden="true"
                    />

                    {/* Modal */}
                    <div className="relative flex min-h-full items-center justify-center p-4 pt-20 md:pt-24">
                        <div className="relative w-full max-w-2xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all z-10 max-h-[calc(100vh-5rem)] md:max-h-[calc(100vh-6rem)]">
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {t('grade.submitGrade', 'Submit Grade')} - {t(`halaqa.activity.${gradeModal.activity}`, gradeModal.activity)}
                                </h3>
                                <button
                                    type="button"
                                    onClick={handleCloseGradeModal}
                                    className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                                    aria-label="Close"
                                >
                                    <XIcon width={20} height={20} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="px-6 py-4 max-h-[calc(100vh-12rem)] md:max-h-[calc(100vh-14rem)] overflow-y-auto">
                                {isLoadingGradePlan ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />
                                            <p className="text-sm text-gray-600">{t('common.loading', 'Loading...')}</p>
                                        </div>
                                    </div>
                                ) : gradePlanData ? (
                                    <div className="space-y-4">
                                        {/* Student Info */}
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <p className="text-sm font-medium text-gray-900">
                                                {t('grade.student', 'Student')}: <span className="font-semibold">{gradeModal.studentName}</span>
                                            </p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {t('grade.activity', 'Activity')}: {t(`halaqa.activity.${gradeModal.activity}`, gradeModal.activity)}
                                            </p>
                                        </div>

                                        {/* Plan Info Reference */}
                                        {gradePlanData.today_schedule && (
                                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                                <p className="text-xs font-medium text-blue-900 mb-2">
                                                    {t('grade.expectedRange', 'Expected Verse Range')}
                                                </p>
                                                <p className="text-sm text-blue-800">
                                                    {t('plan.verseRange', 'From verse {{from}} to verse {{to}}', {
                                                        from: gradePlanData.today_schedule.from_verse_id,
                                                        to: gradePlanData.today_schedule.to_verse_id
                                                    })}
                                                </p>
                                            </div>
                                        )}

                                        {/* Form Fields */}
                                        <div className="space-y-4">
                                            {/* Is Complete */}
                                            <div>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={gradeForm.is_complete}
                                                        onChange={(e) => setGradeForm({ ...gradeForm, is_complete: e.target.checked })}
                                                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                                    />
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {t('grade.isComplete', 'Is Complete')}
                                                    </span>
                                                </label>
                                            </div>

                                            {/* Grade */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    {t('grade.grade', 'Grade')} <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={gradePlanData.total_mark || 100}
                                                    value={gradeForm.grade}
                                                    onChange={(e) => setGradeForm({ ...gradeForm, grade: e.target.value })}
                                                    placeholder={t('grade.gradePlaceholder', 'Enter grade')}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                />
                                                {gradePlanData.total_mark && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {t('grade.maxGrade', 'Maximum grade')}: {gradePlanData.total_mark}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Actual End Verse ID */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    {t('grade.actualEndVerse', 'Actual End Verse ID')} <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={gradeForm.actual_end_verse_id}
                                                    onChange={(e) => setGradeForm({ ...gradeForm, actual_end_verse_id: e.target.value })}
                                                    placeholder={t('grade.actualEndVersePlaceholder', 'Enter actual end verse ID')}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                />
                                            </div>

                                            {/* Notes */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    {t('grade.notes', 'Notes')}
                                                </label>
                                                <textarea
                                                    value={gradeForm.notes}
                                                    onChange={(e) => setGradeForm({ ...gradeForm, notes: e.target.value })}
                                                    placeholder={t('grade.notesPlaceholder', 'Enter notes (optional)')}
                                                    rows={3}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-right"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
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
                                                {t('plan.loadError', 'Error loading plan')}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            {gradePlanData && (
                                <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
                                    <Button
                                        variant="outline"
                                        onClick={handleCloseGradeModal}
                                        disabled={gradeMutation.isPending}
                                    >
                                        {t('common.cancel', 'Cancel')}
                                    </Button>
                                    <Button
                                        variant="primary"
                                        onClick={handleSubmitGrade}
                                        loading={gradeMutation.isPending}
                                        disabled={!gradeForm.grade || !gradeForm.actual_end_verse_id}
                                    >
                                        {t('grade.submit', 'Submit Grade')}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherHalaqaStudents;

