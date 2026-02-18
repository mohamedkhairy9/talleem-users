import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpenIcon, CalendarIcon } from '@/globals/icons';
import { Button } from '@/globals/components';
import PlanScheduleModal from './PlanScheduleModal';
import type { Plan, Student } from '../types';

interface HalaqaPlanCardProps {
    plan: Plan;
    planStudents: Student[];
    onViewStudents: () => void;
    onViewDetails?: () => void;
    getLocalizedText: (obj: { en?: string; ar?: string } | string | null | undefined) => string;
}

const HalaqaPlanCard: React.FC<HalaqaPlanCardProps> = ({
    plan,
    planStudents,
    onViewStudents,
    getLocalizedText
}) => {
    const { t } = useTranslation();
    const [showScheduleModal, setShowScheduleModal] = useState(false);

    const hasSchedule = plan.daily_schedule && plan.daily_schedule.length > 0;
    const scheduleCount = plan.daily_schedule?.length || 0;

    // Get plan title for modal
    const planTitle = `${String(t(`halaqa.activity.${plan.activity}`, plan.activity))} - ${planStudents.length > 0 ? getLocalizedText(planStudents[0]?.name) : t('plan.plan', 'Plan')}`;

    return (
        <>
            <div 
                className="p-5 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all"
            >
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-100 rounded-lg">
                            <BookOpenIcon width={16} height={16} className="text-indigo-600" />
                        </div>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-100 text-purple-800">
                            {String(t(`halaqa.activity.${plan.activity}`, plan.activity))}
                        </span>
                    </div>
                </div>
                <div className="space-y-3">
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                            {t('plan.student', 'Student')}
                        </p>
                        {planStudents.length > 0 ? (
                            <button
                                type="button"
                                onClick={onViewStudents}
                                className="text-sm font-semibold text-primary-600 hover:text-primary-700 hover:underline text-left"
                            >
                                {planStudents.length === 1
                                    ? getLocalizedText(planStudents[0]?.name) || `Student #${plan.student_id}`
                                    : String(t('plan.studentCount', '{{count}} students', { count: planStudents.length }))}
                            </button>
                        ) : (
                            <p className="text-sm font-medium text-gray-400">-</p>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                {t('plan.planType', 'Type')}
                            </p>
                            <p className="text-sm font-semibold text-gray-900">
                                {String(t(`plan.type.${plan.plan_type}`, plan.plan_type))}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                {t('plan.unit', 'Unit')}
                            </p>
                            <p className="text-sm font-semibold text-gray-900">
                                {String(t(`plan.unit.${plan.unit}`, plan.unit))}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                {t('plan.direction', 'Direction')}
                            </p>
                            <p className="text-sm font-semibold text-gray-900">
                                {String(t(`plan.direction.${plan.direction}`, plan.direction))}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                {t('plan.dailyAmount', 'Daily')}
                            </p>
                            <p className="text-sm font-semibold text-gray-900">{plan.daily_amount || '-'}</p>
                        </div>
                    </div>

                    {/* Verse Range Info */}
                    {(plan.start_verse_key || plan.end_verse_key) && (
                        <div className="pt-3 border-t border-gray-200">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                {t('plan.verseRange', 'Verse Range')}
                            </p>
                            <p className="text-sm font-semibold text-gray-900">
                                {plan.start_verse_key || '?'} - {plan.end_verse_key || '?'}
                            </p>
                        </div>
                    )}

                    {/* Schedule Button */}
                    {hasSchedule && (
                        <div className="pt-3 border-t border-gray-200">
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => setShowScheduleModal(true)}
                                className="w-full"
                            >
                                <CalendarIcon width={16} height={16} className="me-2" />
                                {t('plan.viewSchedule', 'View Daily Schedule')}
                                {scheduleCount > 0 && (
                                    <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs font-semibold">
                                        {scheduleCount}
                                    </span>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Schedule Modal */}
            {hasSchedule && (
                <PlanScheduleModal
                    isOpen={showScheduleModal}
                    onClose={() => setShowScheduleModal(false)}
                    dailySchedule={plan.daily_schedule || []}
                    planTitle={planTitle}
                />
            )}
        </>
    );
};

export default HalaqaPlanCard;

