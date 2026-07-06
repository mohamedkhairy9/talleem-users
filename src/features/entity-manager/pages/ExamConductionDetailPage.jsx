import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/app/stores';
import { AlertTriangleIcon, ClipboardCheckIcon, EyeIcon, UsersIcon } from '@/shared/icons';
import { Button, PageHeader, Table } from '@/shared/components';
import { useDateFormatStore } from '@/app/stores/dateFormat.store';
import { getLocalizedText } from '@/shared/utils/helpers/getLocalizedText';
import { formatTimePart, getDisplayDate } from '@/shared/utils/helpers/dateFormatter';
import {
    useConductExamDetail,
    useConductExamSessionWindowConfig,
    useStudentExamResultsMap
} from '@/features/entity-manager/exam-conduction/hooks/useExamConduction';
import StartExamModal from '@/features/entity-manager/exam-conduction/components/StartExamModal';
import {
    formatExamConductionWindow,
    getExamConductionAvailability
} from '@/features/entity-manager/exam-conduction/utils/examAvailability';
import { getExamStartPermission } from '@/features/entity-manager/exam-conduction/utils/examStartPermissions';

const CARD_CLASS = 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm';

const InfoRow = ({ label, value }) => (
    <div className="grid grid-cols-1 gap-1 border-b border-gray-100 pb-3 last:border-b-0 last:pb-0 md:grid-cols-[170px_minmax(0,1fr)]">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <span className="text-sm text-gray-900">{value || '-'}</span>
    </div>
);

const DetailCard = ({ title, children }) => (
    <section className={CARD_CLASS}>
        <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>
        <div className="space-y-4">{children}</div>
    </section>
);

function getTimeRange(exam) {
    return `${formatTimePart(exam?.time_from)} - ${formatTimePart(exam?.time_to)}`;
}

function getSegmentLabel(exam, currentLang, t) {
    return getLocalizedText(exam?.exam_segment?.name, currentLang, t('common.not_available', 'N/A'));
}

function getEntityLabel(exam, currentLang, t) {
    return getLocalizedText(exam?.entity?.name, currentLang, t('common.not_available', 'N/A'));
}

function getResponsibleLabel(exam, t) {
    return t(
        `scheduledExams.responsibleOptions.${exam?.responsible === 'general_management' ? 'generalManagement' : exam?.responsible}`,
        exam?.responsible ?? '-'
    );
}

const ExamConductionDetailPage = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { id, lang } = useParams();
    const currentLang = i18n.language || lang || 'ar';
    const actingRole = useAuthStore((state) => state.actingRole ??
        state.user?.entity?.role ??
        state.user?.entity?.roles ??
        state.user?.roles ??
        null);
    useDateFormatStore((state) => state.dateFormat);
    const { exam, isLoading, error } = useConductExamDetail(id || '');
    const { beforeMinutes, afterMinutes } = useConductExamSessionWindowConfig();
    const [selectedStudent, setSelectedStudent] = useState(null);

    const students = Array.isArray(exam?.students) ? exam.students : [];
    const { resultsMap } = useStudentExamResultsMap(id || '', students, {
        enabled: Boolean(id) && students.length > 0
    });
    const examAvailability = useMemo(() => getExamConductionAvailability(exam, {
        beforeMinutes,
        afterMinutes
    }), [afterMinutes, beforeMinutes, exam]);
    const startPermission = useMemo(
        () => getExamStartPermission(exam?.responsible, actingRole),
        [actingRole, exam?.responsible]
    );
    const conductionWindowLabel = useMemo(
        () => formatExamConductionWindow(examAvailability.window, currentLang),
        [currentLang, examAvailability.window]
    );
    const responsibilityLabel = useMemo(
        () => getResponsibleLabel(exam, t),
        [exam, t]
    );
    const startPermissionMessage = useMemo(
        () => t(
            'examConduction.validation.startNotAllowedForResponsible',
            'Only the responsible side assigned to this exam can start it. This exam belongs to {{responsible}}.',
            { responsible: responsibilityLabel }
        ),
        [responsibilityLabel, t]
    );

    const columns = useMemo(() => ([
        {
            header: t('examConduction.table.student', 'Student'),
            accessor: (row) => row?.name || '-',
            minWidth: 180
        },
        {
            header: t('examConduction.table.juzNumbers', 'Juz Numbers'),
            accessor: (row) => Array.isArray(row?.juz_numbers) && row.juz_numbers.length > 0
                ? row.juz_numbers.join(', ')
                : '-',
            minWidth: 180
        },
        {
            header: t('examConduction.table.examStatus', 'Exam Status'),
            accessor: (row) => {
                const studentResultState = resultsMap[row?.id];

                return (
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                        studentResultState?.isCompleted
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                    }`}
                    >
                        {studentResultState?.isCompleted
                            ? t('examConduction.completedResult', 'Completed')
                            : t('examConduction.pendingResult', 'Pending')}
                    </span>
                );
            },
            minWidth: 160
        }
    ]), [resultsMap, t]);

    const handleBack = () => {
        navigate(`/${lang || 'ar'}/exam-conduction`);
    };

    const handleViewResult = (student) => {
        navigate(`/${lang || 'ar'}/exam-conduction/${id}/students/${student?.id}/result`);
    };

    const handleStartExam = (student) => {
        if (resultsMap[student?.id]?.isCompleted) {
            toast.error(t('examConduction.validation.examAlreadyCompleted', 'This student exam is already completed. You can view the result instead.'));
            return;
        }

        if (!startPermission.canStart) {
            toast.error(startPermissionMessage);
            return;
        }

        if (!examAvailability.isAvailable) {
            toast.error(t(
                'examConduction.validation.examOutsideWindow',
                'This exam is not available right now. It can only be conducted within the configured time window before or after the scheduled session.'
            ));
            return;
        }

        setSelectedStudent(student);
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

    if (error || !exam) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
                <div className="text-center">
                    <AlertTriangleIcon width={64} height={64} className="mx-auto mb-4 text-red-500" />
                    <h2 className="mb-2 text-2xl font-bold text-gray-900">
                        {t('examConduction.notFound', 'Exam conduction data not found.')}
                    </h2>
                    <p className="text-gray-600">
                        {error?.message || t('examConduction.loadDetailError', 'Error loading exam conduction details. Please try again.')}
                    </p>
                </div>
                <Button type="button" variant="primary" onClick={handleBack}>
                    {t('examConduction.backToList', 'Back to Exam Conduction')}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={t('examConduction.detailTitle', 'Exam Conduction Details')}
                subtitle={t('examConduction.detailSubtitle', 'Review the exam and start conducting it for students.')}
                breadcrumb={{
                    label: t('examConduction.backToList', 'Back to Exam Conduction'),
                    onClick: handleBack
                }}
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <DetailCard title={t('examConduction.detail.schedule', 'Schedule')}>
                        <InfoRow label={t('examConduction.table.entity', 'Entity')} value={getEntityLabel(exam, currentLang, t)} />
                        <InfoRow label={t('examConduction.table.segment', 'Segment')} value={getSegmentLabel(exam, currentLang, t)} />
                        <InfoRow label={t('examConduction.table.date', 'Date')} value={getDisplayDate(exam?.exam_date)} />
                        <InfoRow label={t('examConduction.table.time', 'Time')} value={getTimeRange(exam)} />
                        <InfoRow label={t('examConduction.table.conductionWindow', 'Conduction Window')} value={conductionWindowLabel} />
                        <InfoRow label={t('scheduledExams.table.responsible', 'Responsible')} value={responsibilityLabel} />
                        <InfoRow label={t('examConduction.table.location', 'Location')} value={exam?.location || '-'} />
                        <InfoRow label={t('examConduction.table.availability', 'Availability')} value={examAvailability.isAvailable ? t('examConduction.available', 'Available') : t('examConduction.unavailable', 'Unavailable')} />
                    </DetailCard>

                    <section className={CARD_CLASS}>
                        {!startPermission.canStart ? (
                            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                {startPermissionMessage}
                            </div>
                        ) : null}

                        <div className="mb-4 flex items-center justify-between gap-3">
                            <h2 className="text-lg font-semibold text-gray-900">
                                {t('examConduction.detail.students', 'Students')}
                            </h2>
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e7f5f3] text-primary-600">
                                <UsersIcon width={18} height={18} />
                            </div>
                        </div>

                        <Table
                            columns={columns}
                            data={students}
                            loading={false}
                            emptyMessage={t('examConduction.noStudents', 'No students assigned to this exam.')}
                            rowClassName={(row) => (
                                resultsMap[row?.id]?.isCompleted
                                    ? 'bg-emerald-50/60'
                                    : ''
                            )}
                            actionButtons={{
                                customActions: [
                                    {
                                        key: 'start',
                                        label: t('examConduction.startExam', 'Start Exam'),
                                        title: t('examConduction.startExam', 'Start Exam'),
                                        icon: ClipboardCheckIcon,
                                        disabled: (row) => resultsMap[row?.id]?.isCompleted || !examAvailability.isAvailable,
                                        onClick: handleStartExam
                                    },
                                    {
                                        key: 'result',
                                        label: t('examConduction.viewResult', 'View Result'),
                                        title: t('examConduction.viewResult', 'View Result'),
                                        icon: EyeIcon,
                                        disabled: (row) => !resultsMap[row?.id]?.isCompleted,
                                        onClick: handleViewResult
                                    }
                                ]
                            }}
                        />
                    </section>
                </div>

                <div className="space-y-6">
                    <DetailCard title={t('examConduction.detail.teachers', 'Teachers')}>
                        {Array.isArray(exam?.teachers) && exam.teachers.length > 0 ? (
                            <div className="space-y-3">
                                {exam.teachers.map((teacher, index) => (
                                    <div key={teacher?.id ?? index} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900">
                                        {getLocalizedText(teacher?.name, currentLang, '-')}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">{t('examConduction.noTeachers', 'No teachers assigned.')}</p>
                        )}
                    </DetailCard>
                </div>
            </div>

            <StartExamModal
                isOpen={selectedStudent != null}
                onClose={() => setSelectedStudent(null)}
                exam={exam}
                student={selectedStudent}
            />
        </div>
    );
};

export default ExamConductionDetailPage;
