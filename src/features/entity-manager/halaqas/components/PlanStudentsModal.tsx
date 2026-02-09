import React from 'react';
import { useTranslation } from 'react-i18next';
import { XIcon } from '@/globals/icons';
import Button from '@/globals/components/ui/Button';

interface PlanStudentsModalProps {
    isOpen: boolean;
    students: Array<{ id: number; name?: { en?: string; ar?: string } | string }>;
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
    currentLang = 'en'
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
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black transition-opacity"
                style={{ opacity: 0.5 }}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal */}
            <div className="relative flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white shadow-xl transition-all z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {t('plan.students', 'Students')} ({students.length})
                        </h3>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                            aria-label="Close"
                        >
                            <XIcon width={20} height={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
                        {students.length > 0 ? (
                            <div className="space-y-2">
                                {students.map((student, index) => (
                                    <div
                                        key={student.id || index}
                                        className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                                    >
                                        <p className="text-sm font-medium text-gray-800">
                                            {getLocalizedText(student.name) || `Student #${student.id}`}
                                        </p>
                                        {student.id && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                ID: {student.id}
                                            </p>
                                        )}
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



