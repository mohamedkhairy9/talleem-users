import React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useHalaqa } from '@/features/halaqas/hooks/useHalaqas';
import { Button } from '@/globals/components';
import { formatDate } from '@/utils';

/**
 * Halaqa Detail Page
 * Displays detailed information about a specific halaqa
 */
const HalaqaDetailPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { id, lang } = useParams<{ id: string; lang: string }>();
    const navigate = useNavigate();
    const currentLang = i18n.language || lang || 'en';

    const { data, isLoading, error } = useHalaqa(id || '');

    // API returns { data: { id, name, ... } }; axios puts body in response.data
    const raw = data?.data;
    const halaqa = raw && typeof raw === 'object' && 'data' in raw ? (raw as { data: any }).data : raw;

    const getLocalizedText = (obj: { en?: string; ar?: string } | string | null | undefined): string => {
        if (typeof obj === 'string') return obj;
        if (obj && currentLang === 'ar' && obj.ar) return obj.ar;
        if (obj && obj.en) return obj.en;
        return t('common.not_available', 'N/A');
    };

    const handleBack = () => {
        navigate(`/${lang || currentLang}/halaqas`);
    };

    const handleEdit = () => {
        navigate(`/${lang || currentLang}/halaqas/${id}/edit`);
    };

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
            </div>
        );
    }

    if (error || !halaqa) {
        return (
            <div className="p-6">
                <div className="text-center py-12 text-red-600">
                    {t('halaqa.notFound', 'Halaqa not found')}
                </div>
                <div className="flex justify-center">
                    <Button type="button" variant="secondary" onClick={handleBack}>
                        {t('common.back', 'Back')}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {getLocalizedText(halaqa.name)}
                    </h1>
                    <p className="text-gray-600">
                        {t('halaqa.detailDescription', 'View halaqa details')}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button type="button" variant="secondary" onClick={handleBack}>
                        {t('common.back', 'Back')}
                    </Button>
                    <Button type="button" variant="primary" onClick={handleEdit}>
                        {t('common.edit', 'Edit')}
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                {/* Basic Information */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                        {t('halaqa.basicInfo', 'Basic Information')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">{t('halaqa.name', 'Name')}</p>
                            <p className="text-base text-gray-800">{getLocalizedText(halaqa.name)}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">{t('halaqa.teacher', 'Teacher')}</p>
                            <p className="text-base text-gray-800">{getLocalizedText(halaqa.teacher?.name)}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">{t('halaqa.memorizationProgramEntityType', 'Entity Type')}</p>
                            <p className="text-base text-gray-800">
                                {getLocalizedText(halaqa.memorization_program_entity_type?.name)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">{t('halaqa.period', 'Period')}</p>
                            <p className="text-base text-gray-800">
                                {halaqa.period ? t(`halaqa.period.${halaqa.period}`, halaqa.period) : '-'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">{t('halaqa.teachingMethod', 'Teaching Method')}</p>
                            <p className="text-base text-gray-800">
                                {halaqa.teaching_method
                                    ? t(
                                          `halaqa.teachingMethod.${halaqa.teaching_method === 'in_person' ? 'inPerson' : halaqa.teaching_method}`,
                                          halaqa.teaching_method
                                      )
                                    : '-'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">{t('halaqa.platform', 'Platform')}</p>
                            <p className="text-base text-gray-800">{getLocalizedText(halaqa.platform?.name)}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">{t('halaqa.students', 'Students')}</p>
                            <p className="text-base text-gray-800">
                                {[halaqa.current_students_count, halaqa.students?.length].find((n) => n != null) ?? '-'}
                                {halaqa.max_students != null ? ` / ${halaqa.max_students}` : ''}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Dates */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                        {t('halaqa.dates', 'Dates')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">{t('halaqa.startDate', 'Start Date')}</p>
                            <p className="text-base text-gray-800">
                                {formatDate(halaqa.start_date)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">{t('halaqa.endDate', 'End Date')}</p>
                            <p className="text-base text-gray-800">
                                {formatDate(halaqa.end_date)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">{t('halaqa.sessionTime', 'Session Time')}</p>
                            <p className="text-base text-gray-800">{halaqa.session_time || '-'}</p>
                        </div>
                    </div>
                </div>

                {/* Activities */}
                {halaqa.activities && halaqa.activities.length > 0 && (
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">
                            {t('halaqa.activities', 'Activities')}
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {halaqa.activities.map((activity: string, index: number) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                                >
                                    {t(`halaqa.activity.${activity}`, activity)}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Students */}
                {halaqa.students && halaqa.students.length > 0 && (
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">
                            {t('halaqa.students', 'Students')} ({halaqa.students.length})
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {halaqa.students.map((student: { id: number; name?: { en?: string; ar?: string }; joined_at?: string }, index: number) => (
                                <div key={student.id || index} className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm font-medium text-gray-800">
                                        {getLocalizedText(student.name) || `Student #${student.id}`}
                                    </p>
                                    {student.joined_at && (
                                        <p className="text-xs text-gray-500">
                                            {t('halaqa.joinedAt', 'Joined')}: {formatDate(student.joined_at)}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Duration / extra info */}
                {(halaqa.duration_in_days != null || halaqa.weekly_holiday || halaqa.evaluation_system) && (
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('halaqa.extraInfo', 'Additional Info')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {halaqa.duration_in_days != null && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">{t('halaqa.durationInDays', 'Duration (days)')}</p>
                                    <p className="text-base text-gray-800">{halaqa.duration_in_days}</p>
                                </div>
                            )}
                            {halaqa.weekly_holiday && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">{t('halaqa.weeklyHoliday', 'Weekly holiday')}</p>
                                    <p className="text-base text-gray-800">{halaqa.weekly_holiday}</p>
                                </div>
                            )}
                            {halaqa.evaluation_system && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">{t('halaqa.evaluationSystem', 'Evaluation system')}</p>
                                    <p className="text-base text-gray-800">{halaqa.evaluation_system}</p>
                                </div>
                            )}
                            {halaqa.total_mark != null && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">{t('halaqa.totalMark', 'Total mark')}</p>
                                    <p className="text-base text-gray-800">{halaqa.total_mark}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HalaqaDetailPage;

