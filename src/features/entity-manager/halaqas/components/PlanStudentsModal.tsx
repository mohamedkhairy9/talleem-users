import React from 'react';
import { useTranslation } from 'react-i18next';
import { XIcon } from '@/globals/icons';
import Button from '@/globals/components/ui/Button';
import type { Student } from '../types';

interface PlanStudentsModalProps {
    isOpen: boolean;
    students: Student[];
    onClose: () => void;
    currentLang?: string;
}

/**
 * Plan Students Modal Component
 * Displays list of students associated with a plan
 */
const PlanStudentsModal: React.FC<PlanStudentsModalProps> = ({
    isOpen,
    students,
    onClose,
    currentLang = 'ar'
}) => {
    const { t } = useTranslation();

    if (!isOpen) return null;

    const getLocalizedText = (obj: { en?: string; ar?: string } | string | null | undefined): string => {
        if (typeof obj === 'string') return obj;
        if (!obj) return t('common.not_available', 'N/A');
        if (currentLang === 'ar' && obj.ar) return obj.ar;
        if (obj.en) return obj.en;
        return t('common.not_available', 'N/A');
    };

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black transition-opacity"
                style={{ opacity: 0.5 }}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal */}
            <div className="relative flex min-h-full items-center justify-center p-4 pt-20 md:pt-24">
                <div className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white shadow-xl transition-all z-10 max-h-[calc(100vh-5rem)] md:max-h-[calc(100vh-6rem)]">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {t('plan.students', 'Students')} ({students.length})
                        </h3>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                            aria-label={t('common.close')}
                        >
                            <XIcon width={20} height={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-4 max-h-[calc(100vh-12rem)] md:max-h-[calc(100vh-14rem)] overflow-y-auto">
                        {students.length > 0 ? (
                            <div className="space-y-3">
                                {students.map((student, index) => (
                                    <div
                                        key={student.id || index}
                                        className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-gray-900 mb-2">
                                                    {getLocalizedText(student.name) || t('plan.studentId', { id: student.id })}
                                                </p>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    {student.national_id && (
                                                        <div>
                                                            <span className="text-gray-500">{t('student.nationalId')}: </span>
                                                            <span className="text-gray-700 font-medium">{student.national_id}</span>
                                                        </div>
                                                    )}
                                                    {student.phone && (
                                                        <div>
                                                            <span className="text-gray-500">{t('student.phone')}: </span>
                                                            <span className="text-gray-700 font-medium">{student.phone}</span>
                                                        </div>
                                                    )}
                                                    {student.email && (
                                                        <div>
                                                            <span className="text-gray-500">{t('student.email')}: </span>
                                                            <span className="text-gray-700 font-medium">{student.email}</span>
                                                        </div>
                                                    )}
                                                    {student.gender && (
                                                        <div>
                                                            <span className="text-gray-500">{t('student.gender')}: </span>
                                                            <span className="text-gray-700 font-medium capitalize">{student.gender}</span>
                                                        </div>
                                                    )}
                                                    {student.school_name && (
                                                        <div>
                                                            <span className="text-gray-500">{t('student.school')}: </span>
                                                            <span className="text-gray-700 font-medium">{student.school_name}</span>
                                                        </div>
                                                    )}
                                                    {student.registration_date && (
                                                        <div>
                                                            <span className="text-gray-500">{t('student.registered')}: </span>
                                                            <span className="text-gray-700 font-medium">
                                                                {new Date(student.registration_date).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {student.id && (
                                                <div className="ml-4 text-xs text-gray-400">
                                                    {t('common.id')}: {student.id}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                {t('plan.noStudents', 'No students found')}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end border-t border-gray-200 bg-gray-50 px-6 py-4">
                        <Button
                            variant="primary"
                            onClick={onClose}
                        >
                            {t('common.close', 'Close')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlanStudentsModal;



