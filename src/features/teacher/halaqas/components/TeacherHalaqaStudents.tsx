import React from 'react';
import { useTranslation } from 'react-i18next';
import { UsersIcon, UserIcon, CircleIcon, AlertTriangleIcon } from '@/globals/icons';
import type { HalaqaStudent, BilingualName } from '../types/students.types';

interface TeacherHalaqaStudentsProps {
    students: HalaqaStudent[];
    isLoading?: boolean;
    error?: any;
    getLocalizedText: (obj: BilingualName | string | null | undefined) => string;
}

const TeacherHalaqaStudents: React.FC<TeacherHalaqaStudentsProps> = ({
    students,
    isLoading,
    error,
    getLocalizedText
}) => {
    const { t } = useTranslation();

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
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                <UserIcon width={20} height={20} className="text-primary-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                    {getLocalizedText(student.name) || `Student #${student.id}`}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    {/* Attendance Status */}
                                    {student.is_present !== null && (
                                        <div className="flex items-center gap-1">
                                            {student.is_present ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                    <CircleIcon width={12} height={12} className="fill-current" />
                                                    {t('halaqa.present', 'Present')}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                    <CircleIcon width={12} height={12} className="fill-current" />
                                                    {t('halaqa.absent', 'Absent')}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    {/* Can Memorize Badge */}
                                    {student.can_memorize && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                            {t('halaqa.canMemorize', 'Can Memorize')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TeacherHalaqaStudents;

