import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangleIcon, BookOpenIcon, CalendarIcon, TeacherIcon } from '@/shared/icons';
import { Button, PageHeader } from '@/shared/components';
import { useDateFormatStore } from '@/app/stores/dateFormat.store';
import { formatTimePart, getDisplayDate } from '@/shared/utils/helpers/dateFormatter';
import { getLocalizedText } from '@/shared/utils/helpers/getLocalizedText';
import { useStudentExamResult } from '@/features/entity-manager/exam-conduction/hooks/useExamConduction';

const CARD_CLASS = 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm';

const InfoRow = ({ label, value }) => (
    <div className="grid grid-cols-1 gap-1 border-b border-gray-100 pb-3 last:border-b-0 last:pb-0 md:grid-cols-[170px_minmax(0,1fr)]">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <span className="text-sm text-gray-900">{value || '-'}</span>
    </div>
);

const ResultCard = ({ icon: Icon, title, children }) => (
    <section className={CARD_CLASS}>
        <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e7f5f3] text-primary-600">
                <Icon width={18} height={18} />
            </div>
        </div>
        <div className="space-y-4">{children}</div>
    </section>
);

function getTimeRange(exam) {
    return `${formatTimePart(exam?.time_from)} - ${formatTimePart(exam?.time_to)}`;
}

const ExamConductionResultPage = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { scheduledExamId, studentId, lang } = useParams();
    const currentLang = i18n.language || lang || 'ar';
    useDateFormatStore((state) => state.dateFormat);
    const { result, isLoading, error } = useStudentExamResult(scheduledExamId || '', studentId || '');

    const handleBack = () => {
        navigate(`/${lang || 'ar'}/exam-conduction/${scheduledExamId}`);
    };

    if (isLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
                    <p className="text-sm text-gray-600">{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    if (error || !result) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
                <div className="text-center">
                    <AlertTriangleIcon width={64} height={64} className="mx-auto mb-4 text-red-500" />
                    <h2 className="mb-2 text-2xl font-bold text-gray-900">
                        {t('examConduction.resultNotFound', 'Exam result not found.')}
                    </h2>
                    <p className="text-gray-600">
                        {error?.message || t('examConduction.loadResultError', 'Error loading exam result. Please try again.')}
                    </p>
                </div>
                <Button type="button" variant="primary" onClick={handleBack}>
                    {t('examConduction.backToDetail', 'Back to Exam Details')}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={t('examConduction.resultTitle', 'Exam Result')}
                subtitle={t('examConduction.resultSubtitle', 'Review the submitted result for the selected student.')}
                breadcrumb={{
                    label: t('examConduction.backToDetail', 'Back to Exam Details'),
                    onClick: handleBack
                }}
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-1">
                    <ResultCard icon={TeacherIcon} title={t('examConduction.resultSummary', 'Result Summary')}>
                        <InfoRow label={t('examConduction.student', 'Student')} value={result?.student?.name || '-'} />
                        <InfoRow label={t('examConduction.examType', 'Exam Type')} value={t(`examConduction.types.${result?.exam_type || 'maqata3'}`, result?.exam_type || '-')} />
                        <InfoRow label={t('examConduction.status', 'Status')} value={t(`examConduction.statuses.${result?.status || 'completed'}`, result?.status || '-')} />
                        <InfoRow label={t('examConduction.finalGrade', 'Final Grade')} value={result?.final_grade ?? '-'} />
                        <InfoRow label={t('examConduction.conductedBy', 'Conducted By')} value={result?.conducted_by?.name || '-'} />
                    </ResultCard>
                </div>

                <div className="space-y-6 lg:col-span-2">
                    <ResultCard icon={CalendarIcon} title={t('examConduction.detail.schedule', 'Schedule')}>
                        <InfoRow label={t('examConduction.table.date', 'Date')} value={getDisplayDate(result?.scheduled_exam?.exam_date)} />
                        <InfoRow label={t('examConduction.table.time', 'Time')} value={getTimeRange(result?.scheduled_exam)} />
                        <InfoRow label={t('examConduction.table.segment', 'Segment')} value={getLocalizedText(result?.scheduled_exam?.exam_segment?.name, currentLang, '-')} />
                    </ResultCard>

                    <ResultCard icon={BookOpenIcon} title={t('examConduction.segmentResults', 'Segment Results')}>
                        <div className="space-y-4">
                            {(Array.isArray(result?.segments) ? result.segments : []).map((segment) => (
                                <div key={segment?.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900">
                                                {t('examConduction.segmentLabel', 'Segment')} #{segment?.order ?? '-'}
                                            </h3>
                                            <p className="text-xs text-gray-500">
                                                {t('examConduction.juzLabel', 'Juz')} {segment?.juz_number ?? '-'}
                                            </p>
                                        </div>
                                        <div className="rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700">
                                            {t('examConduction.columnTotal', 'Total')}: {segment?.column_total ?? '-'}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        {(Array.isArray(segment?.grades) ? segment.grades : []).map((gradeItem) => (
                                            <div key={gradeItem?.id ?? `${segment?.id}-${gradeItem?.criteria_id}`} className="rounded-lg border border-gray-200 bg-white p-3">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {getLocalizedText(gradeItem?.criteria_name, currentLang, '-')}
                                                </p>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    {t('examConduction.maxDegree', 'Max Degree')}: {gradeItem?.max_degree ?? '-'}
                                                </p>
                                                <p className="mt-2 text-base font-semibold text-primary-700">
                                                    {gradeItem?.grade ?? '-'}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ResultCard>
                </div>
            </div>
        </div>
    );
};

export default ExamConductionResultPage;
